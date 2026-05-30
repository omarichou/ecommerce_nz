// app/api/update_Caracteristique/route.js

import CaracteristiqueModal from "@/app/DBconfig/models/caracteristique";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function PUT(request) {
  try {
    // 1- Recevoir les données du Front-end
    const objFromFrontEnd = await request.json();
    
    console.log("Mise à jour de la caractéristique:", objFromFrontEnd);

    // 2- Se connecter à la base de données
    await connectMongoDB();

    // 3- Mettre à jour la caractéristique (uniquement les champs présents)
    const updateFields = {};
    if (objFromFrontEnd.type !== undefined) updateFields.type = objFromFrontEnd.type;
    if (objFromFrontEnd.array_value !== undefined) updateFields.array_value = objFromFrontEnd.array_value;
    if (objFromFrontEnd.isActive !== undefined) updateFields.isActive = objFromFrontEnd.isActive;
    const updatedCaracteristique = await CaracteristiqueModal.findByIdAndUpdate(
      objFromFrontEnd._id,
      updateFields,
      { new: true }
    );

    if (!updatedCaracteristique) {
      return NextResponse.json(
        { error: "Caractéristique non trouvée" },
        { status: 404 }
      );
    }

    // 4- Retourner la réponse au frontend
    return NextResponse.json({
      message: "Caractéristique mise à jour avec succès",
      data: updatedCaracteristique,
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la caractéristique" },
      { status: 500 }
    );
  }
}