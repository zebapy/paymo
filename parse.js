// Turns OCR text from a receipt screenshot into items and extras (tax, fees, tip).
// Works for DoorDash-style receipts ("1x Item" then "$price") and plain "Item ... 12.99" lines.
(function (root) {
  const PRICE = /(-?)\$?\s?(\d{1,4}\.\d{2})(?!\d)/g;
  const QTY_LINE = /(\d{1,2})\s*[x×]\s+([A-Za-z].*)$/;
  const SUBTOTAL = /\bsub\s?total\b/i;
  const TOTAL = /^\W*\w{0,2}\W*total\b/i;
  const EXTRA = /\b(tax|tip|gratuity|fee|fees|surcharge|service|delivery|bag)\b/i;
  const DISCOUNT = /\b(discount|promo|promotion|savings|credit|coupon)\b/i;

  function lastPrice(line) {
    const found = [...line.matchAll(PRICE)];
    if (!found.length) return null;
    const [, neg, num] = found[found.length - 1];
    return Math.round(parseFloat(num) * 100) * (neg ? -1 : 1);
  }

  function cleanName(text) {
    return text
      .replace(PRICE, "")
      .replace(/[^A-Za-z0-9&'()\-/ ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^(\W|\b[a-z]{1,2}\b\s)+/, "")
      .replace(/[\s-]+$/, "")
      .trim();
  }

  // Split a line total for "2x Fries $13.18" into 2 items whose cents add back up.
  function expand(name, qty, cents) {
    const each = Math.floor(cents / qty);
    return Array.from({ length: qty }, (_, k) => ({ name, cents: each + (k < cents - each * qty ? 1 : 0) }));
  }

  function parseReceipt(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const items = [];
    const extras = [];
    let subtotal = null;
    let total = null;
    let pending = null;
    const hasQtyLines = lines.some(l => QTY_LINE.test(l));

    for (const line of lines) {
      const price = lastPrice(line);
      if (SUBTOTAL.test(line)) { subtotal = price; continue; }
      if (TOTAL.test(line)) { total = price; break; }
      if (price !== null && (EXTRA.test(line) || DISCOUNT.test(line))) {
        const cents = DISCOUNT.test(line) ? -Math.abs(price) : price;
        if (cents !== 0) extras.push({ name: cleanName(line.split("$")[0]) || "Fee", cents });
        continue;
      }
      const q = line.match(QTY_LINE);
      if (q) {
        pending = { qty: parseInt(q[1], 10), name: cleanName(q[2]) };
        if (price !== null) { items.push(...expand(pending.name, pending.qty, price)); pending = null; }
        continue;
      }
      if (price === null) continue;
      if (pending) {
        items.push(...expand(pending.name, pending.qty, price));
        pending = null;
      } else if (!hasQtyLines) {
        const name = cleanName(line);
        if (name.length > 1) items.push({ name, cents: price });
      }
    }
    return { items, extras, subtotal, total };
  }

  root.parseReceipt = parseReceipt;
  if (typeof module !== "undefined") module.exports = { parseReceipt };
})(typeof window !== "undefined" ? window : globalThis);
