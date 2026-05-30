import PromoCodeModal from "@/app/DBconfig/models/PromoCode";
import CartModal from "@/app/DBconfig/models/Cart";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import { NextResponse } from "next/server";

const calculateTotalPricev2 = (reductions = [], totalQuantity, totalPrice) => {
  if (!reductions || reductions.length === 0) return totalPrice;
  const sortedReductions = [...reductions].sort((a, b) => (b.quantite || 0) - (a.quantite || 0));
  let remainingQuantity = totalQuantity;
  let finalPrice = totalPrice;

  for (const reduction of sortedReductions) {
    if (remainingQuantity <= 0) break;
    const reductionQuantity = reduction.quantite || 0;
    const reductionAmount = reduction.reduction || 0;
    if (reductionQuantity <= 0) continue;

    if (remainingQuantity >= reductionQuantity) {
      const reductionCount = Math.floor(remainingQuantity / reductionQuantity);
      finalPrice -= reductionCount * reductionAmount;
      remainingQuantity -= reductionCount * reductionQuantity;
    }
  }

  return finalPrice;
};

export async function POST(request) {
  const body = await request.json();
  const { code, id_user } = body || {};

  if (!code || !id_user) {
    return NextResponse.json({ valid: false, message: "Code promo invalide" }, { status: 400 });
  }

  await connectMongoDB();

  const promo = await PromoCodeModal.findOne({ code: code.toUpperCase() });
  if (!promo || !promo.active) {
    return NextResponse.json({ valid: false, message: "Code promo invalide" }, { status: 200 });
  }

  const now = new Date();
  if (promo.startDate && now < promo.startDate) {
    return NextResponse.json({ valid: false, message: "Code promo pas encore actif" }, { status: 200 });
  }
  if (promo.endDate && now > promo.endDate) {
    return NextResponse.json({ valid: false, message: "Code promo expiré" }, { status: 200 });
  }
  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
    return NextResponse.json({ valid: false, message: "Code promo épuisé" }, { status: 200 });
  }

  const cartItems = await CartModal.find({ id_user }).populate("id_product");
  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ valid: false, message: "Panier vide" }, { status: 200 });
  }

  const grouped = new Map();
  for (const item of cartItems) {
    const product = item.id_product;
    const productId = product?._id?.toString() || item._id?.toString();
    const unitPrice = item.priceData?.unitPrice ?? product?.price ?? 0;
    const itemTotal = unitPrice * item.quantite;

    if (!grouped.has(productId)) {
      grouped.set(productId, { product, totalQuantity: 0, totalPrice: 0 });
    }
    const entry = grouped.get(productId);
    entry.totalQuantity += item.quantite;
    entry.totalPrice += itemTotal;
  }

  let subtotalAfterReductions = 0;
  let eligibleSubtotal = 0;

  for (const entry of grouped.values()) {
    const reductions = entry.product?.reduction || [];
    const reducedTotal = calculateTotalPricev2(reductions, entry.totalQuantity, entry.totalPrice);
    subtotalAfterReductions += reducedTotal;

    const productId = entry.product?._id?.toString();
    const category = entry.product?.categorie;
    const appliesToProduct = promo.applicableProducts?.length
      ? promo.applicableProducts.includes(productId)
      : true;
    const appliesToCategory = promo.applicableCategories?.length
      ? promo.applicableCategories.includes(category)
      : true;

    if (appliesToProduct && appliesToCategory) {
      eligibleSubtotal += reducedTotal;
    }
  }

  if (promo.minOrderAmount > 0 && subtotalAfterReductions < promo.minOrderAmount) {
    return NextResponse.json({
      valid: false,
      message: `Minimum de commande ${promo.minOrderAmount} DZD`,
    }, { status: 200 });
  }

  let discountAmount = 0;
  let freeShipping = false;

  if (promo.type === "percentage") {
    discountAmount = (eligibleSubtotal * promo.value) / 100;
  } else if (promo.type === "fixed") {
    discountAmount = Math.min(promo.value || 0, eligibleSubtotal);
  } else if (promo.type === "free_shipping") {
    freeShipping = true;
  }

  return NextResponse.json({
    valid: true,
    code: promo.code,
    type: promo.type,
    value: promo.value,
    discountAmount,
    freeShipping,
    subtotal: subtotalAfterReductions,
    eligibleSubtotal,
  });
}
