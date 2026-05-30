const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const models = mongoose.models;

const OrderSchema = new Schema({
  id_user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  orderNumber: { type: String, index: true },
  array_product: [
    {
      id_product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantite: Number,
      price: Number,
      caracteristique: { type: Map, of: String },
      caracteristique_couleur: {
        type: { type: String, default: "" },
        img: { type: String, default: "" },
      },
    },
  ],
  status: { type: String, default: "en attente" },
  createdAt: { type: Date, default: Date.now },
  trackingNumber: { type: String, default: "" },
  yalidineTracking: {
    parcel_id: String,
    tracking_url: String,
    status: String,
    history: [
      {
        date: Date,
        status: String,
        description: String,
      },
    ],
  },
  customerDetails: {
    fullName: String,
    email: String,
    phoneNumber: String,
    wilaya: String,
    deliveryType: { type: String, enum: ["relayPoint", "homeDelivery"] },
    commune: String,
    address: String,
    note: String,
    relayPoint: {
      center_id: Number,
      name: String,
      address: String,
      commune_id: Number,
      commune_name: String,
      wilaya_id: Number,
      wilaya_name: String,
    },
  },
  deliveryFees: Number,
  total: Number,
  subtotalBeforePromo: { type: Number, default: 0 },
  promoCode: { type: String, default: "" },
  promoType: { type: String, default: "" },
  promoValue: { type: Number, default: 0 },
  promoDiscount: { type: Number, default: 0 },
  promoFreeShipping: { type: Boolean, default: false },
});

const OrderModal = models.Order || mongoose.model("Order", OrderSchema);
module.exports = OrderModal;
