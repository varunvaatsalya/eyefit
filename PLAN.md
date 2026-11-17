# EyeFit – Multi-Store Optical Management System
## Implementation Plan (Demo Build)

> Goal: a clean, fast web panel to replace the current desktop software (Optocare) across the client's
> 3 optical stores. This first build is for the **client demo**: the core flows should work end-to-end
> with good-looking UI, but it does not need to be production-complete.

---

## 1. What we learned from the current software (screenshots)

### Customer Details screen
- **Customer:** ID, Name, Mobile 1, Mobile 2, Phone, Email, Gender, DOB / Age, Category, Refer Doctor, Address, Remark, Visit date & time
- **Visit / Prescription** (a customer can have many visits):
  - Type: Spectacle / Contact Lens / Sunglasses
  - Right & Left eye: **D.P.** (distance) and **N.P.** (near) rows, each with SPH, CYL, AXIS, VA
  - Right PD, Left PD, R Addition, L Addition, Vertex Distance, Refractive Index, Fitting Height
  - Lens, Shade, Frame (free text)
  - Usage: Constant Use / Near Work / Distance Work
- A customer list grid at the bottom

### Billing Details screen
- Header: Invoice No, Customer ID, Name, Mobile, Date, Delivery Date, Return (Qty/Amount)
- Product tabs: **Frame, Lens, CL Soft, Miscellaneous, Solution, SunGlasses**
- Line item: Barcode, Product, Brand, Model No, Material, Colour, Shape, Size, Rate, Qty, Discount (% / ₹), GST (% / ₹), Sub Total, Total
- Totals: Qty, Sub Total, GST, Discount / Round off, Total, Total Paid, Balance, New Payment
- Payment modes: Cash, Cheque, Card, Return, Paytm, G-Pay, PhonePe, BHIM
- Product delivery status (Pending → …)
- Actions: Print, **Shop Print** (job card for workshop), **Installment**, Return

### Problems with the current UI (what we fix)
- Too many buttons (New / Add / Update / Delete / Save per section) → many clicks per bill
- Customer screen and Billing screen are separate → staff re-enter / re-open things
- Fields marked "DON'T USE" → leftover clutter
- No store separation, no dashboard, no reports at a glance

---

## 2. Key UX principles (minimal clicks)

1. **One-screen "New Sale" flow** – search customer by mobile → prescription → items → payment → Save & Print. All on one page, no page jumps.
2. **Mobile number is the main key** – type 10 digits, existing customer auto-fills; if not found, the same form becomes "new customer" inline.
3. **Copy last prescription** in one click for repeat customers.
4. **Barcode / quick search** to add items; Enter key adds the line, no "Add" button needed.
5. **Auto calculations** – discount, GST, round-off, balance are always live, nothing to "Update".
6. **Keyboard shortcuts** – `F2` New Sale, `Ctrl+K` global search (customer/invoice/product), `Ctrl+S` save, `Ctrl+P` print.
7. **Store switcher** in the top bar (owner only); staff are locked to their store.
8. **Autosave draft** for the sale form, so nothing is lost on refresh.

---

## 3. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router, JavaScript, Cache Components)** | Full-stack in one repo, server actions for mutations |
| Database | **MongoDB** + **Mongoose** (replica set → transactions for bills) | Flexible schema fits prescriptions & product attributes |
| UI | **Tailwind v4 + shadcn/ui (Base UI, indigo theme)** | Clean, modern, fast to build |
| Validation | **Zod** in server actions | Server is the source of truth |
| Tables | shadcn Table + URL-based search/filter/pagination | Shareable links, no extra lib |
| Auth | **Signed JWT cookie (jose) + bcrypt**, `proxy.js` redirect | Simple, no extra service; role + active store resolved on server |
| Charts | **Recharts** (via shadcn chart) | Dashboard sales chart |
| Printing | Print-optimised invoice + job card pages, browser print | No extra service needed |
| Hosting | **Vercel + MongoDB Atlas** | Free tier is enough for the demo |

> **Build status (17 Nov 2026):** Demo build is done in `web/`. Steps 1–8 below are working:
> login + roles, store switcher, dashboard, customers + Rx history, one-screen New Sale, bills with
> delivery tracking + balance collection + cancel, inventory with per-store stock, print invoice + job card.
> Not built yet: autosave draft, settings editing, reports, returns, stock transfer, WhatsApp.

---

## 4. Multi-Store Model

- **Stores** collection – 3 stores (name, code, address, GSTIN, phone, invoice prefix).
- **Customers are shared across all stores** (a customer may visit any branch). Each visit and invoice records which store it happened at.
  *(Confirm with client – alternative is fully separate customer lists per store.)*
- **Inventory is per store** – same product catalogue, separate stock count per store.
- **Invoice numbering per store** – e.g. `EF1-2026-0001`, `EF2-2026-0001`.
- **Roles:**
  - `owner` – sees all stores, switch store or "All Stores" view, reports, settings, users
  - `manager` – full access for their own store
  - `staff` – customers, sales, view stock for their own store (no delete, no reports)
- Every query is filtered by `storeId` from the session on the server (not trusted from the client).

---

## 5. Data Model (MongoDB collections)

```
stores        { _id, name, code, address, phone, gstin, invoicePrefix, isActive }

users         { _id, name, username, passwordHash, role: owner|manager|staff,
                storeIds: [ObjectId], isActive }

customers     { _id, customerNo (auto), name, mobile1 (indexed), mobile2, phone, email,
                gender, dob, category, referDoctorId, address, remark,
                createdAtStoreId, createdAt, lastVisitAt }

prescriptions { _id, customerId, storeId, visitNo, visitDate, type: spectacle|contact|sunglass,
                right: { dp: {sph, cyl, axis, va}, np: {sph, cyl, axis, va}, add, pd },
                left:  { dp: {...}, np: {...}, add, pd },
                vertexDistance, refractiveIndex, fittingHeight,
                lens, shade, frame, usage: [constant|near|distance],
                examinedBy, notes }

doctors       { _id, name, phone, clinic }                 // "Refer Doctor" dropdown

products      { _id, category: frame|lens|contact_lens|solution|sunglass|misc,
                name, brand, modelNo, sku, barcode (indexed),
                attributes: { material, colour, shape, size, index, coating, ... },
                hsn, gstPercent, mrp, sellingPrice, costPrice, isActive }

inventory     { _id, productId, storeId, qty, minQty }     // unique (productId, storeId)

stockMovements{ _id, productId, storeId, type: purchase|sale|return|adjust|transfer_in|transfer_out,
                qty, refId, note, userId, createdAt }

invoices      { _id, invoiceNo, storeId, customerId, prescriptionId, date, deliveryDate,
                items: [{ productId, category, name, brand, modelNo, attributes,
                          rate, qty, discountPct, discountAmt, gstPct, gstAmt, total }],
                subTotal, discountTotal, gstTotal, roundOff, grandTotal,
                payments: [{ mode: cash|card|upi|cheque|return, amount, ref, date, userId }],
                paidTotal, balance,
                status: draft|confirmed|cancelled,
                deliveryStatus: pending|in_lab|ready|delivered,
                notes, createdBy, createdAt }

counters      { _id: "invoice:<storeId>:<year>", seq }     // atomic invoice numbers
```

Notes:
- Invoice items store a **snapshot** of product name/price so old bills never change.
- Saving an invoice decrements `inventory` and writes `stockMovements` inside a **MongoDB transaction**.
- Payments are an array → supports split payment (part cash + part UPI) and **installments / balance collection** later.

---

## 6. App Structure (routes)

```
/login
/(panel)
  /dashboard             today's sales, pending deliveries, balance due, low stock
  /sales/new             ★ one-screen New Sale (customer + Rx + items + payment)
  /sales                 invoice list (filter: date, status, delivery, balance due)
  /sales/[id]            invoice view, collect balance, update delivery status, print
  /customers             customer list + search
  /customers/[id]        profile: details, Rx history timeline, invoices, balance
  /inventory             stock list for current store, low-stock filter
  /inventory/products    product catalogue (add/edit, barcode)
  /inventory/stock-in    quick stock entry (purchase)
  /settings              stores, users, doctors, GST, invoice format   (owner)
/print/invoice/[id]      print layout
/print/job-card/[id]     workshop / lab job card ("Shop Print")
```

Folder layout:
```
src/
  app/            routes above
  components/     ui (shadcn), layout (sidebar, topbar, store-switcher), feature components
  lib/            db.ts (mongoose connect), auth.ts, permissions.ts, calc.ts (billing math)
  models/         Mongoose models
  actions/        server actions (customers, prescriptions, invoices, inventory)
  validations/    Zod schemas
scripts/seed.ts   demo data: 3 stores, users, ~200 products, ~100 customers, sample invoices
```

---

## 7. Demo Scope (build now) vs Later

### ✅ Build for the demo
| Module | Included |
|---|---|
| Auth | Login, roles (owner / staff), store switcher |
| Dashboard | KPI cards (today sales, month sales, pending deliveries, balance due, low stock), 7-day sales chart, recent invoices |
| Customers | List + search (name/mobile), add/edit, profile page with Rx history and invoices |
| Prescription | Full Rx form (same fields as current software, better layout), copy last Rx |
| New Sale | One-screen flow, product search/barcode, category tabs, live totals, discount, GST, split payment, delivery date |
| Invoices | List with filters, view, collect balance, delivery status update, print invoice + job card |
| Inventory | Product catalogue, per-store stock, stock-in, low-stock highlight, auto stock deduction on sale |
| Seed data | Realistic demo data so every screen looks alive |

### ⏳ After demo (Phase 2+)
- Stock transfer between stores
- Returns / exchange flow with credit note
- Reports (GST report, sales by store/staff/category, stock valuation) + Excel export
- WhatsApp / SMS (order ready, bill PDF, eye-test reminder)
- Import old data from Optocare (4100+ customers) via CSV/Excel
- Supplier & purchase orders, lab order tracking
- Audit log, backups, PWA / offline mode

See **FEATURES.md** for the full client-facing feature list.

---

## 8. Build Order (step by step)

1. **Setup** – Next.js + TS + Tailwind + shadcn, MongoDB connection, env, lint
2. **Models + seed script** – all collections, demo data
3. **Auth + layout** – login, sidebar, top bar, store switcher, role guard
4. **Customers + Prescriptions** – list, form, profile, Rx history
5. **Inventory** – products, per-store stock, stock-in
6. **New Sale** (most important for demo) – customer lookup, Rx, items, totals, payments, save (transaction), print
7. **Invoices** – list, detail, balance collection, delivery status, job card print
8. **Dashboard** – KPIs + chart
9. **Polish** – shortcuts, empty states, loading states, toasts, mobile/tablet check, deploy to Vercel

---

## 9. Open Questions for the Client

1. Should customers be **shared across all 3 stores** or separate per store? (Plan assumes shared.)
2. Do they need **GST invoices** (GSTIN on bill, HSN, CGST/SGST split) or simple bills?
3. Invoice print size – **A4, A5, or thermal 80mm**? Current invoice sample would help.
4. Do they want to **import old data** from Optocare? Can they export it (Excel/CSV/DB backup)?
5. Do they use **barcode labels** on frames today? Need label printing?
6. Is the eye test done in-store by an optometrist (need "examined by" field)?
7. Lens orders – do they make lenses in-house or send to an external lab?
8. How many staff users per store?
