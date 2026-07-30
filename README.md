# SPT Bullion — Live Gold Rate (Next.js, .jsx + CSS Modules)

Modern black/gold luxury live gold-rate page: animated hero price, refresh
progress line, per-karat cards (24K/22K/21K/18K) with live buy/sell flashes,
and a tola-rate panel.

## Files

```
app/
  layout.jsx
  globals.css
  gold-rate/
    page.jsx                        # route: /gold-rate
  components/
    LiveGoldRate.jsx                # client component, polls the API
    LiveGoldRate.module.css         # design system + animations
  api/
    gold-rate/
      route.js                      # server route, fetches live spot price
lib/
  gold-price.js                     # provider adapter + karat/tola math
jsconfig.json                       # enables the "@/..." import alias
```

## Setup

1. Drop these files into an existing Next.js (App Router) project, or
   scaffold one: `npx create-next-app@latest --js`.
2. Get an API key from a gold price provider. The adapter is written for
   [GoldAPI.io](https://www.goldapi.io) (free tier available) — its
   response is a plain per-ounce spot price, which `lib/gold-price.js`
   converts into gram/tola/karat/buy/sell figures.
3. Add the key to `.env.local`:

   ```
   GOLD_API_KEY=your_key_here
   ```

   Without a key, the app falls back to a mock feed with gentle jitter so
   the UI still animates during development.
4. Run it: `npm run dev`, then visit `/gold-rate`.

## Swapping providers

`lib/gold-price.js` only needs `fetchFromProvider()` to return
`{ price, ch, chp, timestamp }` (price per troy ounce, its change, percent
change, and a timestamp). Point it at metals-api.com, metalpriceapi.com, or
your own supplier feed — the karat/tola/buy-sell math downstream doesn't
change.

## Tuning

- **Dealer spread** — `SPREAD.buy` / `SPREAD.sell` in `lib/gold-price.js`
  (currently 1.5% each side).
- **Refresh rate** — `REFRESH_MS` in `LiveGoldRate.jsx` (currently 20s);
  keep the CSS `animation: fill 20s …` in `LiveGoldRate.module.css` in
  sync with it.
- **Palette** — the CSS custom properties at the top of
  `LiveGoldRate.module.css` (`--gold`, `--wine`, `--emerald`, etc.).
