// Prefer global config when present; fallback preserved
const FALLBACK_BASE = "http://116.203.51.133/luxmart";
const API_ROOT =
  window.APP_CONFIG && window.APP_CONFIG.apiBase
    ? window.APP_CONFIG.apiBase.replace(/\/$/, "")
    : `${FALLBACK_BASE.replace(/\/$/, "")}/api`;
window.currency = (function () {
  let cur = localStorage.getItem("currency") || "USD";
  let rates = { AZN: 1.7, EUR: 0.85, TRY: 33.0 };
  let shipping = 0;

  async function fetchConfig() {
    try {
      // const r1 = await fetch(`${API_ROOT}/config/rates`);
      rates = await r1.json();
      const r2 = await fetch(`${API_ROOT}/config/shipping`);
      const js = await r2.json();
      shipping = js.shippingCost;
      localStorage.setItem("exchangeRates", JSON.stringify(rates));
      localStorage.setItem("shippingCost", String(shipping));
      if (window.onCurrencyChange) window.onCurrencyChange();
    } catch (e) {
      // fallback to cached
      const rs = localStorage.getItem("exchangeRates");
      if (rs) rates = JSON.parse(rs);
      const sc = localStorage.getItem("shippingCost");
      if (sc) shipping = Number(sc);
    }
  }
  fetchConfig();

  function setCurrency(c) {
    cur = c;
    localStorage.setItem("currency", c);
    if (window.onCurrencyChange) window.onCurrencyChange();
  }
  function getCurrency() {
    return cur;
  }
  function setRates(r) {
    rates = r;
    localStorage.setItem("exchangeRates", JSON.stringify(r));
    if (window.onCurrencyChange) window.onCurrencyChange();
  }
  function getRates() {
    return rates;
  }
  function setShipping(cost) {
    shipping = Number(cost) || 0;
    localStorage.setItem("shippingCost", String(shipping));
    if (window.onCurrencyChange) window.onCurrencyChange();
  }
  function getShipping() {
    return shipping;
  }
  function symbol(c = cur) {
    return c === "USD" ? "$" : c === "AZN" ? "₼" : c === "EUR" ? "€" : "₺";
  }
  function convertUSD(amountUSD, to = cur) {
    if (to === "USD") return amountUSD;
    const rate = rates[to];
    return amountUSD * (rate || 1);
  }

  return {
    setCurrency,
    getCurrency,
    setRates,
    getRates,
    symbol,
    convertUSD,
    setShipping,
    getShipping,
  };
})();
