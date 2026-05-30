import OrderModal from "@/app/DBconfig/models/Order";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";
import { createYalidineShipment } from "@/assets/yalidine";

export async function PUT(request) {
  await connectMongoDB();
  const { _id, status } = await request.json();

  const updateData = { status };
  
  // Si le statut passe à "confirmé", créer un envoi Yalidine
  if (status === "confirmé") {
    try {
      const order = await OrderModal.findById(_id).populate("array_product.id_product");;
      const yalidineResponse = await createYalidineShipment(order);
      
      updateData.yalidineTracking = {
        parcel_id: yalidineResponse.parcel_id,
        tracking_url: yalidineResponse.tracking,
        status: yalidineResponse.status,
        history: yalidineResponse.history.map(item => ({
          date: new Date(item.date),
          status: item.status,
          description: item.description
        }))
      };
    } catch (error) {
      console.error("Failed to create Yalidine shipment:", error);
      return NextResponse.json(
        { error: "Failed to create shipment" },
        { status: 500 }
      );
    }
  }

  await OrderModal.updateOne({ _id }, updateData);

  return NextResponse.json({ success: true });
}