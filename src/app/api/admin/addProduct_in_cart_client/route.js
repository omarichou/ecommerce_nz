import UserModal from "@/app/DBconfig/models/user";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { uploadStream } from "@/assets/UploadImg_cloudinary";
import ProductModal from "@/app/DBconfig/models/product";
import CartModal from "@/app/DBconfig/models/Cart";

export async function POST(request) {
  // 1- Receive data from Front-end
  const objFromFrontEnd = await request.json();
  console.log("*******************************************");
  console.log(objFromFrontEnd);

  // 1- connect to DB
  await connectMongoDB();

  

  // 3- Try to Store obj to DB
  await CartModal.create({
    id_user:objFromFrontEnd.id_user,
    id_farmer:objFromFrontEnd.id_farmer,
    id_machin:objFromFrontEnd.id_machin,
    quantite:1,
  });


  // 4- Go back to frontend
  return NextResponse.json({});
}
