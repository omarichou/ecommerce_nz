import ProductModal from "@/app/DBconfig/models/product";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function PUT(request) {
  // 1- Receive data from Front-end
  const objFromFrontEnd = await request.json();
  console.log("*******************************************");
  console.log(objFromFrontEnd);

  // 2 connect to DB
  await connectMongoDB();

  // 3- update data



  const updateData = {
    categorie: objFromFrontEnd.categorie,
    title: objFromFrontEnd.title,
    price: objFromFrontEnd.price,
    ancien_price: objFromFrontEnd.ancien_price || 0,
    disponible: objFromFrontEnd.disponible,
    description: objFromFrontEnd.description,
    variant: objFromFrontEnd.variant,
    variant_color: objFromFrontEnd.variant_color,
    reduction: objFromFrontEnd.reduction,
    array_ProductImg: objFromFrontEnd.array_ProductImg,
  };

  if (objFromFrontEnd.isNew !== undefined) {
    updateData.isNew =
      objFromFrontEnd.isNew === true ||
      objFromFrontEnd.isNew === "true" ||
      objFromFrontEnd.isNew === 1 ||
      objFromFrontEnd.isNew === "1";
  }

  if (objFromFrontEnd.isPopular !== undefined) {
    updateData.isPopular =
      objFromFrontEnd.isPopular === true ||
      objFromFrontEnd.isPopular === "true" ||
      objFromFrontEnd.isPopular === 1 ||
      objFromFrontEnd.isPopular === "1";
  }

  if (objFromFrontEnd.featured !== undefined) {
    updateData.featured =
      objFromFrontEnd.featured === true ||
      objFromFrontEnd.featured === "true" ||
      objFromFrontEnd.featured === 1 ||
      objFromFrontEnd.featured === "1";
  }

  if (objFromFrontEnd.status !== undefined) {
    updateData.status = objFromFrontEnd.status;
  }

  if (objFromFrontEnd.sku !== undefined) {
    updateData.sku = objFromFrontEnd.sku;
  }

  await ProductModal.updateOne({ _id: objFromFrontEnd._id }, updateData);

  // 4- Go back to frontend
  return NextResponse.json({});
}
