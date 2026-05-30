import NewsletterSubscriberModal from "@/app/DBconfig/models/NewsletterSubscriber";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function DELETE(request) {
  const data = await request.json();
  await connectMongoDB();
  await NewsletterSubscriberModal.deleteOne({ _id: data._id });
  return NextResponse.json({});
}
