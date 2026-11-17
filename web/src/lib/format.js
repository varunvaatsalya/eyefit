import { format, formatDistanceToNowStrict } from "date-fns";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const inr0 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("en-IN");

export const formatINR = (n, { decimals = true } = {}) => (decimals ? inr : inr0).format(Number(n) || 0);
export const formatNumber = (n) => num.format(Number(n) || 0);

export function formatDate(d, pattern = "dd MMM yyyy") {
  if (!d) return "—";
  return format(new Date(d), pattern);
}

export function formatDateTime(d) {
  return formatDate(d, "dd MMM yyyy, hh:mm a");
}

export function timeAgo(d) {
  if (!d) return "—";
  return `${formatDistanceToNowStrict(new Date(d))} ago`;
}

export function initials(name = "") {
  return name
    .replace(/^(mr|mrs|ms|md|dr)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

// Normalise power values: "1.5" -> "+1.50", "-.5" -> "-0.50". Leaves non-numbers (e.g. "PL") untouched.
export function normalizePower(v) {
  if (v === undefined || v === null) return "";
  const s = String(v).trim();
  if (!s) return "";
  if (/^(pl|plano)$/i.test(s)) return "PL";
  const n = Number(s);
  if (Number.isNaN(n)) return s;
  const rounded = Math.round(n * 4) / 4;
  if (rounded === 0) return "0.00";
  return rounded > 0 ? `+${rounded.toFixed(2)}` : rounded.toFixed(2);
}

// Plain JSON-safe copy (ObjectId/Date -> string) for passing to client components.
export function toPlain(doc) {
  return JSON.parse(JSON.stringify(doc));
}
