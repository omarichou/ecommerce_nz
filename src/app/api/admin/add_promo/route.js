import PromoCodeModal from "@/app/DBconfig/models/PromoCode";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function POST(request) {
  const data = await request.json();
  await connectMongoDB();
  const created = await PromoCodeModal.create(data);
  return NextResponse.json(created);
}
