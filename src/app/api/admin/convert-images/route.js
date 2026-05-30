// app/api/convert-images/route.js
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import ProductModal from "@/app/DBconfig/models/product";
import { NextResponse } from "next/server";
import sharp from 'sharp';
import crypto from 'crypto';

// Configuration pour Vercel
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Configuration de Cloudinary avec signature dynamique
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

// Fonction pour générer une signature Cloudinary
function generateCloudinarySignature(publicId, timestamp) {
  const signatureString = `public_id=${publicId}&timestamp=${timestamp}${cloudinaryConfig.api_secret}`;
  return crypto.createHash('sha1').update(signatureString).digest('hex');
}

// Fonction utilitaire pour uploader vers Cloudinary avec signature fraîche
async function uploadToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    // Générer un timestamp actuel
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Générer la signature
    const signature = generateCloudinarySignature(publicId, timestamp);
    
    const formData = new FormData();
    formData.append('file', new Blob([buffer]), 'image.webp');
    formData.append('public_id', publicId);
    formData.append('format', 'webp');
    formData.append('quality', 'auto:good');
    formData.append('overwrite', 'true');
    formData.append('timestamp', timestamp);
    formData.append('api_key', cloudinaryConfig.api_key);
    formData.append('signature', signature);

    fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/image/upload`, {
      method: 'POST',
      body: formData,
    })
    .then(response => response.json())
    .then(result => {
      if (result.error) {
        reject(new Error(result.error.message));
      } else {
        resolve(result);
      }
    })
    .catch(error => reject(error));
  });
}

// Fonction alternative utilisant directement l'API Cloudinary avec fetch
async function uploadToCloudinaryAlternative(buffer, publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateCloudinarySignature(publicId, timestamp);
  
  const formData = new FormData();
  formData.append('file', new Blob([buffer]), 'image.webp');
  formData.append('public_id', publicId);
  formData.append('format', 'webp');
  formData.append('quality', 'auto:good');
  formData.append('overwrite', 'true');
  formData.append('timestamp', timestamp);
  formData.append('api_key', cloudinaryConfig.api_key);
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloud_name}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const result = await response.json();
  
  if (result.error) {
    throw new Error(result.error.message);
  }
  
  return result;
}

// Fonction de conversion avec timeout
async function convertImageToWebP(imageUrl, maxWidth = 1200) {
  try {
    console.log(`Téléchargement: ${imageUrl}`);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Conversion WebP avec Sharp
    const webpBuffer = await sharp(buffer)
      .resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({
        quality: 80,
        effort: 6
      })
      .toBuffer();

    return webpBuffer;
  } catch (error) {
    console.error('Erreur conversion:', error.message);
    throw error;
  }
}

// Vérification que Cloudinary est configuré
function checkCloudinaryConfig() {
  const requiredEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY', 
    'CLOUDINARY_API_SECRET'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Variables Cloudinary manquantes: ${missingVars.join(', ')}`);
  }
}

export async function POST(request) {
  try {
    // Vérifier la configuration Cloudinary
    checkCloudinaryConfig();
    
    // Validation du Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { batchSize = 1, batchNumber = 0, testMode = false } = body;

    await connectMongoDB();

    // Récupération des produits avec pagination
    const products = await ProductModal.find({
      "array_ProductImg.0": { $exists: true }
    })
    .skip(batchNumber * batchSize)
    .limit(batchSize)
    .lean();

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun produit à convertir',
        completed: true
      });
    }

    const results = {
      processed: 0,
      converted: 0,
      errors: 0,
      details: []
    };

    // Traitement de chaque produit
    for (const product of products) {
      const productResult = {
        productId: product._id.toString(),
        productName: product.title?.fr || 'Sans nom',
        images: [],
        error: null
      };

      try {
        const updatedImages = [];

        for (const [index, image] of product.array_ProductImg.entries()) {
          try {
            if (testMode) {
              // Mode test - simulation seulement
              productResult.images.push({
                original: image.secure_url,
                converted: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/webp_test_${product._id}_${index}.webp`,
                success: true,
                testMode: true
              });
              updatedImages.push(image);
              continue;
            }

            console.log(`Conversion de: ${image.secure_url}`);
            
            // Conversion réelle
            const webpBuffer = await convertImageToWebP(image.secure_url);
            
            // Génération du public_id
            let publicId;
            if (image.public_id_url) {
              publicId = `webp_${image.public_id_url.split('/').pop().split('.')[0]}`;
            } else {
              const urlParts = image.secure_url.split('/');
              const fileName = urlParts[urlParts.length - 1].split('.')[0];
              publicId = `webp_products/${fileName}`;
            }

            // Upload vers Cloudinary avec la nouvelle méthode
            const uploadResult = await uploadToCloudinaryAlternative(webpBuffer, publicId);

            updatedImages.push({
              secure_url: uploadResult.secure_url,
              public_id_url: uploadResult.public_id
            });

            productResult.images.push({
              original: image.secure_url,
              converted: uploadResult.secure_url,
              success: true,
              testMode: false
            });

          } catch (imageError) {
            console.error(`Erreur image ${image.secure_url}:`, imageError.message);
            productResult.images.push({
              original: image.secure_url,
              error: imageError.message,
              success: false
            });
            updatedImages.push(image);
          }
        }

        // Mise à jour en base de données
        if (!testMode) {
          await ProductModal.findByIdAndUpdate(product._id, {
            $set: { array_ProductImg: updatedImages }
          });
          console.log(`Produit ${product._id} mis à jour`);
        }

        results.converted++;
        results.processed++;

      } catch (productError) {
        console.error(`Erreur produit ${product._id}:`, productError.message);
        productResult.error = productError.message;
        results.errors++;
        results.processed++;
      }

      results.details.push(productResult);
    }

    return NextResponse.json({
      success: true,
      batch: batchNumber,
      totalProcessed: results.processed,
      converted: results.converted,
      errors: results.errors,
      hasMore: products.length === batchSize,
      nextBatch: batchNumber + 1,
      testMode: testMode,
      details: results.details
    });

  } catch (error) {
    console.error('Erreur API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur interne du serveur',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    checkCloudinaryConfig();
    
    await connectMongoDB();
    
    const totalProducts = await ProductModal.countDocuments({
      "array_ProductImg.0": { $exists: true }
    });

    return NextResponse.json({
      totalProducts,
      cloudinaryConfigured: true,
      message: 'API de conversion WebP opérationnelle'
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erreur de configuration',
        message: error.message
      },
      { status: 500 }
    );
  }
}