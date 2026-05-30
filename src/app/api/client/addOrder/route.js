import { connectMongoDB } from "app/DBconfig/mongodb";
import { NextResponse } from "next/server";
import OrderModal from "app/DBconfig/models/Order";
import ProductModal from "app/DBconfig/models/product";
import PromoCodeModal from "app/DBconfig/models/PromoCode";
import { sendEmail } from "@/lib/email";

const formatCurrency = (value) => {
  if (typeof value !== "number") return "0";
  return value.toLocaleString("fr-FR");
};

const resolveBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "";
};

const renderOrderEmail = ({ order, items = [], productMap = {}, type = "admin" }) => {
  const rows = items
    .map((item) => {
      const productId = typeof item?.id_product === "string" ? item.id_product : item?.id_product?._id;
      const mappedTitle = productId ? productMap[productId] : "";
      const title = item?.id_product?.title?.fr || mappedTitle || "Produit";
      const qty = item?.quantite || 0;
      const price = formatCurrency(item?.price || 0);
      const variant = item?.caracteristique
        ? Object.entries(item.caracteristique)
            .map(([key, value]) => `${key}: ${value}`)
            .join(" • ")
        : "";
      const color = item?.caracteristique_couleur?.type ? `Couleur: ${item.caracteristique_couleur.type}` : "";
      const meta = [variant, color].filter(Boolean).join(" • ");
      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #eee;">${title}${meta ? `<div style=\"color:#777;font-size:12px;\">${meta}</div>` : ""}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${qty}</td>
          <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${price} DZD</td>
        </tr>
      `;
    })
    .join("");

  const customer = order?.customerDetails || {};
  const promoLine = order?.promoCode
    ? `<p style="margin:4px 0;">Code promo: <strong>${order.promoCode}</strong> (-${formatCurrency(order.promoDiscount || 0)} DZD)</p>`
    : "";

  const heading = type === "client" ? "Nous avons bien reçu votre commande" : "Nouvelle commande";
  const statusLine =
    type === "client"
      ? "Merci pour votre confiance. Nous vous contacterons pour confirmer votre commande."
      : `Statut: ${order?.status || "en attente"}`;
  const trackingLine =
    type === "client" && order?.trackingNumber
      ? `<p style="margin:4px 0;">Numéro de suivi: <strong>${order.trackingNumber}</strong></p>`
      : "";
  const trackingLink =
    type === "client" && order?.orderNumber
      ? (() => {
          const baseUrl = resolveBaseUrl();
          if (!baseUrl) return "";
          const link = `${baseUrl}/track-order?order=${encodeURIComponent(order.orderNumber)}`;
          return `<p style="margin:8px 0;"><a href="${link}" style="color:#B88A3B;font-weight:600;">Suivre ma commande</a></p>`;
        })()
      : "";

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
      <h2 style="margin-bottom:6px;">${heading}</h2>
      <p style="margin-top:0;color:#555;">${statusLine}</p>

      <p style="margin:4px 0;">Numéro de commande: <strong>${order?.orderNumber || order?._id}</strong></p>
      ${trackingLine}
      ${trackingLink}
      <h3 style="margin:20px 0 8px;">${type === "client" ? "Informations de livraison" : "Client"}</h3>
      <p style="margin:4px 0;">Nom: <strong>${customer.fullName || ""}</strong></p>
      ${type === "admin" ? `<p style=\"margin:4px 0;\">Email: ${customer.email || ""}</p>` : ""}
      <p style="margin:4px 0;">Téléphone: ${customer.phoneNumber || ""}</p>
      <p style="margin:4px 0;">Wilaya: ${customer.wilaya || ""}</p>
      <p style="margin:4px 0;">Livraison: ${customer.deliveryType || ""}</p>
      ${customer.deliveryType === "homeDelivery" ? `<p style=\"margin:4px 0;\">Adresse: ${customer.address || ""}</p>` : ""}
      ${customer.deliveryType === "relayPoint" && customer.relayPoint ? `<p style=\"margin:4px 0;\">Point relais: ${customer.relayPoint.name || ""} (${customer.relayPoint.address || ""})</p>` : ""}
      ${customer.note ? `<p style=\"margin:4px 0;\">Note: ${customer.note}</p>` : ""}

      <h3 style="margin:20px 0 8px;">Produits</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:10px;border-bottom:1px solid #ddd;">Produit</th>
            <th style="text-align:center;padding:10px;border-bottom:1px solid #ddd;">Qté</th>
            <th style="text-align:right;padding:10px;border-bottom:1px solid #ddd;">Prix</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div style="margin-top:16px;background:#f8f8f8;padding:12px;border-radius:8px;">
        <p style="margin:4px 0;">Sous-total: <strong>${formatCurrency(order?.subtotalBeforePromo || 0)} DZD</strong></p>
        ${promoLine}
        <p style="margin:4px 0;">Livraison: <strong>${formatCurrency(order?.deliveryFees || 0)} DZD</strong></p>
        <p style="margin:4px 0;">Total: <strong>${formatCurrency(order?.total || 0)} DZD</strong></p>
      </div>
      ${type === "client" ? "<p style=\"margin-top:16px;color:#666;font-size:12px;\">Si vous avez des questions, répondez à cet email.</p>" : ""}
    </div>
  `;
};

export async function POST(request) {
  // 1- Receive data from Front-end
  const objFromFrontEnd = await request.json();
  console.log("*******************************************");
  console.log(objFromFrontEnd);

  // 1- connect to DB
  await connectMongoDB();
 

  

  // 4- Try to Store obj to DB
  const orderNumber = objFromFrontEnd?.orderNumber || `ELG-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const createdOrder = await OrderModal.create({
    ...objFromFrontEnd,
    orderNumber,
  });

  if (objFromFrontEnd?.promoCode) {
    try {
      await PromoCodeModal.findOneAndUpdate(
        { code: objFromFrontEnd.promoCode.toUpperCase() },
        { $inc: { usedCount: 1 } },
      );
    } catch (error) {
      console.error("Failed to increment promo code usage:", error);
    }
  }

  const productIds = (objFromFrontEnd?.array_product || [])
    .map((item) => (typeof item?.id_product === "string" ? item.id_product : item?.id_product?._id))
    .filter(Boolean);

  let productMap = {};
  if (productIds.length > 0) {
    const products = await ProductModal.find({ _id: { $in: productIds } }, { title: 1 });
    productMap = products.reduce((acc, product) => {
      acc[product._id.toString()] = product.title?.fr || "Produit";
      return acc;
    }, {});
  }

  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;
  const customerEmail = objFromFrontEnd?.customerDetails?.email;
  if (adminEmail) {
    try {
      const html = renderOrderEmail({
        order: createdOrder,
        items: objFromFrontEnd?.array_product || [],
        productMap,
        type: "admin",
      });
      await sendEmail({
        to: adminEmail,
        subject: `Nouvelle commande - ${createdOrder?.orderNumber || createdOrder?._id}`,
        html,
      });
    } catch (error) {
      if (error?.code !== "SMTP_NOT_CONFIGURED") {
        console.error("Order email error", error);
      }
    }
  }

  if (customerEmail) {
    try {
      const html = renderOrderEmail({
        order: createdOrder,
        items: objFromFrontEnd?.array_product || [],
        productMap,
        type: "client",
      });
      await sendEmail({
        to: customerEmail,
        subject: `Confirmation de commande - ${createdOrder?.orderNumber || createdOrder?._id}`,
        html,
      });
    } catch (error) {
      if (error?.code !== "SMTP_NOT_CONFIGURED") {
        console.error("Customer email error", error);
      }
    }
  }

  // 4- Go back to frontend
  return NextResponse.json({
    orderId: createdOrder?._id,
    orderNumber: createdOrder?.orderNumber || orderNumber,
    trackingNumber: createdOrder?.trackingNumber || "",
  });
}
