// Prefer global APP_CONFIG.apiBase (already includes "/api")
const API_VIEW_BASE = "http://116.203.51.133/luxmart";
const API_ROOT =
  window.APP_CONFIG && window.APP_CONFIG.apiBase
    ? window.APP_CONFIG.apiBase.replace(/\/$/, "")
    : `${API_VIEW_BASE.replace(/\/$/, "")}/api`;

/* helpers */
function q(sel) {
  return document.querySelector(sel);
}
function formatCurrencyFromUSD(nUSD) {
  const cur = window.currency?.getCurrency?.() || 'USD';
  const sym = window.currency?.symbol?.(cur) || '$';
  const converted = window.currency?.convertUSD?.(Number(nUSD) || 0, cur) || Number(nUSD) || 0;
  return `${sym}${converted.toFixed(2)}`;
}
function computePriceUSD(p) {
  const base = Number(p.basePriceUSD ?? 0);
  const sale = p.salePriceUSD != null ? Number(p.salePriceUSD) : null;
  const hasSale = sale != null && isFinite(sale) && sale > 0 && sale < base;
  return { currentUSD: hasSale ? sale : base, oldUSD: hasSale ? base : null };
}
function renderPriceHTML(p) {
  const pair = computePriceUSD(p);
  const cur = formatCurrencyFromUSD(pair.currentUSD);
  const old = pair.oldUSD != null ? formatCurrencyFromUSD(pair.oldUSD) : null;
  return `<span class="price">${cur}</span>${old ? ` <span class=\"old\">${old}</span>` : ''}`;
}
function normalizeImg(src) {
  if (!src) return "";
  const s = String(src).trim();
  if (/^(https?:)?\/\//i.test(s) || /^data:/i.test(s)) return s;
  const rawBase = API_ROOT.replace(/\/?api\/?$/, "");
  return `${rawBase}/${s.replace(/^\/+/, "")}`;
}

/* cart helpers (use global cart.js if available) */
function addToGlobalCart(item) {
  if (window.cart && typeof window.cart.add === "function") {
    window.cart.add(item);
    if (typeof window.renderCartBadge === "function") window.renderCartBadge();
  } else {
    // ultra-fallback: minimal localStorage push
    const KEY = "cart";
    let data;
    try {
      data = JSON.parse(localStorage.getItem(KEY) || '{"items":[]}');
    } catch {
      data = { items: [] };
    }
    data.items.push(item);
    localStorage.setItem(KEY, JSON.stringify(data));
    const el = q("#cartBadge");
    if (el) el.textContent = String(data.items.reduce((s,i)=>s+(i.qty||1),0));
  }
}

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// Robust fetch by ID: use /api/products/public/{id}, then fallbacks
async function getProductById(id) {
  // 1) Primary: public-by-id endpoint
  try {
    const r = await fetch(
      `${API_ROOT}/products/public/${encodeURIComponent(id)}`
    );
    if (r.ok) return await r.json();
  } catch (_) {}

  // 2) Fallback: load public products and find locally
  try {
    const all = await getJSON(`${API_ROOT}/products/public`);
    const list = Array.isArray(all)
      ? all
      : Array.isArray(all?.content)
      ? all.content
      : [];
    const found = list.find((x) => String(x.id) === String(id));
    if (found) return found;
  } catch (_) {}

  // 3) Fallback: load all products and find locally
  const all2 = await getJSON(`${API_ROOT}/products/all-products`);
  const list2 = Array.isArray(all2)
    ? all2
    : Array.isArray(all2?.content)
    ? all2.content
    : [];
  const found2 = list2.find((x) => String(x.id) === String(id));
  if (!found2) throw new Error("Product not found");
  return found2;
}

document.addEventListener("DOMContentLoaded", async () => {
  try { if (typeof window.renderCartBadge === "function") window.renderCartBadge(); } catch(_){}

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (!id) {
    q("#productView").innerHTML = "<p>Product not found.</p>";
    return;
  }

  try {
    const p = await getProductById(id);

    // Build gallery
    const imgs = Array.isArray(p.imageUrls)
      ? p.imageUrls.map(normalizeImg)
      : [];
    const main = imgs[0] || "";
    const gallery = `
      <div class="gallery">
        <div class="gallery-main" id="gMain">${
          main ? `<img src="${main}" alt="${p.title}">` : "🛍️"
        }</div>
        <div class="gallery-thumbs" id="gThumbs">${imgs
          .map(
            (url, idx) =>
              `<div class="thumb ${
                idx === 0 ? "active" : ""
              }" data-src="${url}"><img src="${url}" alt=""></div>`
          )
          .join("")}
        </div>
      </div>`;

    // Pricing (currency-aware)
    const priceHTML = renderPriceHTML(p);

    // Variants (size + stockQuantity)
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const options = variants
      .map((v) => {
        const stock = Number(v.stockQuantity ?? v.stock ?? 0);
        const disabled = stock <= 0 ? "disabled" : "";
        const label = `${v.size ?? ""} — stock: ${stock}`;
        return `<option value="${v.id}" ${disabled}>${label}</option>`;
      })
      .join("");

    const info = `
      <div class="info">
        <h1>${p.title}</h1>
        <div class="priceRow" id="pvPriceRow">${priceHTML}</div>
        ${p.description ? `<p class="desc">${p.description}</p>` : ""}

        <div class="controls">
          ${
            variants.length
              ? `
            <div class="select">
              <label for="variantSel">Size</label>
              <select id="variantSel">${options}</select>
            </div>`
              : ""
          }

          <div class="actions">
            <button id="addToCart" class="btn btn-primary">Add to cart</button>
          </div>
        </div>
      </div>`;

    q("#productView").innerHTML = `
      <div class="product">
        ${gallery}
        ${info}
      </div>`;

    // Thumbs click
    const gMain = q("#gMain");
    qAll("#gThumbs .thumb").forEach((el) => {
      el.addEventListener("click", () => {
        qAll("#gThumbs .thumb").forEach((x) => x.classList.remove("active"));
        el.classList.add("active");
        const src = el.getAttribute("data-src");
        gMain.innerHTML = src ? `<img src="${src}" alt="${p.title}">` : "🛍️";
      });
    });

    // Add to cart
    q("#addToCart").addEventListener("click", () => {
      const sel = q("#variantSel");
      const vId = sel ? sel.value : null;
      const v =
        (variants || []).find((x) => String(x.id) === String(vId)) || {};
      addToGlobalCart({
        productId: p.id,
        variantId: v.id || null,
        storeId: p.storeId || null,
        title: p.title,
        size: v.size,
        basePriceUSD: p.basePriceUSD,
        salePriceUSD: p.salePriceUSD,
        qty: 1,
      });
      alert("Added to cart");
    });

    // Similar (по категории, если есть; иначе по storeId)
    try {
      let similar = [];
      if (p.categoryId != null) {
        try {
          const list = await getJSON(
            `${API_ROOT}/products/category/${encodeURIComponent(p.categoryId)}`
          );
          similar = (Array.isArray(list) ? list : [])
            .filter((x) => String(x.id) !== String(p.id))
            .slice(0, 12);
        } catch {
          const all = await getJSON(`${API_ROOT}/products/all-products`);
          similar = (Array.isArray(all) ? all : [])
            .filter(
              (x) =>
                String(x.categoryId) === String(p.categoryId) &&
                String(x.id) !== String(p.id)
            )
            .slice(0, 12);
        }
      } else {
        // Фоллбек: по тому же магазину
        const all = await getJSON(`${API_ROOT}/products/all-products`);
        similar = (Array.isArray(all) ? all : [])
          .filter(
            (x) =>
              String(x.storeId) === String(p.storeId) &&
              String(x.id) !== String(p.id)
          )
          .slice(0, 12);
      }

      const sRow = q("#similarRow");
      sRow.innerHTML = "";
      similar.forEach((sp) => {
        const img =
          sp.imageUrls && sp.imageUrls.length
            ? normalizeImg(sp.imageUrls[0])
            : "";
        const a = document.createElement("a");
        a.className = "card";
        a.href = `./productView.html?id=${encodeURIComponent(sp.id)}`;
        a.innerHTML = `
          <div class="thumb">${
            img ? `<img src="${img}" alt="${sp.title}">` : "🛍️"
          }</div>
          <div class="body">
            <div class="title">${sp.title}</div>
            <div class="priceRow" id="simPrice-${sp.id}">${renderPriceHTML(sp)}</div>
          </div>`;
        sRow.appendChild(a);
      });
    } catch (e) {
      /* ignore similar errors */
    }
  } catch (e) {
    q("#productView").innerHTML = "<p>Product not found or failed to load.</p>";
    console.error(e);
  }

  function qAll(sel) {
    return Array.from(document.querySelectorAll(sel));
  }
  // Update displayed prices when currency changes
  try {
    const params2 = new URLSearchParams(location.search);
    const id2 = params2.get("id");
    const updatePrices = async () => {
      try {
        const pNow = await getProductById(id2);
        const pv = q('#pvPriceRow');
        if (pv) pv.innerHTML = renderPriceHTML(pNow);
        const sRow = q('#similarRow');
        if (sRow) {
          const cards = Array.from(sRow.querySelectorAll('a.card'));
          for (const card of cards) {
            const m = card.href.match(/id=([^&]+)/);
            if (!m) continue;
            const pid = decodeURIComponent(m[1]);
            try {
              const spNow = await getProductById(pid);
              const el = q(`#simPrice-${pid}`);
              if (el) el.innerHTML = renderPriceHTML(spNow);
            } catch(_){}
          }
        }
      } catch(_){}
    };
    window.onCurrencyChange = updatePrices;
  } catch(_){}
});
