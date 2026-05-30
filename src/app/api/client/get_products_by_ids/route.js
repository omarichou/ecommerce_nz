import ProductModal from "@/app/DBconfig/models/product";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function POST(request) {
  const data = await request.json();
  const { ids } = data || {};

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json([]);
  }

  await connectMongoDB();
  const products = await ProductModal.find({ _id: { $in: ids } });
  return NextResponse.json(products || []);
}
