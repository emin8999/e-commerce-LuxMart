import {qs, qsa} from './utils/dom.js';
import {ExchangeRates, convert, formatMoney} from './utils/pricing.js';

async function loadHeader(){
  const mount = qs('#app-header');
  const resp = await fetch('partials/header.html');
  mount.innerHTML = await resp.text();
  bindHeader();
  await loadI18n();
  renderCategoryTree();
  updateCartBadge();
}

function bindHeader(){
  const burger = qs('#burger');
  const drawer = qs('#drawer');
  const drawerClose = qs('#close-drawer');
  burger?.addEventListener('click', ()=>{ drawer.classList.remove('hidden'); setTimeout(()=>drawer.classList.add('open')) });
  drawerClose?.addEventListener('click', ()=>{ drawer.classList.remove('open'); setTimeout(()=>drawer.classList.add('hidden'),300) });

  const openCat = qs('#open-category');
  const openCat2 = qs('#open-category-drawer');
  const modal = qs('#category-modal');
  const closeModal = qs('#close-modal');
  const open = ()=>{ modal.classList.remove('hidden'); };
  const close = ()=>{ modal.classList.add('hidden'); };
  openCat?.addEventListener('click', open);
  openCat2?.addEventListener('click', open);
  closeModal?.addEventListener('click', close);

  const lang = qs('#lang-switch');
  const curr = qs('#currency-switch');
  lang?.addEventListener('change', (e)=>{
    localStorage.setItem('locale', e.target.value);
    location.reload();
  });
  curr?.addEventListener('change', (e)=>{
    localStorage.setItem('currency', e.target.value);
    document.dispatchEvent(new CustomEvent('currency:changed', {detail: e.target.value}));
  });
}

async function loadI18n(){
  const locale = localStorage.getItem('locale') || 'en';
  const resp = await fetch(`assets/js/i18n/${locale}.json`);
  const dict = await resp.json();
  qsa('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
}

async function renderCategoryTree(){
  const resp = await fetch('assets/js/data/categories.json');
  const data = await resp.json();
  const tree = qs('#category-tree');
  if (!tree) return;
  const createGroup = (name, list)=>{
    const d = document.createElement('div');
    d.className='box';
    const h = document.createElement('h4'); h.textContent = name;
    d.appendChild(h);
    const ul = document.createElement('ul');
    list.forEach(x=>{ const li = document.createElement('li'); li.textContent = x; ul.appendChild(li) });
    d.appendChild(ul);
    return d;
  };
  Object.entries(data).forEach(([parent, children])=>{
    tree.appendChild(createGroup(parent, children));
  });
}

export function updateCartBadge(){
  const badge = qs('#cart-badge');
  if (!badge) return;
  const cart = JSON.parse(localStorage.getItem('cart')||'{"items":[]}');
  const count = cart.items.reduce((sum,it)=>sum+it.qty,0);
  if (count>0){ badge.textContent = count>99? '99+': String(count); badge.classList.remove('hidden'); }
  else badge.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', loadHeader);
