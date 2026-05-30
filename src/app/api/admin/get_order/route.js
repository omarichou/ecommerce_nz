import OrderModal from "@/app/DBconfig/models/Order";
import ProductModal from "@/app/DBconfig/models/product";
import UserModal from "@/app/DBconfig/models/user";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
  await connectMongoDB();

  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const limit = Math.max(parseInt(searchParams.get("limit") || "20", 10), 1);
  const status = searchParams.get("status");

  const filter = status ? { status } : { status: { $in: ["en attente", "confirmé"] } };

  const total = await OrderModal.countDocuments(filter);
  const data = await OrderModal.find(filter)
    .populate({ path: "array_product.id_product" })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return NextResponse.json({ data, total, page, limit });
}
