# Demo cheat sheet

## Before
- `cd web && npm run dev` → http://localhost:3000
- Login: `owner / owner123` (all stores) · `ef1 / staff123` (one store)
- Fresh data if needed: `npm run seed` (re-login after)

## Demo flow (10 min)
1. **Website** `/` → Book eye test → `/contact` form submit
2. **Login (owner)** → Home: hero, workshop board, charts, store switcher (All / EF1)
3. **F2 New Sale**: type "pandey" → existing customer + history → Last Rx / New eye test → scan/search "RB5154", "Crizal" → 50% advance → WhatsApp toggle → Save & Print
4. **Bill page**: In Lab → Ready → Collect & deliver · WhatsApp → payment reminder · Job card print
5. **Ctrl K** search · **Customers** profile (Rx history) · **Stock** (per store, + Stock)
6. **More** → Enquiries (website booking shows here) · Marketing (segments, template, CSV)
7. **Mobile**: show on phone (bottom tabs, New Sale)

**One-liners:** 3 stores live in one place · owner sees everything on phone · bill + eye test on one screen · WhatsApp alerts · website bookings land in the panel

---

## Pricing

**They pay today:** ₹12,000 software + ₹7,000 WhatsApp = **₹19,000/yr** (desktop, single PC)

### Option A: with website + domain + VPS (recommended)
| Item | Paid to | Cost |
|---|---|---|
| Domain | GoDaddy / Hostinger | ~₹800/yr |
| VPS (app + DB) | Hostinger / DigitalOcean | ~₹6,500/yr (₹500–550/mo) |
| SSL + daily backup to Drive | free | ₹0 |
| WhatsApp (Meta, per msg) | Meta directly | ~₹2,000/yr (bills/alerts ~₹0.13 each) |
| **Running cost (client's own accounts)** | | **≈ ₹9,300/yr** |
| Our one-time (software + website + setup + data import + training) | us | **₹22,500** |
| Our AMC (updates, fixes, backups, support, 2 visits) | us | **₹500/mo = ₹6,000/yr** |

- Year 1 ≈ **₹37,800** · Year 2 onwards ≈ **₹15,300/yr** (less than today's ₹19k)

### Option B: no website, no domain, no VPS (free tier, slower)
| Item | Cost |
|---|---|
| Hosting: Vercel free (`xyz.vercel.app`) | ₹0 |
| DB: MongoDB Atlas free (512 MB, Mumbai) | ₹0 |
| Daily backup to Drive | ₹0 |
| WhatsApp (Meta, per msg) | ~₹2,000/yr |
| **Running cost** | **≈ ₹2,000/yr** |
| Our one-time (software + setup + data import + training) | **₹18,000** |
| Our AMC | **₹500/mo = ₹6,000/yr** |

- Year 1 ≈ **₹26,000** · Year 2 onwards ≈ **₹8,000/yr**
- Say clearly: first load can be a bit slow · free plans have limits (Vercel free = non-commercial) · can move to VPS anytime, same software

### Always mention
- Domain, server, WhatsApp accounts are **in client's name**, billed to their card
- Meta business verification: **client does it** (GST/business proof + a fresh number). Templates & setup: **we do it**
- Data belongs to client · software licensed (code stays ours)
- New big features = separate quote · 30-day parallel trial with old software
