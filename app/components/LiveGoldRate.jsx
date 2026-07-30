"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./LiveGoldRate.module.css";

const KARATS = ["24k", "22k", "21k", "18k"];
const REFRESH_MS = 20000;
const CURRENCIES = ["AED", "USD"];
const UNITS = ["gram", "oz"];
const TROY_OUNCE_IN_GRAMS = 31.1034768;

function formatMoney(value, currency) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// gramTable is always priced per gram from the API; convert on display only
// so the underlying flash/diff logic (which compares gram values) is unaffected.
function convert(gramValue, unit) {
  if (gramValue == null) return null;
  return unit === "oz" ? gramValue * TROY_OUNCE_IN_GRAMS : gramValue;
}

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function LiveGoldRate() {
  const [currency, setCurrency] = useState("AED");
  const [unit, setUnit] = useState("gram");
  const [rate, setRate] = useState(null);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [flashes, setFlashes] = useState({}); // { "24k": "up" | "down" }

  const prevGramRef = useRef({});
  const flashTimers = useRef({});
  const pollTimer = useRef(null);

  const load = useCallback(async (cur) => {
    try {
      const res = await fetch(`/api/gold-rate?currency=${cur}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("bad-response");
      const data = await res.json();

      const prevGram = prevGramRef.current;
      const nextFlashes = {};
      KARATS.forEach((k) => {
        const prevVal = prevGram[k];
        const nextVal = data.gram?.[k];
        if (prevVal != null && nextVal != null && nextVal !== prevVal) {
          nextFlashes[k] = nextVal > prevVal ? "up" : "down";
        }
      });

      if (Object.keys(nextFlashes).length) {
        setFlashes((f) => ({ ...f, ...nextFlashes }));
        Object.keys(nextFlashes).forEach((k) => {
          clearTimeout(flashTimers.current[k]);
          flashTimers.current[k] = setTimeout(() => {
            setFlashes((f) => {
              const copy = { ...f };
              delete copy[k];
              return copy;
            });
          }, 1100);
        });
      }

      prevGramRef.current = data.gram ?? {};
      setRate(data);
      setError(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError("Live feed unavailable — retrying shortly.");
    }
  }, []);

  useEffect(() => {
    prevGramRef.current = {};
    load(currency);
    pollTimer.current = setInterval(() => load(currency), REFRESH_MS);
    return () => clearInterval(pollTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  useEffect(() => {
    return () => {
      Object.values(flashTimers.current).forEach(clearTimeout);
    };
  }, []);

  const isUp = rate?.changeAmount >= 0;

  return (
    <section className={styles.wrap}>
      <div className={styles.backdrop} aria-hidden="true" />

      <header className={styles.topBar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>SPT</span>
          <span className={styles.brandWord}>BULLION</span>
        </div>

        <div className={styles.topBarRight}>
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            LIVE
          </div>
          <div className={styles.currencyToggle}>
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`${styles.currencyBtn} ${
                  currency === c ? styles.currencyBtnActive : ""
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className={styles.currencyToggle}>
            {UNITS.map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`${styles.currencyBtn} ${
                  unit === u ? styles.currencyBtnActive : ""
                }`}
              >
                {u === "gram" ? "Gram" : "Oz"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className={styles.hero}>
        <p className={styles.eyebrow}>
          24K Gold · Per {unit === "gram" ? "Gram" : "Troy Oz"} · {currency}
        </p>

        <h1 className={styles.heroPrice}>
          {rate
            ? formatMoney(convert(rate.gram?.["24k"], unit), currency)
            : "Loading…"}
        </h1>

        <div className={styles.changeRow}>
          <span
            className={`${styles.changeChip} ${
              isUp ? styles.changeUp : styles.changeDown
            }`}
          >
            <span className={styles.changeArrow}>{isUp ? "▲" : "▼"}</span>
            {rate ? Math.abs(rate.changePercent).toFixed(2) : "0.00"}%
          </span>
          <span className={styles.updatedAt}>
            Updated {rate ? formatTime(rate.asOf) : "—"}
          </span>
        </div>

        <div key={refreshKey} className={styles.progressTrack}>
          <div className={styles.progressFill} />
        </div>

        {error && <p className={styles.errorText}>{error}</p>}
      </div>

      <div className={styles.cardGrid}>
        {KARATS.map((k, i) => (
          <div
            key={k}
            className={`${styles.card} ${
              flashes[k] === "up"
                ? styles.flashUp
                : flashes[k] === "down"
                ? styles.flashDown
                : ""
            }`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={styles.cardHeader}>
              <span className={styles.cardKarat}>{k.toUpperCase()}</span>
              <span className={styles.cardPurity}>
                {k === "24k" && "999.9"}
                {k === "22k" && "916"}
                {k === "21k" && "875"}
                {k === "18k" && "750"}
              </span>
            </div>

            <div className={styles.cardPriceRow}>
              <span className={styles.cardGram}>
                {rate
                  ? formatMoney(convert(rate.gram?.[k], unit), currency)
                  : "—"}
              </span>
              <span className={styles.cardUnit}>
                / {unit === "gram" ? "gram" : "oz"}
              </span>
            </div>

            <div className={styles.cardBuySell}>
              <div className={styles.bsItem}>
                <span className={styles.bsLabel}>Buy</span>
                <span className={styles.bsValue}>
                  {rate
                    ? formatMoney(convert(rate.buyGram?.[k], unit), currency)
                    : "—"}
                </span>
              </div>
              <div className={styles.bsDivider} />
              <div className={styles.bsItem}>
                <span className={styles.bsLabel}>Sell</span>
                <span className={styles.bsValue}>
                  {rate
                    ? formatMoney(convert(rate.sellGram?.[k], unit), currency)
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.tolaPanel}>
        <div className={styles.tolaPanelHeader}>
          <h2 className={styles.tolaTitle}>Tola Rates</h2>
          <span className={styles.tolaSub}>1 Tola = 11.6638 g</span>
        </div>
        <div className={styles.tolaTable}>
          {KARATS.map((k) => (
            <div key={k} className={styles.tolaRow}>
              <span className={styles.tolaKarat}>{k.toUpperCase()}</span>
              <span className={styles.tolaValue}>
                {rate ? formatMoney(rate.tola?.[k], currency) : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <footer className={styles.footerStrip}>
        <span>
          Spot · {rate ? formatMoney(rate.spotPerOunce, currency) : "—"} / oz
        </span>
        <span className={styles.footerDot}>•</span>
        <span>Rates refresh every {REFRESH_MS / 1000}s</span>
        <span className={styles.footerDot}>•</span>
        <span>Indicative only, excludes making charges &amp; VAT</span>
      </footer>
    </section>
  );
}
