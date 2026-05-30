import OrderModal from "@/app/DBconfig/models/Order";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

const isObjectId = (value) => typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);

const buildOrderNumber = (order) => {
  if (order?.orderNumber) return order.orderNumber;
  const suffix = order?._id ? order._id.toString().slice(-8).toUpperCase() : Date.now().toString().slice(-8);
  return `ELG-${suffix}`;
};

export async function GET(request) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("order")?.trim();
    if (!orderNumber) {
      return NextResponse.json({ error: "order_required" }, { status: 400 });
    }

    let order = await OrderModal.findOne({ orderNumber }).lean();

    if (!order && isObjectId(orderNumber)) {
      order = await OrderModal.findById(orderNumber).lean();
    }

    if (!order) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (!order.orderNumber) {
      const generated = buildOrderNumber(order);
      await OrderModal.updateOne({ _id: order._id }, { orderNumber: generated });
      order.orderNumber = generated;
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status || "en attente",
      trackingNumber: order.trackingNumber || "",
      trackingUrl: order.yalidineTracking?.tracking_url || "",
      createdAt: order.createdAt,
      yalidineHistory: order.yalidineTracking?.history || [],
    });
  } catch (error) {
    console.error("track_order error", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
