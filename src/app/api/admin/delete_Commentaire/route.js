import CaracteristiqueModal from "@/app/DBconfig/models/caracteristique";
import CommentsModal from "@/app/DBconfig/models/Commente";
import ProductModal from "@/app/DBconfig/models/product";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  // secure: true,
});

export async function DELETE(request) {
  // 1- Receive data from Front-end
  const objFromFrontEnd = await request.json();
  console.log("*******************************************");
  console.log(objFromFrontEnd);

  // 2 connect to DB
  await connectMongoDB();

  // 3- Delete data

  console.log(objFromFrontEnd);
  const existingComment = await CommentsModal.findById(objFromFrontEnd._id).lean();
  if (existingComment?.id_product) {
    await ProductModal.updateOne({ _id: existingComment.id_product }, { $pull: { comments: objFromFrontEnd._id } });
  }
  await CommentsModal.deleteOne({ _id: objFromFrontEnd._id });



  // 4- Go back to frontend
  return NextResponse.json({});
}
