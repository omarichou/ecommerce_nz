const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const models = mongoose.models;

const userSchema = new Schema({
  name: String,
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  phoneNumber: String,
  role: { type: String, default: "user" },
  emailVerified: { type: Boolean, default: false },
  verificationToken: String,
  photo: String,
  public_id_img: String,
  Latitude: String,
  Longitude: String,
});

const UserModal = models.User || mongoose.model("User", userSchema);
module.exports = UserModal;
