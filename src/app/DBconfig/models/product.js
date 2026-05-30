const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const models = mongoose.models;

const productSchema = new Schema({
  variant: [{ type: mongoose.Schema.Types.ObjectId, ref: "Caracteristique" }],
  variant_color: [{ type: mongoose.Schema.Types.ObjectId, ref: "Caracteristique_color" }],
  categorie: String,
  title: {
    fr: String,
    ar: String,
  },
  price: Number,
  ancien_price: Number,
  array_ProductImg: [{
    secure_url: String,
    public_id_url: String,
  }],
  disponible: String,
  description: {
    fr: String,
    ar: String,
  },
  comments: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Commente" }
  ],
  reduction: [
    {
      reduction: Number,
      quantite: Number,
      dateDebut: Date,
      dateFin: Date,
    },
  ],
  isNew: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  stock: { type: Number, default: 0 },
  trackInventory: { type: Boolean, default: true },
  sku: String,
  status: { type: String, default: "published" },
  purchaseCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const ProductModal = models.Product || mongoose.model("Product", productSchema);
module.exports = ProductModal;
