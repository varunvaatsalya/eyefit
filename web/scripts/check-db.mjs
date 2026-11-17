// Quick diagnosis for login problems on a deployed DB.
// Usage (PowerShell, inside web/):
//   $env:MONGODB_URI="mongodb+srv://..."; npm run check-db
import { config } from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

config({ path: ".env.local", quiet: true }); // does NOT override a MONGODB_URI you set in the shell

const uri = process.env.MONGODB_URI;
const ok = (m) => console.log("  ✅", m);
const bad = (m) => console.log("  ❌", m);

if (!uri) {
  bad("MONGODB_URI is not set");
  process.exit(1);
}

const safe = uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
console.log("\nChecking", safe, "\n");

const dbName = new URL(uri.replace("mongodb+srv://", "http://").replace("mongodb://", "http://")).pathname.slice(1);
if (!dbName) bad('No database name in the URI. Add "/eyefit" before the "?", e.g. ...mongodb.net/eyefit?retryWrites=true');
else ok(`Database name in URI: "${dbName}"`);

if (/[#@\s]/.test(decodeURIComponent(uri.split("//")[1].split("@").slice(0, -1).join("@").split(":")[1] ?? ""))) {
  console.log("  ⚠️  Password has special characters (@ # space). URL-encode them, e.g. @ → %40, # → %23");
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  ok(`Connected to ${mongoose.connection.host}`);
} catch (e) {
  bad(`Cannot connect: ${e.message}`);
  console.log("     → Atlas → Network Access → add 0.0.0.0/0 · check username/password in Database Access");
  process.exit(1);
}

const db = mongoose.connection.db;
const users = db.collection("users");
const count = await users.countDocuments();
if (!count) {
  bad(`No users in "${db.databaseName}". Run the seed against this URI:  npm run seed`);
  await mongoose.disconnect();
  process.exit(1);
}
ok(`${count} users found in "${db.databaseName}"`);

const owner = await users.findOne({ username: "owner" });
if (!owner) bad('User "owner" not found');
else if (!owner.isActive) bad('User "owner" is disabled');
else if (await bcrypt.compare("owner123", owner.passwordHash)) ok('"owner / owner123" password matches');
else bad('"owner" exists but password is not owner123 (re-run seed)');

const stores = await db.collection("stores").countDocuments();
stores ? ok(`${stores} stores found`) : bad("No stores (re-run seed)");

console.log("\nIf all ✅ here but Vercel login still fails:");
console.log("  1. Vercel env vars set for the right environment (Production AND Preview if you open preview URLs)");
console.log("  2. Redeploy after changing env vars");
console.log("  3. The URI in Vercel is exactly this one (same db name, same password)\n");
await mongoose.disconnect();
