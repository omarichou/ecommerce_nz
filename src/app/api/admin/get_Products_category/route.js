// import ProductModal from "app/DBconfig/models/product";
// import { connectMongoDB } from "app/DBconfig/mongodb";
// import { NextResponse } from "next/server";


// export async function GET(request) {

//   // 2 connect to DB
//   await connectMongoDB();

// // 3- Delete data
// // 2- get data 

// const arr_data = await  ProductModal.find()






//   // 4- Go back to frontend
//   return NextResponse.json(arr_data);
// }


// app/DBconfig/api/get_Products/route.js
import ProductModal from "@/app/DBconfig/models/product";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectMongoDB();

    // Récupérer les paramètres de pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const category = searchParams.get('category');

    // Calculer le skip
    const skip = (page - 1) * limit;

    // Construire la requête
    let query = {};
    if (category && category !== 'all') {
      query.categorie = category;
    }

    // Récupérer les données avec pagination
    const products = await ProductModal.find(query)
      .skip(skip)
      .limit(limit)
      .lean();

    // Compter le nombre total de documents
    const totalProducts = await ProductModal.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    return NextResponse.json({ 
      products, 
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}