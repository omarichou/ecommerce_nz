import { connectMongoDB } from "app/DBconfig/mongodb";
import { NextResponse } from "next/server";
import CartModal from "app/DBconfig/models/Cart";
import ProductModal from "app/DBconfig/models/product";

export async function POST(request) {
  // 1- Receive data from Front-end
  const objFromFrontEnd = await request.json();

  // 2- connect to DB
  await connectMongoDB();

  // 3- Check if product is available
  const product = await ProductModal.findById(objFromFrontEnd.id_product).select("disponible");
  if (!product || product.disponible !== "disponible") {
    return NextResponse.json(
      { error: "Ce produit n'est pas disponible actuellement" },
      { status: 400 },
    );
  }

  // 4- Prepare the data for CartModal
  const cartData = {
    ...objFromFrontEnd,
    caracteristique_couleur: {
      type: objFromFrontEnd.caracteristique_couleur.type,
      img: objFromFrontEnd.caracteristique_couleur.img,
    },
  };

  // 5- Store obj to DB
  await CartModal.create(cartData);

  // 6- Go back to frontend
  return NextResponse.json({});
}
