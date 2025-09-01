
// Unified pricing pipeline (Base -> Sale -> Rules -> Coupon)
// For demo: simple calculations in frontend; in production do it on backend.
window.pricing = (function(){
  function computePriceUSD(item, opts={ saleAllowed:true, ruleDiscountPct:0, couponPct:0 }){
    const base = Number(item.basePriceUSD||0);
    const sale = opts.saleAllowed && item.salePriceUSD ? Number(item.salePriceUSD) : null;
    let current = sale && sale < base ? sale : base;
    // Discount rules as percent on current
    if(opts.ruleDiscountPct){ current = current * (1 - opts.ruleDiscountPct/100); }
    // Coupon at checkout
    if(opts.couponPct){ current = current * (1 - opts.couponPct/100); }
    const old = (sale && sale < base) ? base : (opts.ruleDiscountPct || opts.couponPct ? base : null);
    return { currentUSD: current, oldUSD: old };
  }

  function format(amountUSD){
    const cur = window.currency.getCurrency();
    const sym = window.currency.symbol(cur);
    const converted = window.currency.convertUSD(amountUSD, cur);
    return `${sym}${converted.toFixed(2)}`;
  }

  function formatPair(price){
    if(!price) return '';
    const cur = window.currency.getCurrency();
    const sym = window.currency.symbol(cur);
    const current = window.currency.convertUSD(price.currentUSD, cur).toFixed(2);
    const old = price.oldUSD!=null ? window.currency.convertUSD(price.oldUSD, cur).toFixed(2) : null;
    return { current:`${sym}${current}`, old: old? `${sym}${old}`: null };
  }

  return { computePriceUSD, format, formatPair };
})();