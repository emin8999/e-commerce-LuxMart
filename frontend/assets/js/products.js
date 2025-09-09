// Backend base. Prefer global APP_CONFIG.apiBase (includes "/api"),
// otherwise fallback to server context-path "/home".
const FALLBACK_BASE = "http://116.203.51.133/luxmart";
const API_ROOT =
  window.APP_CONFIG && window.APP_CONFIG.apiBase
    ? window.APP_CONFIG.apiBase.replace(/\/$/, "")
    : `${FALLBACK_BASE.replace(/\/$/, "")}/api`;

/** === Конфиг авторизации: если список закрыт, поставь true === */
const USE_AUTH_FOR_PRODUCTS = false;
const TOKEN_KEY = "storeJwt";
function authHeaders() {
  if (!USE_AUTH_FOR_PRODUCTS) return {};
  const t = localStorage.getItem(TOKEN_KEY);
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** === Mixed content guard === */
(function () {
  if (location.protocol === "https:" && !API_ROOT.startsWith("https:")) {
    console.error(
      "Mixed content: страница https, а API http — браузер блокирует запросы."
    );
  }
})();

/** === Утилиты === */
function fmtUSD(v) {
  if (v == null) return "";
  const n = Number(v);
  return isFinite(n) ? `$${n.toFixed(2)}` : "";
}
function pricePair(p) {
  const base = Number(p.basePriceUSD ?? 0);
  const sale = p.salePriceUSD != null ? Number(p.salePriceUSD) : null;
  if (sale != null && isFinite(sale) && sale > 0 && sale < base)
    return { current: fmtUSD(sale), old: fmtUSD(base) };
  return { current: fmtUSD(base), old: "" };
}
function normalizeImg(src) {
  if (!src) return "";
  const s = String(src).trim();
  if (/^(https?:)?\/\//i.test(s) || /^data:/i.test(s)) return s;
  const rawBase = API_ROOT.replace(/\/?api\/?$/, "");
  return `${rawBase}/${s.replace(/^\/+/, "")}`;
}

/** === Корзина === */
const CART_KEY = "cart";
const Cart = {
  _read() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
      return [];
    }
  },
  _write(x) {
    localStorage.setItem(CART_KEY, JSON.stringify(x));
  },
  add(it) {
    const arr = this._read();
    arr.push(it);
    this._write(arr);
    this.renderBadge();
  },
  count() {
    return this._read().length;
  },
  renderBadge() {
    const el = document.getElementById("cartBadge");
    if (el) el.textContent = String(this.count());
  },
};

/** === Загрузка товаров с fallback === */
function normalizeList(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.content)) return raw.content; // Spring Page
  if (raw && Array.isArray(raw.items)) return raw.items;
  if (raw && Array.isArray(raw.data)) return raw.data;
  return null; // намеренно null — чтобы понимать, что формат неизвестен
}

async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`[${res.status}] ${url}\n${t}`);
  }
  try {
    return await res.json();
  } catch {
    const tt = await res.text().catch(() => "");
    throw new Error(`Ответ не JSON от ${url}\n${tt.slice(0, 500)}`);
  }
}

async function fetchAllProducts() {
  if (location.protocol === "https:" && !API_ROOT.startsWith("https:")) {
    throw new Error(
      "Страница https, API http → запросы блокируются (mixed content). Используйте https для API или проксируйте через тот же домен."
    );
  }
  const urls = [
    `${API_ROOT}/products/all-products`,
    `${API_ROOT}/products`,
    `${API_ROOT}/v1/products`,
    `${API_ROOT}/products/getAll`,
  ];
  const errors = [];
  for (const u of urls) {
    try {
      const data = await fetchJSON(u);
      const list = normalizeList(data);
      if (list) return list; // массив (пусть даже пустой) — успех
      // если пришёл объект без массива — попробуем следующий URL, но запишем подсказку
      errors.push(
        `OK ${u} но формат без массива (ключи: ${Object.keys(data || {}).join(
          ", "
        )})`
      );
    } catch (e) {
      errors.push(e.message || String(e));
    }
  }
  throw new Error(
    `Не нашли валидный эндпоинт списка товаров:\n${errors.join("\n----\n")}`
  );
}

/** === Рендер === */
function renderProducts(products) {
  const grid = document.getElementById("productsGrid");
  const empty = document.getElementById("emptyState");
  if (!grid || !empty) return;

  if (!products.length) {
    empty.hidden = false;
    grid.innerHTML = "";
    return;
  }

  empty.hidden = true;
  grid.innerHTML = "";

  products.forEach((p) => {
    const { current, old } = pricePair(p);
    const img =
      p.imageUrls && p.imageUrls.length ? normalizeImg(p.imageUrls[0]) : "";

    const card = document.createElement("div");
    card.className = "card";

    const thumb = document.createElement("a");
    thumb.className = "thumb";
    thumb.href = `./productView.html?id=${encodeURIComponent(p.id)}`;
    thumb.innerHTML = img ? `<img src="${img}" alt="${p.title}">` : "🛍️";

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h3");
    title.className = "title";
    title.textContent = p.title ?? p.nameEn ?? `#${p.id}`;

    const priceRow = document.createElement("div");
    priceRow.className = "priceRow";
    priceRow.innerHTML = `<span class="price">${current}</span>${
      old ? ` <span class="old">${old}</span>` : ""
    }`;

    const actions = document.createElement("div");
    actions.className = "actions";

    const viewBtn = document.createElement("a");
    viewBtn.className = "btn";
    viewBtn.href = `./productView.html?id=${encodeURIComponent(p.id)}`;
    viewBtn.textContent = "View";

    const addBtn = document.createElement("button");
    addBtn.className = "icon-btn";
    addBtn.title = "Add to cart";
    addBtn.innerHTML = `
      <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6h15l-1.5 9h-12z" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <circle cx="9" cy="20" r="1.5" fill="currentColor"/>
        <circle cx="17" cy="20" r="1.5" fill="currentColor"/>
        <path d="M6 6L5 3H2" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <path d="M12 7v6M9 10h6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      </svg>`;

    addBtn.addEventListener("click", (e) => {
      e.preventDefault();
      Cart.add({
        productId: p.id,
        variantId: null,
        title: p.title ?? p.nameEn ?? `#${p.id}`,
        basePriceUSD: p.basePriceUSD,
        salePriceUSD: p.salePriceUSD,
        qty: 1,
      });
    });

    actions.appendChild(viewBtn);
    actions.appendChild(addBtn);
    body.appendChild(title);
    body.appendChild(priceRow);
    body.appendChild(actions);
    card.appendChild(thumb);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

/** === Старт === */
document.addEventListener("DOMContentLoaded", async () => {
  Cart.renderBadge();
  const grid = document.getElementById("productsGrid");
  const empty = document.getElementById("emptyState");
  if (!grid || !empty) {
    console.warn("productsGrid / emptyState не найдены");
    return;
  }
  try {
    const products = await fetchAllProducts();
    renderProducts(products);
  } catch (e) {
    console.error("Products load failed:", e.message || e);
    empty.hidden = false;
    grid.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; padding:12px">
        <div style="font-weight:700; color:#c00">Не удалось загрузить товары</div>
        <pre style="white-space:pre-wrap; font-size:12px; color:#555; margin:6px 0 0">${(
          e.message || ""
        ).slice(0, 2000)}</pre>
      </div>
    `;
  }
});
