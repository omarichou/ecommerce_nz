import CartModal from "@/app/DBconfig/models/Cart";
import ProductModal, { db } from "@/app/DBconfig/models/product";
import UserModal from "@/app/DBconfig/models/user";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function POST(request) {


    // 1- Receive data from Front-end
    const objFromFrontEnd = await request.json();
    console.log("*******************************************");
    console.log(objFromFrontEnd);

    // 1- connect to DB
    await connectMongoDB();

    // 2- get data 

    const cart_farmer = await CartModal.find({id_farmer : objFromFrontEnd.id_farmer }).populate("id_machin")
   console.log(cart_farmer)
  


      // 4- Go back to frontend
  return NextResponse.json( cart_farmer );

}