// Store Page: renders a single store by ?storeId= and its products
(function(){
  const API_BASE = "http://116.203.51.133/luxmart";

  // ---- DOM helpers ----
  const $ = (sel, root=document) => root.querySelector(sel);

  // ---- URL param ----
  function getParam(name){
    const u = new URL(window.location.href);
    return u.searchParams.get(name);
  }

  // ---- Normalize media URL ----
  function normalizeImg(src){
    if(!src) return "";
    const s = String(src).trim();
    if (/^(https?:)?\/\//i.test(s) || /^data:/i.test(s)) return s;
    return `${API_BASE}/${s.replace(/^\/+/, "")}`;
  }

  // ---- Prices ----
  function priceUSD(p){
    const base = Number(p.basePriceUSD ?? 0);
    const sale = p.salePriceUSD != null ? Number(p.salePriceUSD) : null;
    const current = sale != null && sale >= 0 && sale < base ? sale : base;
    const old = sale != null && sale < base ? base : null;
    return {current, old};
  }
  const fmtUSD = (n)=> `$${Number(n).toFixed(2)}`;

  // ---- Data fetch ----
  async function fetchAllStores(){
    try{
      const res = await fetch(`${API_BASE}/store/all-stores`, {mode:'cors'});
      if(!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.data)? data.data : []);
    }catch{ return []; }
  }
  async function fetchAllProducts(){
    try{
      const res = await fetch(`${API_BASE}/api/products/all-products`, {mode:'cors'});
      if(!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (Array.isArray(data?.data)? data.data : []);
    }catch{ return []; }
  }

  // ---- Safe image from product ----
  function firstImage(p){
    const arr = Array.isArray(p.imageUrls)
      ? p.imageUrls
      : typeof p.imageUrls === 'string' ? [p.imageUrls] : [];
    return arr.length ? normalizeImg(arr[0]) : "";
  }

  // ---- Render store meta ----
  function renderStoreMeta(store){
    const title = $('#storeTitle');
    const nameEl = $('#storeName');
    const descEl = $('#storeDesc');
    const logoWrap = $('#storeLogoWrap');
    const contacts = $('#storeContacts');

    const name = store.storeName || store.name || store.shopName || `Store #${store.id}`;
    title.textContent = name;
    nameEl.textContent = name;
    descEl.textContent = store.storeDescription || '';

    logoWrap.innerHTML = '';
    if (store.logo){
      const img = document.createElement('img');
      img.src = normalizeImg(store.logo);
      img.alt = name;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'contain';
      logoWrap.appendChild(img);
    } else {
      logoWrap.textContent = '🏬';
    }

    const lines = [];
    if (store.location) lines.push(`📍 ${store.location}`);
    if (store.email) lines.push(`✉️ ${store.email}`);
    if (store.phone) lines.push(`📞 ${store.phone}`);
    if (store.category) lines.push(`🏷️ ${store.category}`);
    contacts.innerHTML = lines.map(t => `<div>${t}</div>`).join('');
  }

  // ---- Render products grid ----
  function renderGrid(list){
    const grid = $('#productsGrid');
    const empty = $('#gridEmpty');
    grid.innerHTML = '';

    if(!list.length){
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    list.forEach(p => {
      const pr = priceUSD(p);
      const img = firstImage(p);

      const card = document.createElement('div');
      card.className = 'card';

      const thumb = document.createElement('a');
      thumb.className = 'thumb';
      thumb.href = `./productView.html?id=${encodeURIComponent(p.id)}`;
      thumb.innerHTML = img ? `<img src="${img}" alt="${p.title||p.nameEn||''}">` : '🛍️';

      const body = document.createElement('div');
      body.className = 'card-body';

      const title = document.createElement('a');
      title.className = 'title visit';
      title.href = thumb.href;
      title.textContent = p.title ?? p.nameEn ?? `#${p.id}`;

      const priceDiv = document.createElement('div');
      priceDiv.className = 'price';
      priceDiv.innerHTML = `${fmtUSD(pr.current)} ${pr.old? `<span class="old">${fmtUSD(pr.old)}</span>`: ''}`;

      const actions = document.createElement('div');
      actions.className = 'card-actions';

      const visit = document.createElement('a');
      visit.className = 'visit';
      visit.href = thumb.href;
      visit.textContent = 'View';

      actions.appendChild(visit);
      body.appendChild(title);
      body.appendChild(priceDiv);
      body.appendChild(actions);

      card.appendChild(thumb);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  // ---- Sort handling (same options as products page) ----
  function sortList(list, mode){
    const out = list.slice();
    if (mode === 'priceAsc') out.sort((a,b)=> priceUSD(a).current - priceUSD(b).current);
    else if (mode === 'priceDesc') out.sort((a,b)=> priceUSD(b).current - priceUSD(a).current);
    else if (mode === 'titleAsc') out.sort((a,b)=> String(a.title||'').localeCompare(String(b.title||'')));
    else if (mode === 'titleDesc') out.sort((a,b)=> String(b.title||'').localeCompare(String(a.title||'')));
    return out;
  }

  // ---- Init ----
  document.addEventListener('DOMContentLoaded', async () => {
    const storeId = getParam('storeId');
    if (!storeId){
      $('#storeTitle').textContent = 'Store not found';
      $('#gridEmpty').hidden = false;
      return;
    }

    // Try to get store from localStorage first
    let store = null;
    try{
      const raw = localStorage.getItem('selectedStore');
      if (raw){
        const s = JSON.parse(raw);
        if (String(s?.id) === String(storeId)) store = s;
      }
    }catch{}

    if (!store){
      const stores = await fetchAllStores();
      store = stores.find(s => String(s.id) === String(storeId)) || null;
    }

    if (!store){
      $('#storeTitle').textContent = 'Store not found';
      $('#gridEmpty').hidden = false;
      return;
    }

    renderStoreMeta(store);

    const all = await fetchAllProducts();
    let list = all.filter(p => String(p.storeId ?? p.store_id ?? p.store?.id) === String(store.id));
    renderGrid(list);

    $('#sortSel')?.addEventListener('change', (e)=>{
      const mode = e.target.value;
      renderGrid(sortList(list, mode));
    });
  });
})();

