import ProductModal from "@/app/DBconfig/models/product";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";


export async function GET(request) {

  // 2 connect to DB
  await connectMongoDB();


    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.max(parseInt(searchParams.get("limit") || "20", 10), 1);
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const filter = {};
    if (category) {
      filter.categorie = category;
    }
    if (status && (status === "published" || status === "draft" || status === "scheduled")) {
      filter.status = status;
    }
    if (q) {
      filter.$or = [
        { "title.fr": { $regex: q, $options: "i" } },
        { "title.ar": { $regex: q, $options: "i" } },
        { categorie: { $regex: q, $options: "i" } },
      ];
    }

    const total = await ProductModal.countDocuments(filter);
    const data = await ProductModal.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({ data, total, page, limit });
}
