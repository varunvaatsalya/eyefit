// Shared billing math (used on client for live totals and on server for the final, trusted values).
// Model follows the client's existing software: discount on rate, then GST added on top.

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function calcLine(item) {
  const rate = Math.max(0, Number(item.rate) || 0);
  const qty = Math.max(0, Number(item.qty) || 0);
  const gross = rate * qty;
  const discountPct = Math.min(100, Math.max(0, Number(item.discountPct) || 0));
  const discountAmt = r2((gross * discountPct) / 100);
  const taxable = r2(gross - discountAmt);
  const gstPct = Math.max(0, Number(item.gstPct) || 0);
  const gstAmt = r2((taxable * gstPct) / 100);
  return { ...item, rate, qty, discountPct, discountAmt, taxable, gstPct, gstAmt, total: r2(taxable + gstAmt) };
}

export function calcTotals(items, extraDiscount = 0) {
  const lines = items.map(calcLine);
  const subTotal = r2(lines.reduce((s, l) => s + l.rate * l.qty, 0));
  const itemDiscount = r2(lines.reduce((s, l) => s + l.discountAmt, 0));
  const gstTotal = r2(lines.reduce((s, l) => s + l.gstAmt, 0));
  const beforeExtra = r2(lines.reduce((s, l) => s + l.total, 0));
  const extra = Math.min(beforeExtra, Math.max(0, Number(extraDiscount) || 0));
  const exact = r2(beforeExtra - extra);
  const grandTotal = Math.round(exact);
  const roundOff = r2(grandTotal - exact);
  const qty = lines.reduce((s, l) => s + l.qty, 0);
  return { lines, qty, subTotal, itemDiscount, gstTotal, extraDiscount: extra, roundOff, grandTotal };
}

export function sumPayments(payments) {
  return r2((payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0));
}
