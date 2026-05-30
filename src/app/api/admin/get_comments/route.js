import ProductModal from "@/app/DBconfig/models/product";
import "@/app/DBconfig/models/Commente";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam === "0" ? 0 : parseInt(limitParam || "0");
    const search = searchParams.get("search");
    const productId = searchParams.get("productId");

    const productQuery = {};
    if (productId) {
      productQuery._id = productId;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      productQuery.$or = [{ "title.fr": regex }, { "title.ar": regex }, { categorie: regex }];
    }

    const products = await ProductModal.find(productQuery)
      .where("comments.0").exists(true)
      .select("title categorie price array_ProductImg comments")
      .populate("comments", "name email avis createdAt")
      .lean();

    const groups = products.map((product) => ({
      productId: product._id.toString(),
      product,
      comments: product.comments || [],
    }));

    const totalComments = groups.reduce((acc, group) => acc + (group.comments?.length || 0), 0);
    const totalPages = limit > 0 ? 1 : 1;

    return NextResponse.json({
      comments: groups.flatMap((group) => group.comments || []),
      groups,
      pagination: {
        currentPage: 1,
        totalPages,
        totalComments,
        hasNext: false,
        hasPrev: false,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}
