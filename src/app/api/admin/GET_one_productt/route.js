import ProductModal from "@/app/DBconfig/models/product"
import { connectMongoDB } from "@/app/DBconfig/mongodb"
import { NextResponse } from "next/server"

export async function GET(request) {
   
    
  // 1 connect to db
     await connectMongoDB()

  // 2     
   
    const id = request.nextUrl.searchParams.get("id")

  let obj_data =    await  ProductModal.findOne({_id:id}).populate("variant")
  


  return NextResponse.json(obj_data)
}