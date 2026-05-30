const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const models = mongoose.models;

const Caracteristique_colorSchema = new Schema({
  type: String,
  isActive: { type: Boolean, default: true },
  img: {
    secure_url: String,
    public_id_url: String,
  },
  priceAdjustment: {
    type: Number,
    required: false,
  },
});

const Caracteristique_colorModal =
  models.Caracteristique_color ||
  mongoose.model("Caracteristique_color", Caracteristique_colorSchema);

module.exports = Caracteristique_colorModal;
