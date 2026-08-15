

function selectOrders(state) {
  return state.orders?.list ?? [];
}

// ── Buy vs Sell split (by count and by ₹ value) ───────────────────────────
export function selectBuySellSplit(state) {
  const orders = selectOrders(state);

  const result = orders.reduce(
    (acc, o) => {
      const qty = Number(o.qty) || 0;
      const price = Number(o.price) || 0;
      const value = qty * price;

      if (o.mode === "BUY") {
        acc.buyCount += 1;
        acc.buyValue += value;
      } else if (o.mode === "SELL") {
        acc.sellCount += 1;
        acc.sellValue += value;
      }
      return acc;
    },
    { buyCount: 0, sellCount: 0, buyValue: 0, sellValue: 0 },
  );

  return result;
}

// ── Daily order volume (last N days, by count and ₹ value) ────────────────
export function selectDailyOrderVolume(state, days = 14) {
  const orders = selectOrders(state);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.push({
      date: d,
      key: d.toISOString().slice(0, 10),
      buyCount: 0,
      sellCount: 0,
      value: 0,
    });
  }
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));

  orders.forEach((o) => {
    const key = new Date(o.timestamp).toISOString().slice(0, 10);
    const bucket = byKey[key];
    if (!bucket) return; // outside the window
    const qty = Number(o.qty) || 0;
    const price = Number(o.price) || 0;
    bucket.value += qty * price;
    if (o.mode === "BUY") bucket.buyCount += 1;
    else if (o.mode === "SELL") bucket.sellCount += 1;
  });

  return buckets;
}

// ── Average order size (₹) ─────────────────────────────────────────────────
export function selectAverageOrderValue(state) {
  const orders = selectOrders(state);
  if (orders.length === 0) return 0;
  const total = orders.reduce((sum, o) => sum + (Number(o.qty) || 0) * (Number(o.price) || 0), 0);
  return total / orders.length;
}

// ── Order size distribution ────────────────────────────────────────────────
// Buckets built from the actual data's own range (min/max order value)
// rather than fixed ₹ thresholds - a ₹500 order and a ₹5,00,000 order need
// completely different bucket sizes to produce a readable histogram, and
// hardcoding thresholds would silently misrepresent either a beginner
// account or a large one.
export function selectOrderSizeDistribution(state, bucketCount = 5) {
  const orders = selectOrders(state);
  if (orders.length === 0) return [];

  const values = orders.map((o) => (Number(o.qty) || 0) * (Number(o.price) || 0));
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return [{ label: formatBucketLabel(min, max), count: values.length, min, max }];
  }

  const bucketSize = (max - min) / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const bucketMin = min + i * bucketSize;
    const bucketMax = i === bucketCount - 1 ? max : bucketMin + bucketSize;
    return { label: formatBucketLabel(bucketMin, bucketMax), count: 0, min: bucketMin, max: bucketMax };
  });

  values.forEach((v) => {
    const index = Math.min(Math.floor((v - min) / bucketSize), bucketCount - 1);
    buckets[index].count += 1;
  });

  return buckets;
}

function formatBucketLabel(min, max) {
  const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : Math.round(n));
  return `₹${fmt(min)}–${fmt(max)}`;
}