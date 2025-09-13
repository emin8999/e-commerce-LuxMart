"use strict";

/**
 * Cart Page (Amazon-like)
 * - Локальная корзина (localStorage)
 * - Подсчёт цен/скидок/итога
 * - Применение купона (API)
 * - Расчёт доставки (API)
 * - Создание заказа (API)
 * - Похожие товары по категории (API)
 */

const API_BASE = "http://116.203.51.133/luxmart";
const TOKEN_KEY = "storeJwt"; // если Checkout требует авторизацию продавца/покупателя — подставь свой ключ
const CART_KEY = "cart"; // формат: { items: [{productId, variantId?, size?, qty, ...meta}] }

// Эндпойнты (раздельные имена под бэкенд)
const API = {
  PRODUCT_ONE: (id) => `${API_BASE}/api/products/${encodeURIComponent(id)}`,
  PRODUCTS_ALL: `${API_BASE}/api/products/all-products`,
  PRODUCTS_BY_CATEGORY: (catId) =>
    `${API_BASE}/api/products/category/${encodeURIComponent(catId)}`,

  COUPON_APPLY: `${API_BASE}/api/cart/coupons/apply`, // POST {code, items} -> {ok, discountUSD, message}
  SHIPPING_QUOTE: `${API_BASE}/api/shipping/quote`, // POST {country, items} -> {ok, shippingUSD}
  ORDER_CREATE: `${API_BASE}/api/orders`, // POST {items, totals, coupon?, shipping?} -> {orderId}
};

// ===== УТИЛИТЫ =====
const $$ = (sel, root = document) => root.querySelector(sel);
const $$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function money(n) {
  const v = Number(n || 0);
  return `$${v.toFixed(2)}`;
}

function normalizeImg(src) {
  if (!src) return "";
  const s = String(src).trim();
  if (/^(https?:)?\/\//i.test(s) || /^data:/i.test(s)) return s;
  return `${API_BASE}/${s.replace(/^\/+/, "")}`;
}

// ===== ЛОКАЛЬНАЯ КОРЗИНА =====
function getCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY));
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
      return parsed;
    }
  } catch {}
  return { items: [] };
}
function setCart(cartObj) {
  localStorage.setItem(CART_KEY, JSON.stringify(cartObj));
  try { window.renderCartBadge && window.renderCartBadge(); } catch(_) {}
  // совместимость с альтернативной шапкой
  const badge = document.getElementById("cart-badge");
  if (badge) {
    const count = cartObj.items.reduce((s, it) => s + Number(it.qty || 0), 0);
    if (count > 0) {
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }
}
function addCartItem(newItem) {
  const cart = getCart();
  const key = (x) => `${x.productId}__${x.variantId ?? ''}__${x.size ?? ''}`;
  // merge by productId+variantId(+size)
  const idx = cart.items.findIndex((x) => key(x) === key(newItem));
  if (idx >= 0) cart.items[idx].qty = Number(cart.items[idx].qty || 0) + Number(newItem.qty || 1);
  else cart.items.push({ qty: 1, ...newItem });
  setCart(cart);
}
function updateCartItem(productId, variantId, qty) {
  const cart = getCart();
  const i = cart.items.findIndex(
    (x) =>
      String(x.productId) === String(productId) &&
      String(x.variantId || "") === (variantId || "")
  );
  if (i >= 0) {
    cart.items[i].qty = Math.max(0, Number(qty || 0));
    if (cart.items[i].qty === 0) cart.items.splice(i, 1);
  }
  setCart(cart);
}
function changeCartItemVariant(productId, oldVariantId, newVariant, meta = {}) {
  // newVariant: {id, size?}
  const cart = getCart();
  const i = cart.items.findIndex(
    (x) =>
      String(x.productId) === String(productId) &&
      String(x.variantId || "") === String(oldVariantId || "")
  );
  if (i < 0) return;
  const item = cart.items[i];
  const candidate = {
    ...item,
    ...meta,
    variantId: newVariant?.id ?? null,
    size: newVariant?.size ?? null,
  };
  // try to merge with existing of same variant
  const j = cart.items.findIndex(
    (x) =>
      String(x.productId) === String(candidate.productId) &&
      String(x.variantId || "") === String(candidate.variantId || "") &&
      String(x.size || "") === String(candidate.size || "")
  );
  if (j >= 0 && j !== i) {
    cart.items[j].qty = Number(cart.items[j].qty || 0) + Number(candidate.qty || 0);
    cart.items.splice(i, 1);
  } else {
    cart.items[i] = candidate;
  }
  setCart(cart);
}
function removeCartItem(productId, variantId) {
  const cart = getCart();
  cart.items = cart.items.filter(
    (x) =>
      !(
        String(x.productId) === String(productId) &&
        String(x.variantId || "") === (variantId || "")
      )
  );
  setCart(cart);
}
function clearCart() {
  setCart({ items: [] });
}

// Глобальный помощник корзины для кнопок "Add to cart"
window.cart = {
  add(item) { addCartItem(item); },
  updateQty(productId, variantId, qty) { updateCartItem(productId, variantId, qty); },
  changeVariant(productId, oldVariantId, newVariant, meta) { changeCartItemVariant(productId, oldVariantId, newVariant, meta); },
  remove(productId, variantId) { removeCartItem(productId, variantId); },
  clear() { clearCart(); },
  getItems() { return getCart().items.slice(); },
  getCount() { return getCart().items.reduce((s, it) => s + Number(it.qty || 0), 0); },
};

// Цена по товару/варианту
function unitPriceUSD(p, v) {
  // приоритет: цена варианта → иначе цена товара (с учётом скидки)
  const base =
    v && v.basePriceUSD != null
      ? Number(v.basePriceUSD)
      : Number(p.basePriceUSD ?? 0);
  const sale =
    v && v.salePriceUSD != null
      ? Number(v.salePriceUSD)
      : p.salePriceUSD != null
      ? Number(p.salePriceUSD)
      : null;
  return sale != null && sale >= 0 && sale < base ? sale : base;
}

// ===== API-запросы =====
async function httpGetJson(url, opt = {}) {
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json", ...authHeaders() },
    ...opt,
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}
async function httpPostJson(url, bodyObj) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(bodyObj || {}),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

// ===== СОСТОЯНИЕ СТРАНИЦЫ =====
const state = {
  lines: [], // [{ cartItem, product, variant, categoryId }]
  totals: {
    subtotal: 0,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 0,
  },
  coupon: {
    code: "",
    applied: false,
    message: "",
  },
};

// ===== ЗАГРУЗКА И ОТРИСОВКА =====
document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadCartLines();
  renderCart();
  await loadSimilarForTopCategory(); // рекомендации
}

async function loadCartLines() {
  const cart = getCart().items;
  const lines = [];
  // подгружаем продукты (и при необходимости — данные варианта)
  for (const item of cart) {
    try {
      const p = await httpGetJson(API.PRODUCT_ONE(item.productId));
      let variant = null;
      if (item.variantId && Array.isArray(p.variants)) {
        variant =
          p.variants.find((v) => String(v.id) === String(item.variantId)) ||
          null;
      }
      lines.push({
        cartItem: item,
        product: p,
        variant,
        categoryId: p.categoryId,
      });
    } catch (e) {
      // Если продукт с сервера не пришёл — используем минимальные данные из item
      console.warn("Product fetch error, fallback to local item", item.productId);
      const base = Number(item.basePriceUSD ?? 0);
      const sale = item.salePriceUSD != null ? Number(item.salePriceUSD) : null;
      const productFallback = {
        id: item.productId,
        title: item.title || `#${item.productId}`,
        description: item.description || "",
        basePriceUSD: base,
        salePriceUSD: sale,
        imageUrls: item.imageUrls || [],
        variants: [],
        categoryId: item.categoryId || null,
      };
      lines.push({
        cartItem: item,
        product: productFallback,
        variant: item.size ? { id: item.variantId, size: item.size } : null,
        categoryId: productFallback.categoryId,
      });
    }
  }
  state.lines = lines;
  recomputeTotals();
}

function recomputeTotals() {
  const t = {
    subtotal: 0,
    discount: 0,
    shipping: state.totals.shipping || 0,
    tax: 0,
    total: 0,
  };

  for (const L of state.lines) {
    const p = L.product,
      v = L.variant,
      qty = Number(L.cartItem.qty || 0);
    const base =
      v && v.basePriceUSD != null
        ? Number(v.basePriceUSD)
        : Number(p.basePriceUSD ?? 0);
    const current = unitPriceUSD(p, v);
    t.subtotal += current * qty;
    if (base > current) t.discount += (base - current) * qty;
  }

  // простая модель налога: 0 (можно расширить по стране)
  t.tax = 0;

  // if coupon applied — скидка уже содержится в state.totals.discount? нет → применяем из state.coupon
  // Здесь скидка купона прибавляется к discount (как дополнительная)
  if (state.coupon.applied && state.totals && state.totals.couponDiscountUSD) {
    t.discount += state.totals.couponDiscountUSD;
  }

  t.total = Math.max(0, t.subtotal - t.discount + t.shipping + t.tax);
  state.totals = t;
}

function renderCart() {
  const listRoot = $$("#cartList");
  const empty = $$("#cartEmpty");

  listRoot.innerHTML = "";

  if (!state.lines.length) {
    empty.hidden = false;
    renderSummary();
    renderSimilar([]); // очистить рекомендации
    return;
  }
  empty.hidden = true;

  state.lines.forEach((L) => {
    const p = L.product,
      v = L.variant,
      it = L.cartItem;
    const img =
      p.imageUrls && p.imageUrls.length ? normalizeImg(p.imageUrls[0]) : "";
    const price = unitPriceUSD(p, v);
    const base =
      v && v.basePriceUSD != null
        ? Number(v.basePriceUSD)
        : Number(p.basePriceUSD ?? 0);
    const hasDiscount = base > price;

    const row = document.createElement("div");
    row.className = "card";
    row.style.display = "grid";
    row.style.gridTemplateColumns = "120px 1fr 160px";
    row.style.gap = "12px";
    row.style.alignItems = "start";
    // Селектор размера/варианта (если есть варианты)
    let variantSelectorHtml = "";
    if (Array.isArray(p.variants) && p.variants.length) {
      const options = p.variants
        .map((vv) => {
          const stock = Number(vv.stockQuantity || vv.stock || 0);
          const disabled = stock <= 0 ? "disabled" : "";
          const sel = String(v?.id || "") === String(vv.id) ? "selected" : "";
          const label = `${vv.size || "Variant"}${stock > 0 ? ` — ${stock} in stock` : ""}`;
          return `<option value="${vv.id}" ${sel} ${disabled}>${label}</option>`;
        })
        .join("");
      variantSelectorHtml = `
        <div style="margin-top:6px">
          <label class="muted" for="variant-${p.id}">Size</label>
          <select id="variant-${p.id}" class="" style="margin-left:8px; padding:.35rem .5rem; border:1px solid #e9ecef; border-radius:8px">
            ${options}
          </select>
        </div>`;
    }

    row.innerHTML = `
      <a class="product-thumb" href="./productView.html?id=${encodeURIComponent(
        p.id
      )}" style="display:block;width:120px;height:120px;overflow:hidden;border:1px solid #e9ecef;border-radius:10px;background:#fff">
        ${
          img
            ? `<img src="${img}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover"/>`
            : `<div class="product-thumb__ph" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">🛍️</div>`
        }
      </a>
      <div>
        <a class="title" href="./productView.html?id=${encodeURIComponent(
          p.id
        )}" style="font-weight:700">${p.title || p.nameEn || `#${p.id}`}</a>
        ${variantSelectorHtml}
        ${
          p.description
            ? `<div class="muted" style="margin-top:4px;max-width:70ch;line-height:1.45">${p.description}</div>`
            : ""
        }
        <div style="display:flex;gap:8px;margin-top:10px;align-items:center">
          <label for="qty-${p.id}-${v?.id || "na"}" class="muted">Qty</label>
          <input id="qty-${p.id}-${
      v?.id || "na"
    }" type="number" min="0" step="1" value="${
      it.qty
    }" style="width:90px;padding:.45rem .6rem;border:1px solid #e9ecef;border-radius:10px"/>
          <button class="btn ghost removeBtn">Remove</button>
        </div>
      </div>
      <div style="text-align:right">
        <div class="price">${money(price)} ${
      hasDiscount
        ? `<span class="old" style="margin-left:6px;opacity:.6;text-decoration:line-through">${money(
            base
          )}</span>`
        : ""
    }</div>
        <div class="muted" style="margin-top:6px">Subtotal: <strong>${money(
          price * it.qty
        )}</strong></div>
      </div>
    `;

    // qty change
    row
      .querySelector(`#qty-${p.id}-${v?.id || "na"}`)
      ?.addEventListener("change", (e) => {
        const q = Math.max(0, Number(e.target.value || 0));
        updateCartItem(p.id, v?.id || null, q);
        // перезагрузим строки (пересчёт цен, рекомендации и т.д.)
        loadCartLines().then(() => {
          renderCart();
          loadSimilarForTopCategory();
        });
      });

    // variant/size change
    row
      .querySelector(`#variant-${p.id}`)
      ?.addEventListener("change", (e) => {
        const newVarId = e.target.value || null;
        const chosen = (p.variants || []).find((vv) => String(vv.id) === String(newVarId));
        changeCartItemVariant(p.id, v?.id || null, chosen || { id: null, size: null });
        loadCartLines().then(() => {
          renderCart();
          loadSimilarForTopCategory();
        });
      });

    // remove
    row.querySelector(".removeBtn")?.addEventListener("click", () => {
      removeCartItem(p.id, v?.id || null);
      loadCartLines().then(() => {
        renderCart();
        loadSimilarForTopCategory();
      });
    });

    listRoot.appendChild(row);
  });

  renderSummary();
}

function renderSummary() {
  $$("#sumSubtotal").textContent = money(state.totals.subtotal);
  $$("#sumDiscount").textContent = `- ${money(state.totals.discount)}`;
  $$("#sumShipping").textContent = money(state.totals.shipping);
  $$("#sumTax").textContent = money(state.totals.tax);
  $$("#sumTotal").textContent = money(state.totals.total);
}

// ===== КУПОН =====
$$("#applyCouponBtn")?.addEventListener("click", applyCoupon);

async function applyCoupon() {
  const code = ($$("#couponCode").value || "").trim();
  const msg = $$("#couponMsg");
  msg.textContent = "";
  if (!code) {
    state.coupon = { code: "", applied: false, message: "" };
    state.totals.couponDiscountUSD = 0;
    recomputeTotals();
    renderSummary();
    return;
  }
  try {
    const payload = {
      code,
      items: state.lines.map((L) => ({
        productId: L.product.id,
        variantId: L.variant?.id || null,
        qty: L.cartItem.qty,
        unitPriceUSD: unitPriceUSD(L.product, L.variant),
      })),
    };
    const res = await httpPostJson(API.COUPON_APPLY, payload);
    // ожидается: { ok: true/false, discountUSD: number, message?: string }
    if (res.ok) {
      state.coupon = { code, applied: true, message: res.message || "Applied" };
      state.totals.couponDiscountUSD = Number(res.discountUSD || 0);
      recomputeTotals();
      renderSummary();
      msg.textContent = state.coupon.message;
    } else {
      state.coupon = {
        code,
        applied: false,
        message: res.message || "Coupon rejected",
      };
      state.totals.couponDiscountUSD = 0;
      recomputeTotals();
      renderSummary();
      msg.textContent = state.coupon.message;
    }
  } catch (e) {
    state.coupon = { code, applied: false, message: "Coupon error" };
    state.totals.couponDiscountUSD = 0;
    recomputeTotals();
    renderSummary();
    msg.textContent = "Coupon error";
    console.error(e);
  }
}

// ===== ДОСТАВКА =====
$$("#getShippingQuote")?.addEventListener("click", getShippingQuote);

async function getShippingQuote() {
  const country = $$("#shipCountry").value || "AZ";
  try {
    const payload = {
      country,
      items: state.lines.map((L) => ({
        productId: L.product.id,
        variantId: L.variant?.id || null,
        qty: L.cartItem.qty,
        weightGrams: L.product.weightGrams || 0, // если на бэке используете вес
      })),
    };
    const res = await httpPostJson(API.SHIPPING_QUOTE, payload);
    // ожидается: { ok: true, shippingUSD: number }
    if (res.ok) {
      state.totals.shipping = Number(res.shippingUSD || 0);
      recomputeTotals();
      renderSummary();
    }
  } catch (e) {
    console.error("Shipping quote error", e);
  }
}

// ===== ЧЕКАУТ / СОЗДАНИЕ ЗАКАЗА =====
$$("#checkoutBtn")?.addEventListener("click", createOrder);

async function createOrder() {
  const out = $$("#orderMsg");
  out.textContent = "";
  if (!state.lines.length) {
    out.textContent = "Cart is empty.";
    return;
  }
  try {
    const payload = {
      items: state.lines.map((L) => ({
        productId: L.product.id,
        variantId: L.variant?.id || null,
        qty: L.cartItem.qty,
        unitPriceUSD: unitPriceUSD(L.product, L.variant),
      })),
      totals: {
        subtotalUSD: state.totals.subtotal,
        discountUSD: state.totals.discount,
        shippingUSD: state.totals.shipping,
        taxUSD: state.totals.tax,
        totalUSD: state.totals.total,
      },
      coupon: state.coupon.applied ? { code: state.coupon.code } : null,
      shipping: {
        country: $$("#shipCountry").value || "AZ",
      },
    };
    const res = await httpPostJson(API.ORDER_CREATE, payload);
    // ожидается: { orderId }
    if (res.orderId) {
      out.textContent = `Order created: #${res.orderId}`;
      clearCart();
      await loadCartLines();
      renderCart();
      await loadSimilarForTopCategory();
    } else {
      out.textContent = "Order created (no id).";
    }
  } catch (e) {
    out.textContent = "Order error.";
    console.error(e);
  }
}

// ===== РЕКОМЕНДАЦИИ ПО КАТЕГОРИИ =====
async function loadSimilarForTopCategory() {
  // возьмём самую частую категорию в корзине
  const freq = new Map();
  for (const L of state.lines) {
    if (!L.categoryId) continue;
    const k = String(L.categoryId);
    freq.set(k, (freq.get(k) || 0) + 1);
  }
  if (!freq.size) {
    renderSimilar([]);
    return;
  }
  const topCat = Array.from(freq.entries()).sort((a, b) => b[1] - a[1])[0][0];

  let list = [];
  try {
    // сначала пробуем серверный эндпоинт категории
    const r = await fetch(API.PRODUCTS_BY_CATEGORY(topCat));
    if (!r.ok) throw new Error("no-endpoint");
    list = await r.json();
  } catch {
    // если его нет — фильтруем all-products
    try {
      const all = await httpGetJson(API.PRODUCTS_ALL);
      list = all.filter((x) => String(x.categoryId) === String(topCat));
    } catch {}
  }

  // исключим уже лежащие в корзине id
  const inCart = new Set(state.lines.map((L) => String(L.product.id)));
  const filtered = list.filter((p) => !inCart.has(String(p.id))).slice(0, 12);

  renderSimilar(filtered);
}

function renderSimilar(items) {
  const row = $$("#similarRow");
  const empty = $$("#similarEmpty");
  row.innerHTML = "";
  if (!items || !items.length) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  items.forEach((p) => {
    const img =
      p.imageUrls && p.imageUrls.length ? normalizeImg(p.imageUrls[0]) : "";
    const base = Number(p.basePriceUSD ?? 0);
    const sale = p.salePriceUSD != null ? Number(p.salePriceUSD) : null;
    const current = sale != null && sale >= 0 && sale < base ? sale : base;

    const a = document.createElement("a");
    a.className = "card product-card";
    a.href = `./productView.html?id=${encodeURIComponent(p.id)}`;
    a.innerHTML = `
      <div class="product-thumb" style="width:100%;aspect-ratio:1;border:1px solid #e9ecef;border-radius:10px;overflow:hidden;background:#fff">
        ${
          img
            ? `<img src="${img}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover"/>`
            : `<div class='product-thumb__ph' style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">🛍️</div>`
        }
      </div>
      <div style="margin-top:8px"><strong>${
        p.title || p.nameEn || `#${p.id}`
      }</strong></div>
      <div class="price">${money(current)} ${
      sale != null && sale < base
        ? `<span class='old' style="margin-left:6px;opacity:.6;text-decoration:line-through">${money(
            base
          )}</span>`
        : ""
    }</div>
      <button class="btn btn-primary" style="margin-top:8px">View</button>
    `;
    row.appendChild(a);
  });
}
