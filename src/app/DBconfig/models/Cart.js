const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const models = mongoose.models;

const CartSchema = new Schema({
  id_user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  id_product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantite: Number,
  caracteristique: { type: Map, of: String },
  caracteristique_couleur: {
    type: { type: String },
    img: { type: String },
  },
  priceData: {
    basePrice: Number,
    priceAdjustment: Number,
    unitPrice: Number,
    totalPrice: Number
  }
}, { timestamps: true });

CartSchema.index({ id_user: 1 });
CartSchema.index({ id_user: 1, id_product: 1 });

const CartModal = models.Cart || mongoose.model("Cart", CartSchema);
module.exports = CartModal;
