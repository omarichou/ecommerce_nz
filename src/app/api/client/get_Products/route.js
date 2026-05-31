import ProductModal from "app/DBconfig/models/product";
import { connectMongoDB } from "app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
  await connectMongoDB();

  const url = new URL(request.url);
  const params = url.searchParams;
  const q = params.get("q")?.trim() || "";
  const category = params.get("category")?.trim();
  const sortBy = params.get("sortBy") || "default";
  const page = Math.max(Number(params.get("page") || "1"), 1);
  const limit = Math.max(Number(params.get("limit") || "12"), 1);
  const minPrice = Number(params.get("minPrice") || "0");
  const maxPrice = Number(params.get("maxPrice") || "1000000");

  const filter = {};

  if (category) {
    filter.categorie = category;
  }

  if (q) {
    const queryRegex = new RegExp(q, "i");
    filter.$or = [
      { "title.fr": queryRegex },
      { "title.ar": queryRegex },
      { categorie: queryRegex },
      { "description.fr": queryRegex },
      { "description.ar": queryRegex },
    ];
  }

  if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
    filter.price = {};
    if (!Number.isNaN(minPrice)) filter.price.$gte = minPrice;
    if (!Number.isNaN(maxPrice)) filter.price.$lte = maxPrice;
  }

  const sort = {};
  switch (sortBy) {
    case "price-asc":
      sort.price = 1;
      break;
    case "price-desc":
      sort.price = -1;
      break;
    case "name":
      sort["title.fr"] = 1;
      break;
    case "rating":
      sort.purchaseCount = -1;
      break;
    default:
      sort.createdAt = -1;
  }

  const total = await ProductModal.countDocuments(filter);
  const products = await ProductModal.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return NextResponse.json({ products, total });
}


