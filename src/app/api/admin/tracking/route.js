import OrderModal from "@/app/DBconfig/models/Order";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { getYalidineTracking } from "@/assets/yalidine";
import { NextResponse } from "next/server";

export async function POST(request) {
  await connectMongoDB();
  const { orderId } = await request.json();

  try {
    const order = await OrderModal.findById(orderId);
    if (!order.yalidineTracking?.parcel_id) {
      return NextResponse.json(
        { error: "No tracking information" },
        { status: 400 }
      );
    }

    const trackingData = await getYalidineTracking(order.yalidineTracking.parcel_id);
    
    await OrderModal.updateOne(
      { _id: orderId },
      { 
        'yalidineTracking.status': trackingData.status,
        'yalidineTracking.history': trackingData.history.map(item => ({
          date: new Date(item.date),
          status: item.status,
          description: item.description
        }))
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update tracking" },
      { status: 500 }
    );
  }
}