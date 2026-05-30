import ProductModal from "app/DBconfig/models/product";
import { connectMongoDB } from "app/DBconfig/mongodb";

import { NextResponse } from "next/server";


export async function GET(request) {

  // 2 connect to DB
  await connectMongoDB();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit")) || 16;

// 3- Delete data
// 2- get data 

// const arr_data = await  ProductModal.find({dipsonible:"disponible"})


const arr_data = await ProductModal.find({disponible:"disponible"})
.sort({ purchaseCount: -1 })
.limit(limit); // Limite les produits les plus achetés



  // 4- Go back to frontend
  return NextResponse.json(arr_data, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600",
    },
  });
}


