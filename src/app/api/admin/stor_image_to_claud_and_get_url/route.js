// import UserModal from "app/DBconfig/models/user";
// import { connectMongoDB } from "app/DBconfig/mongodb";
// import { NextResponse } from "next/server";
// import bcrypt from "bcrypt";
// import { uploadStream } from "assets/UploadImg_cloudinary";
// import ProductModal from "app/DBconfig/models/product";

// export async function POST(request) {
//   // 1- Receive data from Front-end
//   const objFromFrontEnd = await request.formData();
//   console.log("***********************registerr*****************************");
//   console.log(objFromFrontEnd);

//   // 2- connect to DB
//   await connectMongoDB();

//   //   upload image in cloudinary and get url
//   // add image to cloudinary & get url

//   const machinImg = objFromFrontEnd.get("file");

//   const bytes = await machinImg.arrayBuffer();
//   const buffer = Buffer.from(bytes);
//   const uploadedImg = await uploadStream(buffer);
//   console.log(uploadedImg);
//   console.log("donnnnnnneeeeeeeee");

//   const img_url = uploadedImg;



//   // 4- Go back to frontend
//   return NextResponse.json({img_url});
// }


import UserModal from "@/app/DBconfig/models/user";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { uploadStream } from "@/assets/UploadImg_cloudinary";
import ProductModal from "@/app/DBconfig/models/product";
import sharp from 'sharp';

export async function POST(request) {
  try {
    // 1- Receive data from Front-end
    const objFromFrontEnd = await request.formData();
    console.log("***********************registerr*****************************");
    console.log(objFromFrontEnd);

    // 2- connect to DB
    await connectMongoDB();

    // Get image from form data
    const machinImg = objFromFrontEnd.get("file");
    
    if (!machinImg) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert to WebP using Sharp
    const bytes = await machinImg.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert to WebP with optimization
    const webpBuffer = await sharp(buffer)
      .webp({ 
        quality: 80, // Adjust quality (0-100)
        effort: 6,   // Compression effort (0-6)
        lossless: false // Set to true for lossless compression
      })
      .resize(1200, 800, { // Optional: resize if needed
        fit: 'inside',
        withoutEnlargement: true
      })
      .toBuffer();

    // Upload WebP image to Cloudinary
    const uploadedImg = await uploadStream(webpBuffer);
    console.log("WebP image uploaded successfully:", uploadedImg);

    const img_url = uploadedImg;

    // 4- Go back to frontend
    return NextResponse.json({ img_url });

  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json({ error: "Image processing failed" }, { status: 500 });
  }
}
