const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const models = mongoose.models;

const CommentsSchema = new Schema({
  id_product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: String,
  email: String,
  avis: String,
  createdAt: { type: Date, default: Date.now },
});

const CommentsModal = models.Commente || mongoose.model("Commente", CommentsSchema);
module.exports = CommentsModal;
