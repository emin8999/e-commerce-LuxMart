// -------- API base --------
const API_PRODUCTS_BASE = "http://116.203.51.133/luxmart";

// -------- Helpers --------
const $$ = (sel, root = document) => root.querySelector(sel);
const $$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function normalizeImg(src) {
  if (!src) return "";
  const s = String(src).trim();
  if (/^(https?:)?\/\//i.test(s) || /^data:/i.test(s)) return s;
  return `${API_PRODUCTS_BASE}/${s.replace(/^\/+/, "")}`;
}

// -------- Cart (in-memory storage) --------
// ВАЖНО: localStorage не поддерживается в Claude.ai, используем память
let cartItems = [];

function getCart() {
  return cartItems;
}

function setCart(items) {
  cartItems = items;
  renderCartBadge();
}

function addToCart(item) {
  const cart = getCart();
  const idx = cart.findIndex(
    (x) =>
      String(x.productId) === String(item.productId) &&
      String(x.variantId || "") === (item.variantId || "")
  );
  if (idx >= 0) cart[idx].qty += item.qty || 1;
  else cart.push(item);
  setCart(cart);
  alert("Added to cart");
}

function renderCartBadge() {
  const n = getCart().reduce((a, b) => a + (b.qty || 0), 0);
  const badge = $$("#cartBadge");
  if (badge) badge.textContent = String(n);
}

// -------- Price helpers --------
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

// -------- Data fetch --------
function parseProductsPayload(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.products)) return payload.products;
  if (Array.isArray(payload.list)) return payload.list;
  return [];
}

async function fetchAllProducts() {
  // Исправлены эндпоинты согласно бэкенду
  const endpoints = [
    `${API_PRODUCTS_BASE}/api/products/all-products`,
    `${API_PRODUCTS_BASE}/api/products/public`,
  ];

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers,
        mode: "cors",
      });

      if (!res.ok) {
        console.warn("Products HTTP", res.status, url);
        continue;
      }

      const data = await res.json();
      const list = parseProductsPayload(data);
      if (Array.isArray(list) && list.length) return list;
    } catch (err) {
      console.warn("Products fetch error for", url, err);
    }
  }
  // Nothing worked
  return [];
}

// -------- Safe image pick --------
function firstImage(p) {
  // Исправлено: бэкенд возвращает imageUrls как массив строк
  const arr = Array.isArray(p.imageUrls)
    ? p.imageUrls
    : typeof p.imageUrls === "string"
    ? [p.imageUrls]
    : [];
  return arr.length ? normalizeImg(arr[0]) : "";
}

// -------- Render grid --------
function renderGrid(list) {
  const grid = $$("#productsGrid");
  const empty = $$("#gridEmpty");
  grid.innerHTML = "";

  if (!list.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  list.forEach((p) => {
    const price = computePriceUSD(p);
    const img = firstImage(p);
    const card = document.createElement("div");
    card.className = "card";

    const thumb = document.createElement("a");
    thumb.className = "thumb";
    thumb.href = `./productView.html?id=${encodeURIComponent(p.id)}`;
    thumb.innerHTML = img
      ? `<img src="${img}" alt="${p.title || p.nameEn || ""}">`
      : "🛍️";

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("a");
    title.className = "title visit";
    title.href = thumb.href;
    // Исправлено: используем title, который приходит с бэкенда
    title.textContent = p.title || `Product #${p.id}`;

    const priceDiv = document.createElement("div");
    priceDiv.className = "price";
    priceDiv.innerHTML = `${formatCurrencyFromUSD(price.current)} ${
      price.old
        ? `<span class="old">${formatCurrencyFromUSD(price.old)}</span>`
        : ""
    }`;

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const visit = document.createElement("a");
    visit.className = "visit";
    visit.href = thumb.href;
    visit.textContent = "View Details";

    const add = document.createElement("button");
    add.className = "add-btn";
    add.innerHTML = `Add to cart`;
    add.addEventListener("click", (e) => {
      e.preventDefault();
      // Добавляем проверку на наличие вариантов
      const cartItem = {
        productId: p.id,
        variantId:
          p.variants && p.variants.length > 0 ? p.variants[0].id : null,
        storeId: p.storeId,
        title: p.title,
        basePriceUSD: p.basePriceUSD,
        salePriceUSD: p.salePriceUSD,
        qty: 1,
      };
      addToCart(cartItem);
    });

    actions.appendChild(visit);
    actions.appendChild(add);

    body.appendChild(title);
    body.appendChild(priceDiv);

    // Добавляем отображение категории, если есть
    if (p.nameEn) {
      const categoryDiv = document.createElement("div");
      categoryDiv.className = "category";
      categoryDiv.textContent = p.nameEn;
      categoryDiv.style.fontSize = "0.85rem";
      categoryDiv.style.color = "#666";
      categoryDiv.style.marginTop = "5px";
      body.appendChild(categoryDiv);
    }

    body.appendChild(actions);

    card.appendChild(thumb);
    card.appendChild(body);

    grid.appendChild(card);
  });
}

// -------- Filters & sorting --------
function applyFiltersTo(list) {
  const onlySale = $$("#onlySale")?.checked;
  const minP = Number($$("#minPrice")?.value || "");
  const maxP = Number($$("#maxPrice")?.value || "");
  const hasMin = !Number.isNaN(minP);
  const hasMax = !Number.isNaN(maxP);

  let out = list.slice();
  if (onlySale) {
    out = out.filter((p) => {
      const { current, old } = computePriceUSD(p);
      return old != null && current < old;
    });
  }
  if (hasMin) {
    out = out.filter((p) => computePriceUSD(p).current >= minP);
  }
  if (hasMax) {
    out = out.filter((p) => computePriceUSD(p).current <= maxP);
  }

  const sort = $$("#sortSel")?.value || "popular";
  if (sort === "priceAsc")
    out.sort((a, b) => computePriceUSD(a).current - computePriceUSD(b).current);
  if (sort === "priceDesc")
    out.sort((a, b) => computePriceUSD(b).current - computePriceUSD(a).current);
  if (sort === "titleAsc")
    out.sort((a, b) =>
      String(a.title || "").localeCompare(String(b.title || ""))
    );
  if (sort === "titleDesc")
    out.sort((a, b) =>
      String(b.title || "").localeCompare(String(a.title || ""))
    );

  return out;
}

// -------- Categories fetch --------
async function fetchCategories() {
  try {
    const res = await fetch(`${API_PRODUCTS_BASE}/api/categories`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      mode: "cors",
    });

    if (res.ok) {
      const categories = await res.json();
      return categories;
    }
  } catch (err) {
    console.warn("Failed to fetch categories", err);
  }
  return [];
}

// -------- Stores fetch --------
async function fetchStores() {
  try {
    const res = await fetch(`${API_PRODUCTS_BASE}/store/all-stores`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      mode: "cors",
    });

    if (res.ok) {
      const stores = await res.json();
      return stores;
    }
  } catch (err) {
    console.warn("Failed to fetch stores", err);
  }
  return [];
}

// -------- Init --------
document.addEventListener("DOMContentLoaded", async () => {
  renderCartBadge();

  // Показываем индикатор загрузки
  const grid = $$("#productsGrid");
  if (grid) {
    grid.innerHTML =
      '<div style="text-align: center; padding: 20px;">Loading products...</div>';
  }

  const all = await fetchAllProducts();

  // initial render
  renderGrid(all);

  // Загружаем категории и магазины для возможных фильтров
  const categories = await fetchCategories();
  const stores = await fetchStores();

  console.log("Loaded categories:", categories.length);
  console.log("Loaded stores:", stores.length);

  // filters
  $$("#applyFilters")?.addEventListener("click", () => {
    renderGrid(applyFiltersTo(all));
  });

  $$("#clearFilters")?.addEventListener("click", () => {
    if ($$("#onlySale")) $$("#onlySale").checked = false;
    if ($$("#minPrice")) $$("#minPrice").value = "";
    if ($$("#maxPrice")) $$("#maxPrice").value = "";
    if ($$("#sortSel")) $$("#sortSel").value = "popular";
    renderGrid(all);
  });

  $$("#sortSel")?.addEventListener("change", () => {
    renderGrid(applyFiltersTo(all));
  });

  // Re-render prices on currency change
  window.onCurrencyChange = () => {
    try {
      renderGrid(applyFiltersTo(all));
    } catch (_) {
      // no-op
    }
  };
});
