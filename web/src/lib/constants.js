export const CATEGORIES = [
  { value: "frame", label: "Frame", short: "Frame" },
  { value: "lens", label: "Lens", short: "Lens" },
  { value: "contact_lens", label: "Contact Lens", short: "CL" },
  { value: "sunglass", label: "Sunglasses", short: "Sunglass" },
  { value: "solution", label: "Solution", short: "Solution" },
  { value: "misc", label: "Miscellaneous", short: "Misc" },
];

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

export const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
];

export const PAYMENT_LABEL = Object.fromEntries(PAYMENT_MODES.map((p) => [p.value, p.label]));

export const DELIVERY_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_lab", label: "In Lab" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
];

export const DELIVERY_LABEL = Object.fromEntries(DELIVERY_STATUSES.map((d) => [d.value, d.label]));

export const RX_TYPES = [
  { value: "spectacle", label: "Spectacle" },
  { value: "contact", label: "Contact Lens" },
  { value: "sunglass", label: "Sunglasses" },
];

export const USAGE_OPTIONS = [
  { value: "constant", label: "Constant use" },
  { value: "near", label: "Near work" },
  { value: "distance", label: "Distance work" },
];

export const ROLE_LABEL = { owner: "Owner", manager: "Manager", staff: "Staff" };

function range(from, to, step) {
  const out = [];
  for (let v = from; v <= to + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

const signed = (n) => (n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2));

export const SPH_VALUES = range(-20, 20, 0.25).map(signed);
export const CYL_VALUES = range(-6, 6, 0.25).map(signed);
export const ADD_VALUES = range(0.75, 3.5, 0.25).map(signed);
export const VA_VALUES = ["6/6", "6/9", "6/12", "6/18", "6/24", "6/36", "6/60", "N5", "N6", "N8", "N10", "N12"];
