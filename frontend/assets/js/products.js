const API_BASE = "http://116.203.51.133/luxmart";

const $$ = (sel, root = document) => root.querySelector(sel);
const $$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function normalizeImg(src) {
  if (!src) return "";
  const s = String(src).trim();
  if (/^(https?:)?\/\//i.test(s) || /^data:/i.test(s)) return s;
  return `${API_BASE}/${s.replace(/^\/+/, "")}`;
}

// -------- Cart (localStorage) --------
const CART_KEY = "cart";
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}
function setCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
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
function formatUSD(n) {
  return `$${Number(n).toFixed(2)}`;
}

// -------- Data fetch --------
async function fetchAllProducts() {
  const res = await fetch(`${API_BASE}/api/products/all-products`);
  if (!res.ok) {
    console.error("Products HTTP", res.status, await res.text());
    return [];
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// -------- Safe image pick --------
function firstImage(p) {
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
    title.textContent = p.title ?? p.nameEn ?? `#${p.id}`;

    const priceDiv = document.createElement("div");
    priceDiv.className = "price";
    priceDiv.innerHTML = `${formatUSD(price.current)} ${
      price.old ? `<span class="old">${formatUSD(price.old)}</span>` : ""
    }`;

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const visit = document.createElement("a");
    visit.className = "visit";
    visit.href = thumb.href;
    visit.textContent = "View";

    const add = document.createElement("button");
    add.className = "add-btn";
    add.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.44A2 2 0 0 0 10 19h9v-2h-8.42a.25.25 0 0 1-.22-.37L11.1 14h6.45a2 2 0 0 0 1.8-1.11L22 7H7.42l-.7-1.4A1 1 0 0 0 6 5H3V3h3a2 2 0 0 1 1.8 1.1L9 8h11l-2 4H11.42"/>
      </svg>
      Add
    `;
    add.addEventListener("click", (e) => {
      e.preventDefault();
      addToCart({
        productId: p.id,
        variantId: null,
        storeId: p.storeId,
        title: p.title,
        basePriceUSD: p.basePriceUSD,
        salePriceUSD: p.salePriceUSD,
        qty: 1,
      });
    });

    actions.appendChild(visit);
    actions.appendChild(add);

    body.appendChild(title);
    body.appendChild(priceDiv);
    body.appendChild(actions);

    card.appendChild(thumb);
    card.appendChild(body);

    grid.appendChild(card);
  });
}

// -------- Filters & sorting (по фактической цене) --------
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

document.addEventListener("DOMContentLoaded", async () => {
  renderCartBadge();

  const all = await fetchAllProducts();

  // initial render
  renderGrid(all);

  // filters
  $$("#applyFilters")?.addEventListener("click", () => {
    renderGrid(applyFiltersTo(all));
  });
  $$("#clearFilters")?.addEventListener("click", () => {
    $$("#onlySale").checked = false;
    $$("#minPrice").value = "";
    $$("#maxPrice").value = "";
    $$("#sortSel").value = "popular";
    renderGrid(all);
  });
  $$("#sortSel")?.addEventListener("change", () => {
    renderGrid(applyFiltersTo(all));
  });
});
