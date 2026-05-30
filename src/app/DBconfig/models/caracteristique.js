const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const models = mongoose.models;

const CaracteristiqueSchema = new Schema({
  isActive: { type: Boolean, default: true },
  type: {
    fr: String,
    ar: String,
  },
  array_value: [
    {
      value: String,
      priceAdjustment: { type: Number, required: false },
      isActive: { type: Boolean, default: true },
    }
  ],
});

const CaracteristiqueModal = models.Caracteristique || mongoose.model("Caracteristique", CaracteristiqueSchema);
module.exports = CaracteristiqueModal;
