import PromoCodeModal from "@/app/DBconfig/models/PromoCode";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function PUT(request) {
  const data = await request.json();
  const { _id, ...updates } = data || {};
  await connectMongoDB();
  const updated = await PromoCodeModal.findOneAndUpdate({ _id }, updates, { new: true });
  return NextResponse.json(updated);
}
