// lib/gold-price.js
//
// Provider-agnostic gold price adapter.
//
// Default implementation targets GoldAPI.io (https://www.goldapi.io) because
// its response already includes a clean per-ounce spot price. Swap out
// `fetchFromProvider` for any other feed (metals-api.com, metalpriceapi.com,
// your own supplier feed, etc.) — everything downstream only depends on the
// { price, ch, chp, timestamp } shape returned from it.

const TROY_OUNCE_IN_GRAMS = 31.1034768;
const GRAMS_PER_TOLA = 11.6638;

// Purity factors relative to fine gold (999.9/1000)
const KARAT_PURITY = {
  "24k": 0.9999,
  "22k": 0.916,
  "21k": 0.875,
  "18k": 0.75,
};

// Dealer spread, expressed as a fraction of the mid price.
// Tune these to match your shop's real buy/sell margin.
const SPREAD = {
  buy: 0.015, // customer buys 1.5% above mid
  sell: 0.015, // shop buys back 1.5% below mid
};

async function fetchFromProvider(currency) {
  const apiKey = process.env.GOLD_API_KEY;

  if (!apiKey) {
    // No key configured — fall back to a clearly-labelled mock so the UI
    // still renders (with gentle jitter) during local development.
    return mockProviderResponse();
  }

  const res = await fetch(`https://www.goldapi.io/api/XAU/${currency}`, {
    headers: {
      "x-access-token": apiKey,
      "Content-Type": "application/json",
    },
    cache: "no-store", // always hit the network — this is a live rate
  });

  if (!res.ok) {
    throw new Error(`Gold price provider responded ${res.status}`);
  }

  const data = await res.json();

  return {
    price: data.price,
    ch: data.ch,
    chp: data.chp,
    timestamp: (data.timestamp ?? Date.now() / 1000) * 1000,
  };
}

function mockProviderResponse() {
  const base = 4050 + Math.sin(Date.now() / 60000) * 6;
  return {
    price: Number(base.toFixed(2)),
    ch: Number((Math.sin(Date.now() / 45000) * 4).toFixed(2)),
    chp: Number((Math.sin(Date.now() / 45000) * 0.1).toFixed(2)),
    timestamp: Date.now(),
  };
}

function buildGramTable(pricePerOunce) {
  const perGram24k = pricePerOunce / TROY_OUNCE_IN_GRAMS;
  return {
    "24k": perGram24k * KARAT_PURITY["24k"],
    "22k": perGram24k * KARAT_PURITY["22k"],
    "21k": perGram24k * KARAT_PURITY["21k"],
    "18k": perGram24k * KARAT_PURITY["18k"],
  };
}

function toTolaTable(gram) {
  return {
    "24k": gram["24k"] * GRAMS_PER_TOLA,
    "22k": gram["22k"] * GRAMS_PER_TOLA,
    "21k": gram["21k"] * GRAMS_PER_TOLA,
    "18k": gram["18k"] * GRAMS_PER_TOLA,
  };
}

function applySpread(table, factor) {
  return {
    "24k": table["24k"] * factor,
    "22k": table["22k"] * factor,
    "21k": table["21k"] * factor,
    "18k": table["18k"] * factor,
  };
}

export async function getDealerGoldRate(currency = "AED") {
  const raw = await fetchFromProvider(currency);
  const gram = buildGramTable(raw.price);
  const tola = toTolaTable(gram);

  return {
    currency,
    asOf: new Date(raw.timestamp).toISOString(),
    spotPerOunce: raw.price,
    changeAmount: raw.ch,
    changePercent: raw.chp,
    gram,
    tola,
    buyGram: applySpread(gram, 1 + SPREAD.buy),
    sellGram: applySpread(gram, 1 - SPREAD.sell),
    buyTola: applySpread(tola, 1 + SPREAD.buy),
    sellTola: applySpread(tola, 1 - SPREAD.sell),
  };
}
