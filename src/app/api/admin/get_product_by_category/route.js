import ProductModal from "@/app/DBconfig/models/product";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {

    // 1- connect to DB
    await connectMongoDB();


    const name_of_machin = request.nextUrl.searchParams.get("id")

    // 2- get data 

    const array_machin = await  ProductModal.find({ title : name_of_machin, disponible:"available" }).populate("user_inf")


      // 4- Go back to frontend
  return NextResponse.json( array_machin );
}