const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const models = mongoose.models;

const Price_minimumSchema = new Schema({
  role: String,
  price_min: Number,
});

const Price_minModal = models.Price_min || mongoose.model("Price_min", Price_minimumSchema);
module.exports = Price_minModal;
