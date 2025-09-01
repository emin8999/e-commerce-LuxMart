// Simple client-side preview of pricing. Authoritative pricing lives on backend.
export const ExchangeRates = {
  USD: 1,
  AZN: 1.7,
  EUR: 0.92,
  TRY: 33.0
};

export function setRate(curr, val){
  ExchangeRates[curr] = val;
}

export function convert(amountUSD, to="USD"){
  const rate = ExchangeRates[to] || 1;
  return amountUSD * rate;
}

// pipeline: base -> (sale?) -> discount rules -> (coupon at cart/checkout)
export function computePriceUSD({baseUSD, saleUSD=null, discountPercent=0, discountFixedUSD=0}){
  let oldUSD = baseUSD;
  let currentUSD = saleUSD!=null ? saleUSD : baseUSD;
  // discount rules
  if (discountPercent>0){
    currentUSD = currentUSD * (1 - discountPercent/100);
  }
  if (discountFixedUSD>0){
    currentUSD = Math.max(0, currentUSD - discountFixedUSD);
  }
  return { oldUSD, currentUSD };
}

export function formatMoney(val, currency="USD"){
  const sym = currency==="USD"?"$":currency==="AZN"?"₼":currency==="EUR"?"€":"₺";
  return sym + (Math.round(val*100)/100).toFixed(2);
}
