const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const models = mongoose.models;

const favoriteSchema = new Schema(
  {
    id_user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    id_product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true },
);

favoriteSchema.index({ id_user: 1, id_product: 1 }, { unique: true });

const FavoriteModal = models.Favorite || mongoose.model("Favorite", favoriteSchema);
module.exports = FavoriteModal;
