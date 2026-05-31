import ProductModal from "app/DBconfig/models/product";
import { connectMongoDB } from "app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 16;

    const products = await ProductModal.find({
      $or: [{ ancien_price: { $gt: 0 } }, { "reduction.reduction": { $gt: 0 } }],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(products, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Error fetching discount products:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
