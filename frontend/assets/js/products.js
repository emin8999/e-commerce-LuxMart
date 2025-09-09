const API_BASE = "http://116.203.51.133/luxmart";

/** ==== НАСТРОЙКИ (если список приватный — включи авторизацию) ==== */
const TOKEN_KEY = "storeJwt";
const USE_AUTH_FOR_PRODUCTS = false; // поменяй на true, если /api/products* требуют токен

function authHeaders() {
  if (!USE_AUTH_FOR_PRODUCTS) return {};
  const t = localStorage.getItem(TOKEN_KEY);
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** ==== УТИЛИТЫ ==== */
function fmtUSD(v) {
  if (v == null) return "";
  const n = Number(v);
  return isFinite(n) ? `$${n.toFixed(2)}` : "";
}
function pricePair(p) {
  const base = Number(p.basePriceUSD ?? 0);
  const sale = p.salePriceUSD != null ? Number(p.salePriceUSD) : null;
  if (sale != null && isFinite(sale) && sale > 0 && sale < base) {
    return { current: fmtUSD(sale), old: fmtUSD(base) };
  }
  return { current: fmtUSD(base), old: "" };
}
function normalizeImg(src) {
  if (!src) return "";
  const s = String(src).trim();
  if (/^(https?:)?\/\//i.test(s) || /^data:/i.test(s)) return s;
  return `${API_BASE}/${s.replace(/^\/+/, "")}`;
}

/* Simple cart in localStorage */
const CART_KEY = "cart";
const Cart = {
  _read() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
      return [];
    }
  },
  _write(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  },
  add(item) {
    const items = Cart._read();
    items.push(item);
    Cart._write(items);
    Cart.renderBadge();
  },
  count() {
    return Cart._read().length;
  },
  renderBadge() {
    const el = document.getElementById("cartBadge");
    if (el) el.textContent = String(Cart.count());
  },
};

/** ==== ЗАГРУЗКА ТОВАРОВ С УЧЁТОМ РАЗЛИЧИЙ БЭКА ==== */
function normalizeList(raw) {
  // сервер мог вернуть массив прямо или завернуть в объект
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.content)) return raw.content; // Spring Data Page
  if (raw && Array.isArray(raw.items)) return raw.items;
  if (raw && Array.isArray(raw.data)) return raw.data;
  return [];
}

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), ...authHeaders() },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`[${res.status}] ${url}\n${text}`);
  }
  // иногда сервер отдаёт пустой ответ/не json
  try {
    return await res.json();
  } catch (e) {
    throw new Error(`Invalid JSON from ${url}`);
  }
}

async function fetchAllProducts() {
  // список кандидатов на случай разных маршрутов/версий
  const candidates = [
    `${API_BASE}/api/products/all-products`,
    `${API_BASE}/api/products`, // часто так
    `${API_BASE}/api/v1/products`, // иногда версия API
    `${API_BASE}/api/products?page=0&size=1000`, // если пагинация
  ];

  const errors = [];
  for (const url of candidates) {
    try {
      const data = await fetchJSON(url);
      const list = normalizeList(data);
      if (Array.isArray(list) && list.length >= 0) {
        // даже пустой массив — валидный ответ; вернём первый успешно прочитанный
        return list;
      }
    } catch (e) {
      errors.push(String(e.message || e));
    }
  }
  const errMsg =
    `Не удалось получить список товаров ни по одному маршруту.\n` +
    errors.join("\n----\n");
  throw new Error(errMsg);
}

/** ==== РЕНДЕР ==== */
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
    title.textContent = p.title;

    const priceRow = document.createElement("div");
    priceRow.className = "priceRow";
    priceRow.innerHTML =
      `<span class="price">${current}</span>` +
      (old ? ` <span class="old">${old}</span>` : "");

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
        title: p.title,
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

/** ==== ИНИЦ ==== */
document.addEventListener("DOMContentLoaded", async () => {
  Cart.renderBadge();

  const grid = document.getElementById("productsGrid");
  const empty = document.getElementById("emptyState");
  if (!grid || !empty) {
    console.warn("productsGrid / emptyState не найдены в HTML");
    return;
  }

  try {
    const products = await fetchAllProducts();
    renderProducts(products);
  } catch (e) {
    // Явно показываем причину (HTTP-код/текст) — смотри консоль.
    console.error("Products load failed:\n", e.message || e);
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
