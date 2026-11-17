import mongoose from "mongoose";

const { Schema, model, models } = mongoose;
const ObjectId = Schema.Types.ObjectId;

function defineModel(name, schema) {
  return models[name] || model(name, schema);
}

/* ----------------------------- Store ----------------------------- */
const StoreSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true }, // EF1, EF2...
    address: String,
    city: String,
    phone: String,
    gstin: String,
    invoicePrefix: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* ----------------------------- User ------------------------------ */
const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["owner", "manager", "staff"], default: "staff" },
    storeIds: [{ type: ObjectId, ref: "Store" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/* ---------------------------- Doctor ----------------------------- */
const DoctorSchema = new Schema({ name: { type: String, required: true }, phone: String, clinic: String });

/* --------------------------- Customer ---------------------------- */
const CustomerSchema = new Schema(
  {
    customerNo: { type: Number, unique: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, index: true },
    mobile2: String,
    phone: String,
    email: String,
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    dob: Date,
    age: Number,
    category: String,
    referDoctor: String,
    address: String,
    city: String,
    remark: String,
    createdAtStoreId: { type: ObjectId, ref: "Store" },
    lastVisitAt: Date,
  },
  { timestamps: true }
);
CustomerSchema.index({ name: "text" });

/* ------------------------- Prescription -------------------------- */
const EyeRowSchema = new Schema({ sph: String, cyl: String, axis: String, va: String }, { _id: false });
const EyeSchema = new Schema(
  { dp: { type: EyeRowSchema, default: {} }, np: { type: EyeRowSchema, default: {} }, add: String, pd: String },
  { _id: false }
);

const PrescriptionSchema = new Schema(
  {
    customerId: { type: ObjectId, ref: "Customer", required: true, index: true },
    storeId: { type: ObjectId, ref: "Store", required: true },
    visitNo: Number,
    visitDate: { type: Date, default: Date.now },
    type: { type: String, enum: ["spectacle", "contact", "sunglass"], default: "spectacle" },
    right: { type: EyeSchema, default: {} },
    left: { type: EyeSchema, default: {} },
    vertexDistance: String,
    refractiveIndex: String,
    fittingHeight: String,
    lens: String,
    shade: String,
    frame: String,
    usage: [{ type: String, enum: ["constant", "near", "distance"] }],
    examinedBy: String,
    notes: String,
  },
  { timestamps: true }
);

/* ---------------------------- Product ---------------------------- */
const ProductSchema = new Schema(
  {
    category: {
      type: String,
      enum: ["frame", "lens", "contact_lens", "solution", "sunglass", "misc"],
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    brand: String,
    modelNo: String,
    sku: { type: String, unique: true, sparse: true },
    barcode: { type: String, index: true },
    attributes: {
      material: String,
      colour: String,
      shape: String,
      size: String,
      index: String,
      coating: String,
    },
    hsn: String,
    gstPercent: { type: Number, default: 5 },
    mrp: Number,
    sellingPrice: { type: Number, required: true },
    costPrice: Number,
    trackStock: { type: Boolean, default: true }, // false for made-to-order lenses
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
ProductSchema.index({ name: "text", brand: "text", modelNo: "text" });

/* --------------------------- Inventory --------------------------- */
const InventorySchema = new Schema(
  {
    productId: { type: ObjectId, ref: "Product", required: true },
    storeId: { type: ObjectId, ref: "Store", required: true },
    qty: { type: Number, default: 0 },
    minQty: { type: Number, default: 2 },
  },
  { timestamps: true }
);
InventorySchema.index({ productId: 1, storeId: 1 }, { unique: true });

/* ------------------------ Stock Movement ------------------------- */
const StockMovementSchema = new Schema(
  {
    productId: { type: ObjectId, ref: "Product", required: true },
    storeId: { type: ObjectId, ref: "Store", required: true },
    type: { type: String, enum: ["purchase", "sale", "return", "adjust", "transfer_in", "transfer_out"] },
    qty: Number, // signed: +in / -out
    refId: ObjectId,
    note: String,
    userId: { type: ObjectId, ref: "User" },
  },
  { timestamps: true }
);

/* ---------------------------- Invoice ---------------------------- */
const InvoiceItemSchema = new Schema(
  {
    productId: { type: ObjectId, ref: "Product" },
    category: String,
    name: String,
    brand: String,
    modelNo: String,
    details: String,
    rate: Number,
    qty: Number,
    discountPct: Number,
    discountAmt: Number,
    taxable: Number,
    gstPct: Number,
    gstAmt: Number,
    total: Number,
  },
  { _id: false }
);

const PaymentSchema = new Schema(
  {
    mode: { type: String, enum: ["cash", "upi", "card", "cheque"], default: "cash" },
    amount: Number,
    ref: String,
    date: { type: Date, default: Date.now },
    userId: { type: ObjectId, ref: "User" },
  },
  { _id: true }
);

const InvoiceSchema = new Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    storeId: { type: ObjectId, ref: "Store", required: true, index: true },
    customerId: { type: ObjectId, ref: "Customer", required: true, index: true },
    customerSnapshot: { name: String, mobile: String, customerNo: Number },
    prescriptionId: { type: ObjectId, ref: "Prescription" },
    date: { type: Date, default: Date.now, index: true },
    deliveryDate: Date,
    items: [InvoiceItemSchema],
    subTotal: Number,
    itemDiscount: Number,
    extraDiscount: { type: Number, default: 0 },
    gstTotal: Number,
    roundOff: Number,
    grandTotal: Number,
    payments: [PaymentSchema],
    paidTotal: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
    deliveryStatus: {
      type: String,
      enum: ["pending", "in_lab", "ready", "delivered"],
      default: "pending",
      index: true,
    },
    notes: String,
    // WhatsApp preferences chosen at billing (sending is not wired yet; Business API planned)
    whatsapp: { sendBill: { type: Boolean, default: false }, dueReminder: { type: Boolean, default: false } },
    createdBy: { type: ObjectId, ref: "User" },
  },
  { timestamps: true }
);

/* ---------------------------- Enquiry ---------------------------- */
// Leads from the public website (eye-test bookings, frame / lens enquiries).
const EnquirySchema = new Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    storeId: { type: ObjectId, ref: "Store" }, // null = any store
    reason: { type: String, enum: ["eyetest", "frames", "contact_lens", "repair", "other"], default: "eyetest" },
    preferredDate: Date,
    message: String,
    status: { type: String, enum: ["new", "contacted", "closed"], default: "new", index: true },
  },
  { timestamps: true }
);

/* ---------------------------- Counter ---------------------------- */
const CounterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });

export const Store = defineModel("Store", StoreSchema);
export const User = defineModel("User", UserSchema);
export const Doctor = defineModel("Doctor", DoctorSchema);
export const Customer = defineModel("Customer", CustomerSchema);
export const Prescription = defineModel("Prescription", PrescriptionSchema);
export const Product = defineModel("Product", ProductSchema);
export const Inventory = defineModel("Inventory", InventorySchema);
export const StockMovement = defineModel("StockMovement", StockMovementSchema);
export const Invoice = defineModel("Invoice", InvoiceSchema);
export const Counter = defineModel("Counter", CounterSchema);
export const Enquiry = defineModel("Enquiry", EnquirySchema);

export async function nextSequence(key, session) {
  const doc = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session }
  );
  return doc.seq;
}
