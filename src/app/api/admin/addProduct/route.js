

import { connectMongoDB } from "@/app/DBconfig/mongodb";
import ProductModal from "@/app/DBconfig/models/product";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const objFromFrontEnd = await request.json();
    await connectMongoDB();

    // Validation des données
    if (!Array.isArray(objFromFrontEnd.variant_color)) {
      return NextResponse.json(
        { success: false, error: "variant_color doit être un tableau" },
        { status: 400 }
      );
    }

    // Transformation des images
    const my_array_img = objFromFrontEnd.array_machinImg.map((item) => ({
      secure_url: item.img_url.secure_url,
      public_id_url: item.img_url.public_id,
    }));

    // Transformation des caractéristiques
    const my_array_id_Caracteristique = objFromFrontEnd.array_variant.map(
      (item) => item._id
    );

    // Transformation des caractéristiques color
    const my_array_id_Caracteristique_color = objFromFrontEnd.variant_color.map(
      (item) => item._id
    );


  


    const createData = {
      categorie: objFromFrontEnd.Categorie,
      title: {
        fr: objFromFrontEnd.title,
        ar: objFromFrontEnd.title_en_arabe,
      },
      price: objFromFrontEnd.Price,
      ancien_price: objFromFrontEnd?.Ancien_price || 0,
      array_ProductImg: my_array_img,
      description: {
        fr: objFromFrontEnd.description,
        ar: objFromFrontEnd.description_en_arabe,
      },
      disponible: objFromFrontEnd.disponible || "disponible",
      variant: my_array_id_Caracteristique,
      reduction: objFromFrontEnd.reductions,
      variant_color: my_array_id_Caracteristique_color,
      isNew:
        objFromFrontEnd.isNew === true ||
        objFromFrontEnd.isNew === "true" ||
        objFromFrontEnd.isNew === 1 ||
        objFromFrontEnd.isNew === "1",
      isPopular:
        objFromFrontEnd.isPopular === true ||
        objFromFrontEnd.isPopular === "true" ||
        objFromFrontEnd.isPopular === 1 ||
        objFromFrontEnd.isPopular === "1",
    };

    if (objFromFrontEnd.featured !== undefined) {
      createData.featured =
        objFromFrontEnd.featured === true ||
        objFromFrontEnd.featured === "true" ||
        objFromFrontEnd.featured === 1 ||
        objFromFrontEnd.featured === "1";
    }
    if (objFromFrontEnd.status) createData.status = objFromFrontEnd.status;
    if (objFromFrontEnd.sku) createData.sku = objFromFrontEnd.sku;

    await ProductModal.create(createData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de l'ajout du produit :", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}