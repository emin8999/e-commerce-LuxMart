import {qs} from './utils/dom.js';
import {formatMoney, convert} from './utils/pricing.js';
import {updateCartBadge} from './app.js';

function sampleProducts(){
  return [
    {id:1, title:'T-shirt', store:'Alpha', baseUSD:20, saleUSD:15, discountPercent:0},
    {id:2, title:'Sneakers', store:'Beta', baseUSD:120, saleUSD:null, discountPercent:10},
    {id:3, title:'Headphones', store:'Gamma', baseUSD:80, saleUSD:70, discountPercent:5},
    {id:4, title:'Lipstick', store:'Beauty', baseUSD:15, saleUSD:null, discountPercent:0},
    {id:5, title:'Backpack', store:'Travel', baseUSD:55, saleUSD:45, discountPercent:0},
  ];
}

function card(p){
  const currency = localStorage.getItem('currency')||'USD';
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
}

function renderRow(elId){
  const el = qs(elId);
  if (!el) return;
  const items = sampleProducts();
  el.innerHTML = items.map(card).join('');
  el.addEventListener('click', e=>{
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
  renderRow('#sale-row');
  renderRow('#best-row');
  renderRow('#fbt-row');
  // categories grid
  fetch('assets/js/data/categories.json').then(r=>r.json()).then(data=>{
    const grid = document.getElementById('category-grid');
    grid.innerHTML = Object.keys(data).slice(0,12).map(k=>`<div class="box">${k}</div>`).join('');
  });
});
