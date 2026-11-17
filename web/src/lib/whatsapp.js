// WhatsApp messaging helpers.
// Today: opens WhatsApp (web/app) with the message pre-filled via a wa.me link. Staff press Send.
// Planned: automatic sending through the WhatsApp Business API (templates + PDF bill attachment).

import { formatDate, formatINR } from "./format";

export function waLink(mobile, text) {
  const digits = String(mobile || "").replace(/\D/g, "").slice(-10);
  return `https://wa.me/91${digits}?text=${encodeURIComponent(text)}`;
}

const firstName = (name = "") =>
  name.replace(/^(mr|mrs|ms|md|dr)\.?\s+/i, "").split(/\s+/)[0].replace(/^./, (c) => c.toUpperCase()).replace(/\B\w+/, (w) => w.toLowerCase());

export function billMessage(inv, storeName) {
  const lines = inv.items.map((i) => `• ${i.name}${i.qty > 1 ? ` × ${i.qty}` : ""}: ${formatINR(i.total, { decimals: false })}`);
  return [
    `Hi ${firstName(inv.customerSnapshot?.name)}, thank you for shopping at *${storeName}*! 🙏`,
    ``,
    `*Bill ${inv.invoiceNo}* · ${formatDate(inv.date)}`,
    ...lines,
    ``,
    `*Total: ${formatINR(inv.grandTotal, { decimals: false })}*`,
    `Paid: ${formatINR(inv.paidTotal, { decimals: false })}${inv.balance > 0 ? ` · Balance: ${formatINR(inv.balance, { decimals: false })}` : ""}`,
    inv.deliveryStatus !== "delivered" && inv.deliveryDate ? `Delivery: ${formatDate(inv.deliveryDate, "EEE, dd MMM")}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

export function reminderMessage(inv, storeName) {
  return [
    `Hi ${firstName(inv.customerSnapshot?.name)}, a gentle reminder from *${storeName}*.`,
    ``,
    `Balance of *${formatINR(inv.balance, { decimals: false })}* is pending on bill ${inv.invoiceNo} (${formatDate(inv.date)}).`,
    `You can pay by UPI or at the store. Thank you! 🙏`,
  ].join("\n");
}

export function readyMessage(inv, storeName) {
  return [
    `Hi ${firstName(inv.customerSnapshot?.name)}, good news! 👓`,
    `Your order *${inv.invoiceNo}* is ready for pickup at *${storeName}*.`,
    inv.balance > 0 ? `Balance to pay at pickup: ${formatINR(inv.balance, { decimals: false })}` : null,
    `See you soon!`,
  ]
    .filter(Boolean)
    .join("\n");
}

export const CAMPAIGN_TEMPLATES = [
  {
    id: "festival",
    label: "Festival offer",
    text: "Hi {name}! 🎉 This festive season get *flat 20% off* on all frames and sunglasses at *{store}*. Valid till Sunday. Visit us today!",
  },
  {
    id: "eyetest",
    label: "Eye test reminder",
    text: "Hi {name}, it has been a year since your last eye test at *{store}*. Regular check-ups keep your vision sharp. 👁️ Book a free eye test: just reply to this message.",
  },
  {
    id: "collection",
    label: "New collection",
    text: "Hi {name}! ✨ New arrivals at *{store}*: Ray-Ban, Vogue & Carrera frames for the new season. Drop by to try them on!",
  },
  {
    id: "birthday",
    label: "Birthday wish",
    text: "Happy Birthday {name}! 🎂 Wishing you a wonderful year ahead. Enjoy a special *15% birthday discount* at *{store}* this month.",
  },
];

export function fillTemplate(text, { name, store }) {
  return text.replaceAll("{name}", name || "there").replaceAll("{store}", store || "EyeFit");
}
