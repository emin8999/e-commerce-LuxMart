import {qs} from './utils/dom.js';
import {formatMoney, convert} from './utils/pricing.js';
import {updateCartBadge} from './app.js';

function sampleProducts(){
  return [
    {id:1, title:'T-shirt', store:'Alpha', baseUSD:20, saleUSD:15, discountPercent:0, category:'Clothing > Men’s Clothing'},
    {id:2, title:'Sneakers', store:'Beta', baseUSD:120, saleUSD:null, discountPercent:10, category:'Footwear > Sports Shoes'},
    {id:3, title:'Headphones', store:'Gamma', baseUSD:80, saleUSD:70, discountPercent:5, category:'Electronics > Audio Equipment'},
  ];
}

function renderList(){
  const currency = localStorage.getItem('currency')||'USD';
  const list = qs('#product-list');
  const items = sampleProducts();
  list.innerHTML = items.map(p=>{
    const oldUSD = p.saleUSD!=null ? p.baseUSD : p.baseUSD;
    let currentUSD = p.saleUSD!=null ? p.saleUSD : p.baseUSD;
    if (p.discountPercent) currentUSD = currentUSD*(1 - p.discountPercent/100);
    const old = convert(oldUSD, currency);
    const price = convert(currentUSD, currency);
    const oldHtml = price<old? `<span class="price-old">${formatMoney(old,currency)}</span>`: '';
    return `<article class="box">
      <div class="muted">${p.store}</div>
      <h4>${p.title}</h4>
      <div>${oldHtml}<span class="price">${formatMoney(price,currency)}</span></div>
      <button class="btn" data-id="${p.id}">Add to Cart</button>
    </article>`;
  }).join('');
  list.addEventListener('click', e=>{
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const cart = JSON.parse(localStorage.getItem('cart')||'{"items":[]}');
    const idx = cart.items.findIndex(it=>it.productId===id);
    if (idx>=0) cart.items[idx].qty += 1; else cart.items.push({productId:id, variantId:null, qty:1});
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  fetch('assets/js/data/categories.json').then(r=>r.json()).then(data=>{
    const sel = document.getElementById('filter-category');
    const flat = [];
    Object.entries(data).forEach(([k,v])=>v.forEach(s=>flat.push(`${k} > ${s}`)));
    sel.innerHTML = '<option value="">All</option>' + flat.map(x=>`<option>${x}</option>`).join('');
  });
  renderList();
});
