import FavoriteModal from "@/app/DBconfig/models/Favorite";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function POST(request) {
  const data = await request.json();
  const { id_user, id_product } = data || {};

  if (!id_user || !id_product) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  await connectMongoDB();

  await FavoriteModal.updateOne(
    { id_user, id_product },
    { $setOnInsert: { id_user, id_product } },
    { upsert: true },
  );

  return NextResponse.json({ status: "ok" });
}
