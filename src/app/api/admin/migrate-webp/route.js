// app/api/migrate-webp/route.js
// API Route pour migration progressive des images

import { connectMongoDB } from "@/app/DBconfig/mongodb";
import ProductModal from "@/app/DBconfig/models/product";
import { NextResponse } from "next/server";
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Fonction d'upload vers Cloudinary (réutiliser votre fonction existante)
function uploadStream(buffer) {
  return new Promise((resolve, reject) => {
    const uploadStreamCloudinary = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        format: 'webp',
        quality: 'auto:good',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id
          });
        }
      }
    );
    uploadStreamCloudinary.end(buffer);
  });
}

// Fonction de conversion WebP (identique à votre API existante)
async function convertToWebP(imageBuffer) {
  return await sharp(imageBuffer)
    .webp({
      quality: 80,
      effort: 6,
      lossless: false
    })
    .resize(1200, 800, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .toBuffer();
}

// GET - Vérifier le statut de migration
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    await connectMongoDB();
    
    if (action === 'status') {
      const totalProducts = await ProductModal.countDocuments();
      const productsWithWebP = await ProductModal.countDocuments({
        'array_ProductImg.secure_url': { $regex: /\.webp/i }
      });
      
      const allProducts = await ProductModal.find({}, 'array_ProductImg').exec();
      let totalImages = 0;
      let webpImages = 0;
      
      allProducts.forEach(product => {
        product.array_ProductImg.forEach(img => {
          totalImages++;
          if (img.secure_url && img.secure_url.includes('.webp')) {
            webpImages++;
          }
        });
      });
      
      return NextResponse.json({
        success: true,
        status: {
          totalProducts,
          productsWithWebP,
          productProgress: ((productsWithWebP / totalProducts) * 100).toFixed(2),
          totalImages,
          webpImages,
          imageProgress: ((webpImages / totalImages) * 100).toFixed(2),
          remainingImages: totalImages - webpImages,
          estimatedSavings: `${((totalImages - webpImages) * 1.5).toFixed(2)} MB`
        }
      });
    }
    
    return NextResponse.json({ error: "Action non supportée" }, { status: 400 });
    
  } catch (error) {
    console.error("Erreur lors de la vérification du statut:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Lancer la migration par batch
export async function POST(request) {
  try {
    const { batchSize = 5, startFrom = 0, productId = null } = await request.json();
    
    await connectMongoDB();
    
    let products;
    if (productId) {
      // Migrer un produit spécifique
      products = await ProductModal.find({ _id: productId }).exec();
    } else {
      // Migrer un batch de produits
      products = await ProductModal.find()
        .skip(startFrom)
        .limit(batchSize)
        .exec();
    }
    
    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun produit à traiter",
        processed: 0
      });
    }
    
    let totalImagesProcessed = 0;
    let totalProductsProcessed = 0;
    let totalSpaceSaved = 0;
    const errors = [];
    
    for (const product of products) {
      try {
        const result = await migrateProductImages(product);
        
        // Mettre à jour le produit
        await ProductModal.findByIdAndUpdate(
          product._id,
          { array_ProductImg: result.updatedImages }
        );
        
        totalImagesProcessed += result.processedCount;
        totalProductsProcessed++;
        totalSpaceSaved += result.savedSpace;
        
      } catch (error) {
        console.error(`Erreur produit ${product._id}:`, error);
        errors.push({
          productId: product._id,
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: totalProductsProcessed,
      imagesConverted: totalImagesProcessed,
      spaceSaved: `${totalSpaceSaved.toFixed(2)} MB`,
      errors: errors,
      nextBatch: startFrom + batchSize
    });
    
  } catch (error) {
    console.error("Erreur lors de la migration:", error);
    return NextResponse.json({ error: "Erreur de migration" }, { status: 500 });
  }
}

// Fonction pour migrer les images d'un produit
async function migrateProductImages(product) {
  const updatedImages = [];
  let processedCount = 0;
  let savedSpace = 0;
  
  for (const image of product.array_ProductImg) {
    try {
      // Vérifier si déjà en WebP
      if (image.secure_url && image.secure_url.includes('.webp')) {
        updatedImages.push(image);
        continue;
      }
      
      // Télécharger l'image
      const response = await fetch(image.secure_url);
      const arrayBuffer = await response.arrayBuffer();
      const originalBuffer = Buffer.from(arrayBuffer);
      const originalSize = originalBuffer.length;
      
      // Convertir en WebP
      const webpBuffer = await convertToWebP(originalBuffer);
      const newSize = webpBuffer.length;
      savedSpace += (originalSize - newSize) / 1024 / 1024; // en MB
      
      // Upload vers Cloudinary
      const uploadResult = await uploadStream(webpBuffer);
      
      // Supprimer l'ancienne image
      if (image.public_id_url) {
        try {
          await cloudinary.uploader.destroy(image.public_id_url);
        } catch (deleteError) {
          console.log(`Erreur suppression ${image.public_id_url}:`, deleteError);
        }
      }
      
      updatedImages.push({
        secure_url: uploadResult.secure_url,
        public_id_url: uploadResult.public_id
      });
      
      processedCount++;
      
      // Petit délai
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error('Erreur traitement image:', error);
      // Garder l'ancienne image en cas d'erreur
      updatedImages.push(image);
    }
  }
  
  return {
    updatedImages,
    processedCount,
    savedSpace
  };
}