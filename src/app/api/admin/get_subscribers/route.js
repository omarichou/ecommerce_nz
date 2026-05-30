import NewsletterSubscriberModal from "@/app/DBconfig/models/NewsletterSubscriber";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  await connectMongoDB();
  const subscribers = await NewsletterSubscriberModal.find({}).sort({ subscribedAt: -1 });
  return NextResponse.json(subscribers);
}
