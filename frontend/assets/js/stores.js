import {qs} from './utils/dom.js';
import {formatMoney, convert} from './utils/pricing.js';

function sampleStores(){
  return [
    {id:1, name:'Alpha', products:[{id:1,title:'T-shirt', baseUSD:20, saleUSD:15},{id:2,title:'Jeans', baseUSD:60,saleUSD:null}]},
    {id:2, name:'Beta', products:[{id:3,title:'Sneakers', baseUSD:120, saleUSD:null},{id:4,title:'Sandals', baseUSD:35,saleUSD:29}]},
    {id:3, name:'Gamma', products:[{id:5,title:'Headphones', baseUSD:80, saleUSD:70}]}];
}

function storeSlide(s){
  const currency = localStorage.getItem('currency')||'USD';
  const prods = s.products.map(p=>{
    const old = convert(p.saleUSD!=null ? p.baseUSD : p.baseUSD, currency);
    const current = convert(p.saleUSD!=null ? p.saleUSD : p.baseUSD, currency);
    const oldHtml = current<old? `<span class="price-old">${formatMoney(old,currency)}</span>`: '';
    return `<div class="box">${p.title}<div>${oldHtml}<span class="price">${formatMoney(current,currency)}</span></div></div>`;
  }).join('');
  return `<section class="box">
    <div class="section-head"><h3>${s.name}</h3><a href="products.html?store=${s.id}" class="link">View all</a></div>
    <div class="carousel">${prods}</div>
  </section>`;
}

document.addEventListener('DOMContentLoaded', ()=>{
  const slider = qs('#store-slider');
  const stores = sampleStores();
  slider.innerHTML = stores.map(storeSlide).join('');
});
