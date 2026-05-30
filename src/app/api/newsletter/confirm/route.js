import NewsletterSubscriberModal from "@/app/DBconfig/models/NewsletterSubscriber";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") || "";

  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  await connectMongoDB();

  const subscriber = await NewsletterSubscriberModal.findOne({ verificationToken: token });
  if (!subscriber) {
    return NextResponse.json({ error: "Token invalide" }, { status: 404 });
  }

  subscriber.verified = true;
  subscriber.verifiedAt = new Date();
  subscriber.verificationToken = "";
  subscriber.active = true;
  await subscriber.save();

  return NextResponse.json({ status: "verified" });
}
