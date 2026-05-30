import CaracteristiqueModal from "@/app/DBconfig/models/caracteristique";
import Caracteristique_colorModal from "@/app/DBconfig/models/caracteristique_color";
import ProductModal from "@/app/DBconfig/models/product";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";



// type objFromFrontEnd={
//  id_product
// value_start
// description
// }


export async function PUT(request) {
  // 1- Receive data from Front-end
  const objFromFrontEnd = await request.json();
  console.log("*******************************************");
  console.log(objFromFrontEnd);

  // 2 connect to DB
  await connectMongoDB();

  // 3- update data (image, type, ajustement de prix, isActive)
  const updatePayload = {
    ...(objFromFrontEnd.img !== undefined ? { img: objFromFrontEnd.img } : {}),
    ...(objFromFrontEnd.type ? { type: objFromFrontEnd.type } : {}),
    ...(objFromFrontEnd.priceAdjustment !== undefined
      ? { priceAdjustment: objFromFrontEnd.priceAdjustment }
      : {}),
    ...(objFromFrontEnd.isActive !== undefined
      ? { isActive: objFromFrontEnd.isActive }
      : {}),
  };

  const my_data = await Caracteristique_colorModal.updateOne(
    { _id: objFromFrontEnd._id },
    updatePayload,
  );

  // 4- Go back to frontend
  return NextResponse.json(my_data);
}
