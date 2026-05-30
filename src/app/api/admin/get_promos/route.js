import PromoCodeModal from "@/app/DBconfig/models/PromoCode";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  await connectMongoDB();
  const promos = await PromoCodeModal.find({}).sort({ createdAt: -1 });
  return NextResponse.json(promos);
}
