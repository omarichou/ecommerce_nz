const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const models = mongoose.models;

const newsletterSubscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String, default: "" },
    subscribedAt: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
    verified: { type: Boolean, default: false },
    verificationToken: { type: String, default: "" },
    verifiedAt: { type: Date, default: null },
    unsubscribeToken: { type: String, default: "" },
  },
  { timestamps: true },
);

const NewsletterSubscriberModal = models.NewsletterSubscriber || mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);
module.exports = NewsletterSubscriberModal;
