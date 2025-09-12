// ===== Конфиг API =====
const API_BASE = "http://116.203.51.133/luxmart";

// ===== Утилиты DOM =====
const $$ = (sel, root = document) => root.querySelector(sel);
const $$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Нормализация путей картинок
function normalizeImg(src) {
  if (!src) return "";
  const s = String(src).trim();
  if (/^(https?:)?\/\//i.test(s) || /^data:/i.test(s)) return s;
  return `${API_BASE}/${s.replace(/^\/+/, "")}`;
}

// ===== Корзина (badge) =====
const CART_KEY = "cart";
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}
function renderCartBadge() {
  const n = getCart().reduce((a, b) => a + (b.qty || 0), 0);
  const badge = $$("#cartBadge");
  if (badge) badge.textContent = String(n);
}

// ===== Цены/валюта =====
function computePriceUSD(p) {
  const base = Number(p.basePriceUSD ?? 0);
  const sale = p.salePriceUSD != null ? Number(p.salePriceUSD) : null;
  const current = sale != null && sale >= 0 && sale < base ? sale : base;
  return { current, old: sale != null && sale < base ? base : null };
}
function formatCurrencyFromUSD(nUSD) {
  const cur = window.currency?.getCurrency?.() || "USD";
  const sym = window.currency?.symbol?.(cur) || "$";
  const converted =
    window.currency?.convertUSD?.(Number(nUSD) || 0, cur) || Number(nUSD) || 0;
  return `${sym}${converted.toFixed(2)}`;
}

// ===== API =====
async function fetchCategories() {
  try {
    const r = await fetch(`${API_BASE}/api/categories`);
    if (!r.ok) throw new Error("cat " + r.status);
    const data = await r.json();
    return Array.isArray(data)
      ? data
      : Array.isArray(data.data)
      ? data.data
      : [];
  } catch (e) {
    console.warn("categories:", e);
    return [];
  }
}
async function fetchAllProducts() {
  try {
    const r = await fetch(`${API_BASE}/api/products/all-products`);
    if (!r.ok) throw new Error("prod " + r.status);
    const data = await r.json();
    return Array.isArray(data)
      ? data
      : Array.isArray(data.data)
      ? data.data
      : [];
  } catch (e) {
    console.warn("products:", e);
    return [];
  }
}
async function fetchPartnerStores() {
  const url = `${API_BASE}/store/all-stores`;
  try {
    const r = await fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    if (!r.ok) throw new Error("stores " + r.status);
    const raw = await r.json();
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.stores)) return raw.stores;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.content)) return raw.content;
    return [];
  } catch (e) {
    console.warn("stores:", e);
    return [];
  }
}

// ===== Хелперы для группировки по категориям =====
function mapProductsByCategory(products) {
  const byCat = new Map();
  products.forEach((p) => {
    const cid = p.categoryId ?? p.category?.id;
    if (cid == null) return;
    if (!byCat.has(cid)) byCat.set(cid, []);
    byCat.get(cid).push(p);
  });
  return byCat;
}
function pickN(arr, n) {
  return Array.isArray(arr) ? arr.slice(0, n) : [];
}
function shortName(p) {
  return (p.title || p.nameEn || "").toString();
}

// ===== Рендер категорий (плитки) =====
function renderCategories(list) {
  const wrap = $$("#categoriesGrid");
  const empty = $$("#catsEmpty");
  if (!wrap) return;
  wrap.innerHTML = "";
  if (!list.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  list.forEach((c) => {
    const a = document.createElement("a");
    a.className = "cat-card";
    const title =
      c.nameEn || c.nameAz || c.nameDe || c.nameEs || c.slug || `#${c.id}`;
    const sub = Array.isArray(c.subcategories)
      ? c.subcategories
          .map((x) => x.nameEn || x.slug)
          .filter(Boolean)
          .join(" • ")
      : "";
    a.href = `./products.html?cat=${encodeURIComponent(c.id)}`;
    a.innerHTML = `<div class="cat-title">${title}</div>${
      sub ? `<div class="cat-sub">${sub}</div>` : ""
    }`;
    wrap.appendChild(a);
  });

  // чипсы в герое — 6 популярных категорий
  const chipsRoot = $$("#heroChips");
  if (chipsRoot) {
    chipsRoot.innerHTML = "";
    list.slice(0, 6).forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "chip";
      btn.textContent = c.nameEn || c.slug || `#${c.id}`;
      btn.onclick = () =>
        (location.href = `./products.html?cat=${encodeURIComponent(c.id)}`);
      chipsRoot.appendChild(btn);
    });
  }
}

// ===== Рендер категорииных полок (группы) =====
function renderCategoryShelves(categories, products) {
  const wrap = $$("#catShelves");
  const empty = $$("#catShelvesEmpty");
  if (!wrap) return;
  wrap.innerHTML = "";

  const byCat = mapProductsByCategory(products);
  const groups = categories.filter((c) => byCat.has(c.id));
  if (!groups.length) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  groups.forEach((cat) => {
    const list = pickN(byCat.get(cat.id), 4); // до 4 товаров на группу
    if (!list.length) return;

    const title =
      cat.nameEn ||
      cat.nameAz ||
      cat.nameDe ||
      cat.nameEs ||
      cat.slug ||
      `Category #${cat.id}`;
    const href = `./products.html?cat=${encodeURIComponent(cat.id)}`;

    const card = document.createElement("div");
    card.className = "cs-card";

    const inner = document.createElement("div");
    inner.className = "cs-inner";
    inner.innerHTML = `
      <div class="cs-head">
        <h3 class="cs-title" title="${title.replace(
          /"/g,
          "&quot;"
        )}">${title}</h3>
        <a class="cs-link" href="${href}">See more</a>
      </div>
      <div class="cs-grid"></div>
    `;

    const grid = inner.querySelector(".cs-grid");
    list.forEach((p) => {
      const a = document.createElement("a");
      a.className = "cs-item";
      a.href = href; // клик по превью ведёт в категорию
      const img =
        Array.isArray(p.imageUrls) && p.imageUrls.length
          ? normalizeImg(p.imageUrls[0])
          : "";
      a.innerHTML = `
        <div class="cs-thumb">${img ? `<img src="${img}" alt="">` : "🛍️"}</div>
        <div class="cs-name" title="${shortName(p).replace(
          /"/g,
          "&quot;"
        )}">${shortName(p)}</div>
      `;
      grid.appendChild(a);
    });

    // клик по свободной зоне карточки — тоже в категорию
    inner.addEventListener("click", (e) => {
      const tag = String(e.target.tagName).toLowerCase();
      if (tag !== "a" && !e.target.closest("a")) window.location.href = href;
    });

    card.appendChild(inner);
    wrap.appendChild(card);
  });
}

// ===== Рендер полок товаров =====
function makeProdCard(p) {
  const price = computePriceUSD(p);
  const img =
    Array.isArray(p.imageUrls) && p.imageUrls.length
      ? normalizeImg(p.imageUrls[0])
      : "";
  const el = document.createElement("div");
  el.className = "card";
  const href = `./productView.html?id=${encodeURIComponent(p.id)}`;

  el.innerHTML = `
    <a class="thumb" href="${href}">
      ${
        img
          ? `<img src="${img}" alt="${(p.title || p.nameEn || "").replace(
              /"/g,
              "&quot;"
            )}">`
          : "🛍️"
      }
    </a>
    <div class="card-body">
      <a class="title visit" href="${href}">${
    p.title ?? p.nameEn ?? `#${p.id}`
  }</a>
      <div class="price">
        ${formatCurrencyFromUSD(price.current)}
        ${
          price.old
            ? `<span class="old">${formatCurrencyFromUSD(price.old)}</span>`
            : ""
        }
      </div>
      <div class="card-actions">
        <a class="visit" href="${href}">View</a>
        <button class="add-btn" type="button">Add to cart</button>
      </div>
    </div>
  `;

  el.querySelector(".add-btn").onclick = (e) => {
    e.preventDefault();
    const cart = getCart();
    const idx = cart.findIndex(
      (x) => String(x.productId) === String(p.id) && !x.variantId
    );
    if (idx >= 0) cart[idx].qty += 1;
    else
      cart.push({
        productId: p.id,
        variantId: null,
        storeId: p.storeId,
        title: p.title,
        basePriceUSD: p.basePriceUSD,
        salePriceUSD: p.salePriceUSD,
        qty: 1,
      });
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCartBadge();
  };

  return el;
}
function renderFeatured(list) {
  const root = $$("#featuredGrid");
  const empty = $$("#featEmpty");
  if (!root) return;
  root.innerHTML = "";
  if (!list.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  list.forEach((p) => root.appendChild(makeProdCard(p)));
}
function renderSale(list) {
  const root = $$("#saleGrid");
  const empty = $$("#saleEmpty");
  if (!root) return;
  root.innerHTML = "";
  if (!list.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  list.forEach((p) => root.appendChild(makeProdCard(p)));
}

// ===== Рендер полки магазинов =====
function getStoreName(s) {
  return s.storeName || s.name || s.shopName || "Store";
}
function getStoreLogo(s) {
  const src = s.logo || s.logoUrl || s.image || s.avatar || "";
  return src ? normalizeImg(src) : "";
}
function pickStoreProducts(s) {
  const arr = Array.isArray(s.products)
    ? s.products
    : Array.isArray(s.items)
    ? s.items
    : [];
  return arr.slice(0, 6);
}
function makeStoreCard(s) {
  const el = document.createElement("div");
  el.className = "store-card";
  const name = getStoreName(s);
  const logo = getStoreLogo(s);
  const prods = pickStoreProducts(s);
  const count = Array.isArray(s.products)
    ? s.products.length
    : Array.isArray(s.items)
    ? s.items.length
    : typeof s.productCount === "number"
    ? s.productCount
    : prods.length;
  const href = `./storePage.html?storeId=${encodeURIComponent(s.id || "")}`;

  el.innerHTML = `
    <div class="store-head">
      <div class="store-logo">${
        logo
          ? `<img src="${logo}" alt="${name.replace(/"/g, "&quot;")}">`
          : "🏬"
      }</div>
      <div>
        <div class="store-title" title="${name.replace(
          /"/g,
          "&quot;"
        )}">${name}</div>
        <div class="store-meta">${count} products</div>
      </div>
    </div>
    <div class="store-products">
      ${prods
        .map((p) => {
          const img =
            Array.isArray(p.imageUrls) && p.imageUrls.length
              ? normalizeImg(p.imageUrls[0])
              : "";
          return `<a class="mini" href="./productView.html?id=${encodeURIComponent(
            p.id || ""
          )}">${img ? `<img src="${img}" alt="">` : "🛍️"}</a>`;
        })
        .join("")}
    </div>
    <div class="store-actions">
      <a class="link" href="${href}">Visit store</a>
      <button class="btn btn-primary" type="button">Follow</button>
    </div>
  `;
  el.querySelector(".btn-primary").onclick = () =>
    alert(`You follow "${name}"`);
  return el;
}
function renderStores(stores) {
  const wrap = $$("#storesSlider");
  const empty = $$("#storesEmpty");
  if (!wrap) return;
  wrap.innerHTML = "";
  if (!stores.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const scored = stores
    .map((s) => {
      const count =
        (Array.isArray(s.products)
          ? s.products.length
          : Array.isArray(s.items)
          ? s.items.length
          : typeof s.productCount === "number"
          ? s.productCount
          : 0) || 0;
      return { s, score: count };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  scored.forEach(({ s }) => wrap.appendChild(makeStoreCard(s)));
}

// ===== Сортировки =====
function sortProducts(list, mode) {
  const out = list.slice();
  if (mode === "priceAsc")
    out.sort((a, b) => computePriceUSD(a).current - computePriceUSD(b).current);
  if (mode === "priceDesc")
    out.sort((a, b) => computePriceUSD(b).current - computePriceUSD(a).current);
  if (mode === "titleAsc")
    out.sort((a, b) =>
      String(a.title || "").localeCompare(String(b.title || ""))
    );
  if (mode === "titleDesc")
    out.sort((a, b) =>
      String(b.title || "").localeCompare(String(a.title || ""))
    );
  return out;
}

// ===== Инициализация =====
document.addEventListener("DOMContentLoaded", async () => {
  renderCartBadge();

  const [cats, prods, stores] = await Promise.all([
    fetchCategories(),
    fetchAllProducts(),
    fetchPartnerStores(),
  ]);

  // Категории
  renderCategories(cats);
  // Категорийные полки (группы)
  renderCategoryShelves(cats, prods);

  // Featured / Sale
  const featured = prods.slice(0, 12);
  renderFeatured(featured);

  const sale = prods
    .filter((p) => {
      const { current, old } = computePriceUSD(p);
      return old != null && current < old;
    })
    .slice(0, 12);
  renderSale(sale);

  // Магазины
  renderStores(stores);

  // Сортировка Featured
  $$("#featSort")?.addEventListener("change", (e) => {
    const val = e.target.value || "popular";
    const sorted = val === "popular" ? featured : sortProducts(featured, val);
    renderFeatured(sorted);
  });

  // Поиск из hero
  $$("#heroSearchBtn")?.addEventListener("click", () => {
    const q = ($$("#heroSearch")?.value || "").trim();
    if (!q) return (location.href = "./products.html");
    location.href = `./products.html?query=${encodeURIComponent(q)}`;
  });
  $$("#heroSearch")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") $$("#heroSearchBtn")?.click();
  });

  // Пересчёт цен при смене валюты (если подключено)
  window.onCurrencyChange = () => {
    try {
      renderFeatured(featured);
      renderSale(sale);
      // категор. полки не трогаем — цены там не выводятся
    } catch (_) {}
  };
});
