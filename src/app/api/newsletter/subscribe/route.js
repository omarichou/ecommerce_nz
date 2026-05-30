import NewsletterSubscriberModal from "@/app/DBconfig/models/NewsletterSubscriber";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

const rateStore = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

const getClientIp = (request) => {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
};

const canPassRateLimit = (ip) => {
  const now = Date.now();
  const entry = rateStore.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }
  entry.count += 1;
  rateStore.set(ip, entry);
  return entry.count <= MAX_PER_WINDOW;
};

export async function POST(request) {
  const data = await request.json();
  const email = (data?.email || "").toLowerCase().trim();

  const ip = getClientIp(request);
  if (!canPassRateLimit(ip)) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez plus tard." }, { status: 429 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  await connectMongoDB();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const verificationToken = crypto.randomBytes(24).toString("hex");
  const unsubscribeToken = crypto.randomBytes(24).toString("hex");

  const existing = await NewsletterSubscriberModal.findOne({ email });
  if (existing) {
    existing.active = true;
    existing.verified = false;
    existing.verificationToken = verificationToken;
    existing.unsubscribeToken = existing.unsubscribeToken || unsubscribeToken;
    existing.subscribedAt = new Date();
    await existing.save();
  } else {
    await NewsletterSubscriberModal.create({
      email,
      active: true,
      verified: false,
      verificationToken,
      unsubscribeToken,
      subscribedAt: new Date(),
    });
  }

  const confirmUrl = siteUrl ? `${siteUrl}/newsletter/confirm?token=${verificationToken}` : "";
  const unsubscribeUrl = siteUrl ? `${siteUrl}/newsletter/unsubscribe?token=${unsubscribeToken}` : "";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
      <h2>Confirmez votre inscription</h2>
      <p>Merci pour votre inscription à notre newsletter.</p>
      ${confirmUrl ? `<p><a href="${confirmUrl}">Cliquez ici pour confirmer</a></p>` : ""}
      ${unsubscribeUrl ? `<p style="margin-top:20px;font-size:12px;color:#666;">Se désinscrire: <a href="${unsubscribeUrl}">ici</a></p>` : ""}
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: "Confirmez votre inscription à la newsletter",
      html,
    });
  } catch (error) {
    if (error?.code === "SMTP_NOT_CONFIGURED") {
      return NextResponse.json(
        {
          error: "SMTP non configuré",
          message: "Veuillez configurer SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS et SMTP_FROM.",
          token: process.env.NODE_ENV !== "production" ? verificationToken : undefined,
        },
        { status: 500 },
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de l'envoi de l'email" }, { status: 500 });
  }

  return NextResponse.json({ status: "pending" });
}
