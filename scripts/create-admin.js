require("dotenv").config();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const UserModal = require("../src/app/DBconfig/models/user");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env");
    process.exit(1);
  }

  if (!process.env.MONGO_URL) {
    console.error("Missing MONGO_URL in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URL);

  const existing = await UserModal.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
    }
    console.log("Admin user already exists:", existing._id.toString());
    return;
  }

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

  const created = await UserModal.create({
    email: ADMIN_EMAIL,
    password: hashedPassword,
    name: "Admin",
    role: "admin",
    emailVerified: true,
  });

  console.log("Admin user created:", created._id.toString());
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
