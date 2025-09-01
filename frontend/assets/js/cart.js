
window.cart = (function(){
  let data = JSON.parse(localStorage.getItem('cart') || '{"items":[]}');
  function save(){ localStorage.setItem('cart', JSON.stringify(data)); if(window.renderCartBadge) window.renderCartBadge(); }

  function add(item){ // item: {productId, variantId, storeId, title, size, basePriceUSD, salePriceUSD, qty}
    const key = item.variantId || item.productId;
    const found = data.items.find(it => (it.variantId||it.productId)===key);
    if(found){ found.qty += item.qty||1; } else { data.items.push({...item, qty:item.qty||1}); }
    save();
  }

  function remove(key){
    data.items = data.items.filter(it => (it.variantId||it.productId)!==key);
    save();
  }

  function setQty(key, qty){
    const it = data.items.find(i => (i.variantId||i.productId)===key);
    if(!it) return;
    it.qty = Math.max(1, qty);
    save();
  }

  function clear(){ data.items = []; save(); }
  function get(){ return data; }
  function getCount(){ return data.items.reduce((s,i)=>s+i.qty,0); }

  function totalsUSD(couponPct=0){
    const items = data.items.map(it => {
      const price = window.pricing.computePriceUSD(it, { couponPct });
      return { ...it, price, lineUSD: price.currentUSD * it.qty };
    });
    const subtotal = items.reduce((s,i)=> s + i.lineUSD, 0);
    const shipping = window.currency.getShipping();
    return { items, subtotalUSD: subtotal, shippingUSD: shipping, totalUSD: subtotal + shipping };
  }

  return { add, remove, setQty, clear, get, getCount, totalsUSD };
})();

// Renderers for cart and checkout (simple demo)
window.renderCartPage = function(){
  const root = document.getElementById('cartView'); if(!root) return;
  const cart = window.cart.get();
  root.innerHTML='';
  cart.items.forEach(it=>{
    const pricePair = window.pricing.formatPair(window.pricing.computePriceUSD(it, {}));
    const row = document.createElement('div');
    row.className='card';
    row.innerHTML = `
      <div><strong>${it.title}</strong> <span class="label">${it.size||''}</span></div>
      <div class="price">${pricePair.current} ${pricePair.old? `<span class="old">${pricePair.old}</span>`:''}</div>
      <div class="row-inline">
        <button class="btn" data-act="dec">−</button>
        <span style="padding:0 8px">${it.qty}</span>
        <button class="btn" data-act="inc">+</button>
        <button class="btn" data-act="del">Delete</button>
      </div>
    `;
    row.querySelector('[data-act="dec"]').onclick = ()=> window.cart.setQty(it.variantId||it.productId, it.qty-1);
    row.querySelector('[data-act="inc"]').onclick = ()=> window.cart.setQty(it.variantId||it.productId, it.qty+1);
    row.querySelector('[data-act="del"]').onclick = ()=> window.cart.remove(it.variantId||it.productId);
    root.appendChild(row);
  });
  window.renderCartBadge();
}

window.renderCheckout = function(){
  const couponInput = document.getElementById('couponInput');
  const summary = document.getElementById('summary');
  const shippingText = document.getElementById('shippingCostText');
  function paint(){
    const couponPct = (couponInput && couponInput.value==='SALE10') ? 10 : 0;
    const t = window.cart.totalsUSD(couponPct);
    const cur = window.currency.getCurrency();
    const sym = window.currency.symbol(cur);
    const subtotal = window.currency.convertUSD(t.subtotalUSD, cur).toFixed(2);
    const shipping = window.currency.convertUSD(t.shippingUSD, cur).toFixed(2);
    const total = window.currency.convertUSD(t.totalUSD, cur).toFixed(2);
    shippingText.textContent = `${sym}${shipping}`;
    summary.innerHTML = `
      <div>Subtotal: ${sym}${subtotal}</div>
      ${couponPct? `<div>Coupon (−${couponPct}%)</div>`:''}
      <div>Shipping: ${sym}${shipping}</div>
      <hr/>
      <div><strong>Total: ${sym}${total}</strong></div>
    `;
  }
  paint();
  document.getElementById('applyCoupon').onclick = paint;
  window.onCurrencyChange = paint;
}
