// One-off CLI to promote a user to admin by email.
// Usage: node scripts/promoteAdmin.js someone@example.com
import "dotenv/config";
import mongoose from "mongoose";
import User from "../Model/Users.model.js";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/promoteAdmin.js <email>");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const user = await User.findOneAndUpdate(
  { email },
  { role: "admin" },
  { new: true }
).select("email role");

if (!user) {
  console.error(`No user found with email: ${email}`);
} else {
  console.log(`✓ ${user.email} is now role: ${user.role}`);
}

await mongoose.disconnect();
