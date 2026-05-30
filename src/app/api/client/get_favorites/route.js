import FavoriteModal from "@/app/DBconfig/models/Favorite";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function POST(request) {
  const data = await request.json();
  const { id_user } = data || {};

  if (!id_user) {
    return NextResponse.json({ error: "id_user requis" }, { status: 400 });
  }

  await connectMongoDB();
  const favorites = await FavoriteModal.find({ id_user })
    .populate({ path: "id_product", select: "_id" })
    .sort({ createdAt: -1 });

  const validFavorites = (favorites || []).filter((item) => Boolean(item?.id_product?._id));

  // Remove duplicates by product id to keep header/page counts consistent.
  const seen = new Set();
  const dedupedFavorites = validFavorites.filter((item) => {
    const productId = String(item.id_product._id);
    if (seen.has(productId)) return false;
    seen.add(productId);
    return true;
  });

  return NextResponse.json(dedupedFavorites);
}
