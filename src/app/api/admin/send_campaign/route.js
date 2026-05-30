import NewsletterSubscriberModal from "@/app/DBconfig/models/NewsletterSubscriber";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request) {
  const data = await request.json();
  const subject = (data?.subject || "").trim();
  const message = (data?.message || "").trim();

  if (!subject || !message) {
    return NextResponse.json({ error: "Sujet et message requis" }, { status: 400 });
  }

  await connectMongoDB();

  const subscribers = await NewsletterSubscriberModal.find({ active: true, verified: true });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    const unsubscribeUrl = siteUrl && sub.unsubscribeToken ? `${siteUrl}/newsletter/unsubscribe?token=${sub.unsubscribeToken}` : "";
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
        <h2>${subject}</h2>
        <p>${message.replace(/\n/g, "<br />")}</p>
        ${unsubscribeUrl ? `<p style="margin-top:20px;font-size:12px;color:#666;">Se désinscrire: <a href=\"${unsubscribeUrl}\">ici</a></p>` : ""}
      </div>
    `;

    try {
      await sendEmail({ to: sub.email, subject, html });
      sent += 1;
    } catch (error) {
      console.error("Campaign send error", sub.email, error);
      failed += 1;
    }
  }

  return NextResponse.json({ sent, failed, total: subscribers.length });
}
