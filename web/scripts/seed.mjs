// Demo data seeder:  npm run seed
// Wipes the EyeFit database and fills it with realistic demo data.
import { config } from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  Store, User, Doctor, Customer, Prescription, Product, Inventory, StockMovement, Invoice, Counter,
} from "../src/models/index.js";
import { calcTotals } from "../src/lib/billing.js";

config({ path: ".env.local" });

/* ---------- deterministic random so the demo looks the same every time ---------- */
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const int = (a, b) => Math.floor(rand() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
const power = (min, max) => {
  const v = Math.round((min + rand() * (max - min)) * 4) / 4;
  if (v === 0) return "0.00";
  return v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
};
const daysAgo = (n, hour = int(10, 20)) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, int(0, 59), 0, 0);
  const now = new Date();
  if (d > now) d.setTime(now.getTime() - int(5, 240) * 60000); // never in the future
  return d;
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing in .env.local");
  await mongoose.connect(uri);
  console.log("Connected. Clearing old data…");
  await Promise.all(
    [Store, User, Doctor, Customer, Prescription, Product, Inventory, StockMovement, Invoice, Counter].map((M) =>
      M.deleteMany({})
    )
  );
  await Promise.all([Customer, Product, Inventory, Invoice].map((M) => M.syncIndexes()));

  /* ------------------------------ Stores ------------------------------ */
  const stores = await Store.insertMany([
    { name: "EyeFit Main Market", code: "EF1", invoicePrefix: "EF1", address: "Shop 12, Main Market", city: "Main Branch", phone: "9876500001", gstin: "09ABCDE1234F1Z5" },
    { name: "EyeFit Station Road", code: "EF2", invoicePrefix: "EF2", address: "45, Station Road", city: "Branch 2", phone: "9876500002", gstin: "09ABCDE1234F1Z5" },
    { name: "EyeFit City Mall", code: "EF3", invoicePrefix: "EF3", address: "First Floor, City Mall", city: "Branch 3", phone: "9876500003", gstin: "09ABCDE1234F1Z5" },
  ]);

  /* ------------------------------ Users ------------------------------- */
  const hash = (p) => bcrypt.hashSync(p, 10);
  const users = await User.insertMany([
    { name: "Owner", username: "owner", passwordHash: hash("owner123"), role: "owner", storeIds: stores.map((s) => s._id) },
    { name: "Rahul Verma", username: "ef1", passwordHash: hash("staff123"), role: "manager", storeIds: [stores[0]._id] },
    { name: "Priya Singh", username: "ef2", passwordHash: hash("staff123"), role: "staff", storeIds: [stores[1]._id] },
    { name: "Amit Yadav", username: "ef3", passwordHash: hash("staff123"), role: "staff", storeIds: [stores[2]._id] },
  ]);

  await Doctor.insertMany([
    { name: "EYE FIT (Self)" }, { name: "Dr. S. K. Mishra", clinic: "Mishra Eye Clinic" },
    { name: "Dr. Neha Agarwal", clinic: "Vision Care" }, { name: "Dr. R. P. Gupta", clinic: "City Eye Hospital" },
  ]);

  /* ----------------------------- Products ----------------------------- */
  const products = [];
  let skuN = 1000;
  const add = (p) => products.push({ sku: `SKU${++skuN}`, barcode: `890${String(skuN).padStart(9, "0")}`, ...p });

  const frameBrands = [
    ["Ray-Ban", ["RB5154", "RB3447V", "RB7047", "RB6489"], [4500, 7800]],
    ["Vogue", ["VO5276", "VO2917", "VO5363"], [3200, 5200]],
    ["Titan Eye+", ["TW1032", "TF1218", "TB2203"], [1600, 3200]],
    ["Fastrack", ["FT1104", "FT1291", "FT1357"], [999, 1999]],
    ["Vincent Chase", ["VC5122", "VC6644"], [1200, 2200]],
    ["Carrera", ["CA8834", "CA6656"], [5500, 8900]],
    ["Tommy Hilfiger", ["TH1795", "TH2023"], [4200, 6500]],
    ["IDEE", ["ID2331", "ID2410"], [2200, 3800]],
  ];
  const materials = ["Acetate", "Metal", "TR90", "Titanium", "Ultem"];
  const colours = ["Black", "Gunmetal", "Tortoise", "Gold", "Blue", "Brown", "Silver", "Transparent"];
  const shapes = ["Rectangle", "Round", "Wayfarer", "Cat Eye", "Aviator", "Square", "Clubmaster"];
  for (const [brand, models, [lo, hi]] of frameBrands) {
    for (const modelNo of models) {
      const price = Math.round(int(lo, hi) / 50) * 50 - 1;
      add({
        category: "frame", name: `${brand} ${modelNo} Frame`, brand, modelNo,
        attributes: { material: pick(materials), colour: pick(colours), shape: pick(shapes), size: `${int(48, 56)}-${int(16, 20)}-${int(135, 145)}` },
        hsn: "9003", gstPercent: 5, mrp: price, sellingPrice: price, costPrice: Math.round(price * 0.55),
      });
    }
  }

  const lenses = [
    ["Essilor", "Crizal Prevencia (Blue Cut)", "1.56", 3800],
    ["Essilor", "Crizal Easy Pro", "1.60", 5200],
    ["Essilor", "Varilux Comfort Max (Progressive)", "1.60", 14500],
    ["Zeiss", "SmartLife Single Vision", "1.60", 7900],
    ["Zeiss", "DuraVision BlueProtect", "1.67", 11200],
    ["Hoya", "Hilux BlueControl", "1.56", 4200],
    ["Kodak", "Clean'n'CleAR Single Vision", "1.56", 2400],
    ["Kodak", "Kodak Bifocal KT", "1.56", 3100],
    ["Generic", "Anti-Glare CR39", "1.50", 900],
    ["Generic", "Photochromic Blue Cut", "1.56", 2200],
  ];
  for (const [brand, name, index, price] of lenses) {
    add({
      category: "lens", name: `${brand} ${name}`, brand, modelNo: name.split(" ")[0],
      attributes: { index, coating: name.includes("Blue") ? "Blue Cut" : "Anti-Reflective" },
      hsn: "9001", gstPercent: 5, mrp: price, sellingPrice: price, costPrice: Math.round(price * 0.45),
      trackStock: false,
    });
  }

  const cls = [
    ["Bausch & Lomb", "SofLens 59 (Monthly) 6pk", 1350], ["Bausch & Lomb", "iConnect (Daily) 30pk", 1650],
    ["Acuvue", "Oasys (Bi-weekly) 6pk", 2400], ["Acuvue", "Moist (Daily) 30pk", 2100],
    ["Aqualens", "Aqualens 24h (Monthly) 3pk", 650],
  ];
  for (const [brand, name, price] of cls) {
    add({ category: "contact_lens", name: `${brand} ${name}`, brand, modelNo: name.split(" ")[0], hsn: "9001", gstPercent: 5, mrp: price, sellingPrice: price, costPrice: Math.round(price * 0.6) });
  }

  const sols = [["Bausch & Lomb", "ReNu Fresh 120ml", 290], ["Bausch & Lomb", "ReNu Fresh 355ml", 590], ["Alcon", "Opti-Free Express 120ml", 320], ["Aqualens", "Aquasoft 100ml", 180]];
  for (const [brand, name, price] of sols) {
    add({ category: "solution", name: `${brand} ${name}`, brand, modelNo: name.split(" ")[0], hsn: "3307", gstPercent: 18, mrp: price, sellingPrice: price, costPrice: Math.round(price * 0.65) });
  }

  const suns = [["Ray-Ban", "RB3025 Aviator", 8990], ["Ray-Ban", "RB2140 Wayfarer", 9490], ["Oakley", "Holbrook OO9102", 9990], ["Fastrack", "P357BK1 Polarized", 1499], ["Polaroid", "PLD 2044", 3290], ["Vincent Chase", "VC S11450 Polarized", 1999]];
  for (const [brand, name, price] of suns) {
    add({ category: "sunglass", name: `${brand} ${name}`, brand, modelNo: name.split(" ")[0], attributes: { colour: pick(["Black", "Green", "Brown", "Blue Mirror"]), shape: pick(shapes) }, hsn: "9004", gstPercent: 18, mrp: price, sellingPrice: price, costPrice: Math.round(price * 0.55) });
  }

  const misc = [["EyeFit", "Hard Case", 150], ["EyeFit", "Microfiber Cloth", 50], ["EyeFit", "Lens Cleaner Spray 60ml", 120], ["EyeFit", "Spectacle Chain", 199], ["EyeFit", "Fitting / Repair Charges", 100]];
  for (const [brand, name, price] of misc) {
    add({ category: "misc", name, brand, modelNo: "-", hsn: "9003", gstPercent: 18, mrp: price, sellingPrice: price, costPrice: Math.round(price * 0.4), trackStock: !name.includes("Charges") });
  }

  const productDocs = await Product.insertMany(products);

  /* ---------------------------- Inventory ----------------------------- */
  const stockMap = new Map(); // `${pid}:${sid}` -> qty
  const invRows = [];
  for (const p of productDocs) {
    if (!p.trackStock) continue;
    for (const s of stores) {
      const qty = chance(0.12) ? int(0, 1) : int(3, p.category === "misc" ? 40 : 15);
      stockMap.set(`${p._id}:${s._id}`, qty + 20); // headroom for seeded sales
      invRows.push({ productId: p._id, storeId: s._id, qty: qty + 20, minQty: p.category === "frame" ? 2 : 5 });
    }
  }
  await Inventory.insertMany(invRows);

  /* ---------------------------- Customers ----------------------------- */
  const male = ["Anand Pandey", "Amit Kumar", "Rohit Sharma", "Suresh Gupta", "Vikas Srivastava", "Manoj Tiwari", "Rajesh Yadav", "Deepak Mishra", "Sanjay Verma", "Arvind Singh", "Md Aslamulla", "Imran Khan", "Ravi Shukla", "Pankaj Dubey", "Ashok Jaiswal", "Nitin Agarwal", "Saurabh Tripathi", "Alok Chaurasia", "Gaurav Saxena", "Mohit Rastogi", "Harish Chandra", "Kamal Kishore", "Ajay Maurya", "Vinod Prajapati", "Shivam Pathak"];
  const female = ["Aysha Begum", "Irfana Khatoon", "Mithilesh Devi", "Sunita Sharma", "Pooja Gupta", "Neha Singh", "Anjali Verma", "Kavita Yadav", "Rekha Srivastava", "Shalini Mishra", "Priyanka Tiwari", "Nazia Parveen", "Ritu Agarwal", "Seema Pandey", "Meena Kumari", "Swati Dubey", "Archana Rai", "Komal Jaiswal", "Divya Saxena", "Rashmi Shukla"];
  const doctors = ["EYE FIT (Self)", "EYE FIT (Self)", "EYE FIT (Self)", "Dr. S. K. Mishra", "Dr. Neha Agarwal", "Dr. R. P. Gupta"];
  const areas = ["Civil Lines", "Gandhi Nagar", "Rajendra Nagar", "Station Road", "Shastri Nagar", "Indira Nagar", "Model Town", "Sadar Bazar"];

  const customers = [];
  const N = 140;
  for (let i = 0; i < N; i++) {
    const isMale = chance(0.55);
    const base = isMale ? pick(male) : pick(female);
    const title = isMale ? (base.startsWith("Md") ? "" : "Mr ") : pick(["Mrs ", "Ms "]);
    const age = int(8, 72);
    const created = daysAgo(chance(0.35) ? int(340, 700) : int(0, 120));
    const dobMonth = chance(0.12) ? new Date().getMonth() : int(0, 11);
    const dob = chance(0.5) ? new Date(new Date().getFullYear() - age, dobMonth, int(1, 28)) : undefined;
    customers.push({
      customerNo: 4001 + i,
      name: `${title}${base}`.toUpperCase(),
      mobile: `${pick(["9", "8", "7", "6"])}${String(int(100000000, 999999999))}`,
      gender: isMale ? "male" : "female",
      age,
      dob,
      referDoctor: pick(doctors),
      address: `${int(1, 250)}, ${pick(areas)}`,
      category: chance(0.1) ? "VIP" : "",
      createdAtStoreId: pick(stores)._id,
      createdAt: created,
      lastVisitAt: created,
    });
  }
  const customerDocs = await Customer.insertMany(customers);
  await Counter.create({ _id: "customer", seq: 4000 + N });

  /* --------------------------- Prescriptions -------------------------- */
  const rxDocs = [];
  const makeRx = (c, storeId, date, visitNo) => {
    const myopic = chance(0.65);
    const s = () => (myopic ? power(-6, -0.25) : power(0.25, 4));
    const cyl = () => (chance(0.5) ? power(-2, -0.25) : "");
    const needsAdd = c.age > 40;
    const add = needsAdd ? power(1, 2.75).replace("-", "+") : "";
    const eye = () => {
      const c1 = cyl();
      return {
        dp: { sph: s(), cyl: c1, axis: c1 ? String(int(1, 18) * 10) : "", va: pick(["6/6", "6/6", "6/9"]) },
        np: needsAdd ? { sph: "", cyl: "", axis: "", va: pick(["N6", "N8"]) } : {},
        add,
        pd: String(int(30, 33)),
      };
    };
    return {
      customerId: c._id, storeId, visitNo, visitDate: date,
      type: chance(0.88) ? "spectacle" : "contact",
      right: eye(), left: eye(),
      lens: needsAdd ? "Progressive" : pick(["Blue Cut", "Anti-Glare", "Photochromic"]),
      usage: needsAdd ? ["constant"] : [pick(["constant", "distance", "near"])],
      fittingHeight: needsAdd ? String(int(18, 24)) : "",
      examinedBy: "Optometrist",
    };
  };
  for (const c of customerDocs) {
    if (chance(0.1)) continue;
    const visits = chance(0.25) ? 2 : 1;
    for (let v = 1; v <= visits; v++) {
      const date = v === 1 ? c.createdAt : daysAgo(int(0, 300));
      rxDocs.push(makeRx(c, c.createdAtStoreId, date, v));
    }
  }
  const prescriptionDocs = await Prescription.insertMany(rxDocs);
  const rxByCustomer = new Map();
  for (const rx of prescriptionDocs) rxByCustomer.set(String(rx.customerId), rx);

  /* ----------------------------- Invoices ----------------------------- */
  const byCat = (cat) => productDocs.filter((p) => p.category === cat);
  const frames = byCat("frame"), lensP = byCat("lens"), clP = byCat("contact_lens"), solP = byCat("solution"), sunP = byCat("sunglass"), miscP = byCat("misc");
  const toItem = (p, qty = 1, discountPct = 0) => ({
    productId: p._id, category: p.category, name: p.name, brand: p.brand, modelNo: p.modelNo,
    details: [p.attributes?.colour, p.attributes?.size, p.attributes?.index && `Index ${p.attributes.index}`].filter(Boolean).join(" · "),
    rate: p.sellingPrice, qty, discountPct, gstPct: p.gstPercent,
  });

  const counters = Object.fromEntries(stores.map((s) => [String(s._id), 0]));
  const invoices = [];
  const movements = [];
  for (let i = 0; i < 230; i++) {
    const day = Math.floor(rand() * 40);
    const date = daysAgo(day);
    const store = chance(0.42) ? stores[0] : chance(0.55) ? stores[1] : stores[2];
    const customer = pick(customerDocs);
    const rx = rxByCustomer.get(String(customer._id));

    const items = [];
    const kind = rand();
    const disc = pick([0, 0, 0, 5, 10, 10, 15]);
    if (kind < 0.62) {
      items.push(toItem(pick(frames), 1, disc), toItem(pick(lensP), 2, disc));
      if (chance(0.3)) items.push(toItem(miscP[0]));
    } else if (kind < 0.74) {
      items.push(toItem(pick(lensP), 2, disc));
    } else if (kind < 0.86) {
      items.push(toItem(pick(sunP), 1, disc));
    } else {
      items.push(toItem(pick(clP), int(1, 2)), toItem(pick(solP)));
    }

    const extraDiscount = chance(0.2) ? pick([50, 100, 200]) : 0;
    const t = calcTotals(items, extraDiscount);
    const hasLens = items.some((it) => it.category === "lens");
    const deliveryDate = new Date(date);
    deliveryDate.setDate(deliveryDate.getDate() + (hasLens ? int(2, 5) : 0));

    let deliveryStatus = "delivered";
    if (hasLens) {
      if (day <= 1) deliveryStatus = pick(["pending", "in_lab"]);
      else if (day <= 4) deliveryStatus = pick(["in_lab", "ready", "ready", "delivered"]);
      else if (day <= 8) deliveryStatus = pick(["ready", "delivered", "delivered"]);
    }

    let paid = t.grandTotal;
    if (deliveryStatus !== "delivered" && chance(0.7)) paid = Math.round((t.grandTotal * pick([0.3, 0.5, 0.5, 0.6])) / 100) * 100;
    const payments = [{ mode: pick(["cash", "upi", "upi", "upi", "card"]), amount: paid, date, userId: users[0]._id }];

    counters[String(store._id)] += 1;
    const invoiceNo = `${store.invoicePrefix}-${String(counters[String(store._id)]).padStart(5, "0")}`;
    const _id = new mongoose.Types.ObjectId();
    invoices.push({
      _id, invoiceNo, storeId: store._id, customerId: customer._id,
      customerSnapshot: { name: customer.name, mobile: customer.mobile, customerNo: customer.customerNo },
      prescriptionId: hasLens && rx ? rx._id : undefined,
      date, deliveryDate,
      items: t.lines, subTotal: t.subTotal, itemDiscount: t.itemDiscount, extraDiscount: t.extraDiscount,
      gstTotal: t.gstTotal, roundOff: t.roundOff, grandTotal: t.grandTotal,
      payments, paidTotal: paid, balance: Math.round((t.grandTotal - paid) * 100) / 100,
      deliveryStatus, createdBy: users[0]._id, createdAt: date, updatedAt: date,
    });

    for (const it of items) {
      const p = productDocs.find((x) => String(x._id) === String(it.productId));
      if (!p.trackStock) continue;
      const k = `${p._id}:${store._id}`;
      stockMap.set(k, (stockMap.get(k) ?? 0) - it.qty);
      movements.push({ productId: p._id, storeId: store._id, type: "sale", qty: -it.qty, refId: _id, createdAt: date });
    }
  }
  invoices.sort((a, b) => a.date - b.date);
  await Invoice.insertMany(invoices);
  await StockMovement.insertMany(movements);
  await Counter.insertMany(stores.map((s) => ({ _id: `invoice:${s._id}`, seq: counters[String(s._id)] })));

  // apply sold qty to inventory
  await Inventory.bulkWrite(
    [...stockMap.entries()].map(([k, qty]) => {
      const [productId, storeId] = k.split(":");
      return { updateOne: { filter: { productId, storeId }, update: { $set: { qty: Math.max(0, qty - 20 + int(0, 3)) } } } };
    })
  );

  // last visit = latest invoice/rx
  const lastVisit = new Map();
  for (const inv of invoices) lastVisit.set(String(inv.customerId), inv.date);
  await Customer.bulkWrite(
    [...lastVisit.entries()].map(([id, d]) => ({ updateOne: { filter: { _id: id }, update: { $set: { lastVisitAt: d } } } }))
  );

  console.log(`Seeded: ${stores.length} stores, ${users.length} users, ${productDocs.length} products, ${customerDocs.length} customers, ${prescriptionDocs.length} prescriptions, ${invoices.length} invoices`);
  console.log("\nLogins:\n  owner / owner123   (all stores)\n  ef1 / staff123     (Main Market, manager)\n  ef2 / staff123     (Station Road, staff)\n  ef3 / staff123     (City Mall, staff)");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
