const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const models = mongoose.models;

const promoCodeSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ["percentage", "fixed", "free_shipping"], default: "percentage" },
    value: { type: Number, default: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxUses: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    applicableCategories: { type: [String], default: [] },
    applicableProducts: { type: [String], default: [] },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const PromoCodeModal = models.PromoCode || mongoose.model("PromoCode", promoCodeSchema);
module.exports = PromoCodeModal;
