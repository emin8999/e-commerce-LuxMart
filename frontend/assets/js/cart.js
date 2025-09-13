"use strict";

/**
 * Cart Page (Server-side Cart API)
 * - Server-side səbət (API əsaslı)
 * - Подсчёт цен/скидок/итога
 * - Применение купона (API)
 * - Расчёт доставки (API)
 * - Создание заказа (API)
 * - Похожие товары по категории (API)
 */

const API_BASE = "http://116.203.51.133/luxmart";
const TOKEN_KEY = "storeJwt";
const USER_ID_KEY = "userId"; // User ID-ni localStorage-də saxlayırıq

// API Endpoints
const API = {
  PRODUCT_ONE: (id) => `${API_BASE}/api/products/${encodeURIComponent(id)}`,
  PRODUCTS_ALL: `${API_BASE}/api/products/all-products`,
  PRODUCTS_BY_CATEGORY: (catId) =>
    `${API_BASE}/api/products/category/${encodeURIComponent(catId)}`,

  // Server-side Cart API endpoints
  CART_ADD: `${API_BASE}/api/cart/add`,
  CART_GET: `${API_BASE}/api/cart/get`,
  CART_UPDATE: `${API_BASE}/api/cart/update`,
  CART_REMOVE: `${API_BASE}/api/cart/remove`,
  CART_CLEAR: `${API_BASE}/api/cart/clear`,

  COUPON_APPLY: `${API_BASE}/api/cart/coupons/apply`,
  SHIPPING_QUOTE: `${API_BASE}/api/shipping/quote`,
  ORDER_CREATE: `${API_BASE}/api/orders`,
};

// ===== УТИЛИТЫ =====
const $$ = (sel, root = document) => root.querySelector(sel);
const $$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function authHeaders() {
  const userId = localStorage.getItem(USER_ID_KEY);
  const headers = {};
  if (userId) {
    headers["User-Id"] = userId;
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function getCurrentUserId() {
  const userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    throw new Error("User not authenticated");
  }
  return userId;
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

// ===== SERVER-SIDE CART API =====
async function httpGetJson(url, opt = {}) {
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json", ...authHeaders() },
    ...opt,
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

// --- ДОБАВЛЕНО: публичный GET без авторизации ---
async function httpGetJsonPublic(url, opt = {}) {
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
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

// Server-side cart functions
async function getCartFromServer() {
  try {
    const response = await httpGetJson(API.CART_GET);
    return response.data || response; // API response structure-a görə
  } catch (error) {
    console.error("Error fetching cart:", error);
    return {
      cartId: null,
      userId: null,
      items: [],
      totalPrice: 0,
      totalItemsCount: 0,
    };
  }
}

async function addCartItemToServer(productId, size, quantity = 1) {
  try {
    const requestBody = {
      productId: productId,
      size: size || null,
      quantity: quantity,
    };

    const response = await httpPostJson(API.CART_ADD, requestBody);
    updateCartBadge();
    return response.data || response;
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
}

async function updateCartItemOnServer(productId, variantId, quantity) {
  try {
    const requestBody = {
      productId: productId,
      variantId: variantId,
      quantity: quantity,
    };

    const response = await httpPostJson(API.CART_UPDATE, requestBody);
    updateCartBadge();
    return response.data || response;
  } catch (error) {
    console.error("Error updating cart item:", error);
    throw error;
  }
}

async function removeCartItemFromServer(productId, variantId) {
  try {
    const requestBody = {
      productId: productId,
      variantId: variantId,
    };

    const response = await httpPostJson(API.CART_REMOVE, requestBody);
    updateCartBadge();
    return response.data || response;
  } catch (error) {
    console.error("Error removing cart item:", error);
    throw error;
  }
}

async function clearCartOnServer() {
  try {
    const response = await httpPostJson(API.CART_CLEAR, {});
    updateCartBadge();
    return response.data || response;
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw error;
  }
}

function updateCartBadge() {
  // Cart badge update functionality
  getCartFromServer().then((cart) => {
    const badge = document.getElementById("cart-badge");
    if (badge) {
      const count = cart.totalItemsCount || 0;
      if (count > 0) {
        badge.textContent = count > 99 ? "99+" : String(count);
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    }
  });
}

// Global cart helper for "Add to cart" buttons
window.cart = {
  async add(item) {
    return await addCartItemToServer(
      item.productId,
      item.size,
      item.quantity || 1
    );
  },
  async updateQty(productId, variantId, qty) {
    return await updateCartItemOnServer(productId, variantId, qty);
  },
  async remove(productId, variantId) {
    return await removeCartItemFromServer(productId, variantId);
  },
  async clear() {
    return await clearCartOnServer();
  },
  async getCart() {
    return await getCartFromServer();
  },
  async getCount() {
    const cart = await getCartFromServer();
    return cart.totalItemsCount || 0;
  },
};

// ===== СОСТОЯНИЕ СТРАНИЦЫ =====
const state = {
  cart: null, // Server-dən gələn cart response
  products: new Map(), // productId -> product details cache
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

// async function init() {
//   try {
//     // Check if user is authenticated
//     getCurrentUserId();

//     await loadCart();
//     renderCart();
//     await loadSimilarForTopCategory();
//   } catch (error) {
//     console.error("Initialization error:", error);
//     // Redirect to login or show error
//     document.body.innerHTML =
//       "<div class='container'><h2>Please log in to view your cart</h2></div>";
//   }
// }

async function loadCart() {
  try {
    state.cart = await getCartFromServer();

    // Cache product details
    for (const item of state.cart.items || []) {
      if (!state.products.has(item.productId)) {
        try {
          // --- ЗАМЕНА: используем публичный GET ---
          const product = await httpGetJsonPublic(
            API.PRODUCT_ONE(item.productId)
          );
          state.products.set(item.productId, product);
        } catch (e) {
          console.warn("Could not load product:", item.productId);
          // Fallback product object
          state.products.set(item.productId, {
            id: item.productId,
            title: item.productTitle || `Product #${item.productId}`,
            slug: item.productSlug || "",
            imageUrls: [],
            basePriceUSD: item.unitPrice || 0,
          });
        }
      }
    }

    recomputeTotals();
  } catch (error) {
    console.error("Error loading cart:", error);
  }
}

function recomputeTotals() {
  if (!state.cart || !state.cart.items) {
    state.totals = { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 };
    return;
  }

  const t = {
    subtotal: state.cart.totalPrice || 0,
    discount: 0, // Server tərəfindən hesablanır
    shipping: state.totals.shipping || 0,
    tax: 0,
    total: 0,
  };

  // Calculate discount from server data if available
  for (const item of state.cart.items) {
    const product = state.products.get(item.productId);
    if (product && product.basePriceUSD > item.unitPrice) {
      t.discount += (product.basePriceUSD - item.unitPrice) * item.quantity;
    }
  }

  // Add coupon discount
  if (state.coupon.applied && state.totals.couponDiscountUSD) {
    t.discount += state.totals.couponDiscountUSD;
  }

  t.total = Math.max(0, t.subtotal - t.discount + t.shipping + t.tax);
  state.totals = t;
}

function renderCart() {
  const listRoot = $$("#cartList");
  const empty = $$("#cartEmpty");

  listRoot.innerHTML = "";

  if (!state.cart?.items?.length) {
    empty.hidden = false;
    renderSummary();
    renderSimilar([]);
    return;
  }
  empty.hidden = true;

  state.cart.items.forEach((item) => {
    const product = state.products.get(item.productId);
    if (!product) return;

    const img = product.imageUrls?.length
      ? normalizeImg(product.imageUrls[0])
      : "";
    const hasDiscount = product.basePriceUSD > item.unitPrice;

    const row = document.createElement("div");
    row.className = "card";
    row.style.display = "grid";
    row.style.gridTemplateColumns = "120px 1fr 160px";
    row.style.gap = "12px";
    row.style.alignItems = "start";

    row.innerHTML = `
      <a class="product-thumb" href="./productView.html?id=${encodeURIComponent(
        product.id
      )}" style="display:block;width:120px;height:120px;overflow:hidden;border:1px solid #e9ecef;border-radius:10px;background:#fff">
        ${
          img
            ? `<img src="${img}" alt="${product.title}" style="width:100%;height:100%;object-fit:cover"/>`
            : `<div class="product-thumb__ph" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">🛍️</div>`
        }
      </a>
      <div>
        <a class="title" href="./productView.html?id=${encodeURIComponent(
          product.id
        )}" style="font-weight:700">${product.title}</a>
        ${
          item.size
            ? `<div class="muted" style="margin-top:4px">Size: ${item.size}</div>`
            : ""
        }
        ${
          product.description
            ? `<div class="muted" style="margin-top:4px;max-width:70ch;line-height:1.45">${product.description}</div>`
            : ""
        }
        <div style="display:flex;gap:8px;margin-top:10px;align-items:center">
          <label for="qty-${item.id}" class="muted">Qty</label>
          <input id="qty-${item.id}" type="number" min="0" step="1" value="${
      item.quantity
    }" style="width:90px;padding:.45rem .6rem;border:1px solid #e9ecef;border-radius:10px"/>
          <button class="btn ghost removeBtn" data-item-id="${
            item.id
          }" data-product-id="${item.productId}">Remove</button>
        </div>
      </div>
      <div style="text-align:right">
        <div class="price">${money(item.unitPrice)} ${
      hasDiscount
        ? `<span class="old" style="margin-left:6px;opacity:.6;text-decoration:line-through">${money(
            product.basePriceUSD
          )}</span>`
        : ""
    }</div>
        <div class="muted" style="margin-top:6px">Subtotal: <strong>${money(
          item.totalPrice
        )}</strong></div>
      </div>
    `;

    // Quantity change event
    row
      .querySelector(`#qty-${item.id}`)
      ?.addEventListener("change", async (e) => {
        const q = Math.max(0, Number(e.target.value || 0));
        try {
          if (q === 0) {
            await window.cart.remove(item.productId, null);
          } else {
            await window.cart.updateQty(item.productId, null, q);
          }
          await loadCart();
          renderCart();
          await loadSimilarForTopCategory();
        } catch (error) {
          console.error("Error updating quantity:", error);
        }
      });

    // Remove button event
    row.querySelector(".removeBtn")?.addEventListener("click", async () => {
      try {
        await window.cart.remove(item.productId, null);
        await loadCart();
        renderCart();
        await loadSimilarForTopCategory();
      } catch (error) {
        console.error("Error removing item:", error);
      }
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
      items: (state.cart?.items || []).map((item) => ({
        productId: item.productId,
        variantId: null,
        qty: item.quantity,
        unitPriceUSD: item.unitPrice,
      })),
    };

    const res = await httpPostJson(API.COUPON_APPLY, payload);

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
      items: (state.cart?.items || []).map((item) => {
        const product = state.products.get(item.productId);
        return {
          productId: item.productId,
          variantId: null,
          qty: item.quantity,
          weightGrams: product?.weightGrams || 0,
        };
      }),
    };

    const res = await httpPostJson(API.SHIPPING_QUOTE, payload);

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

  if (!state.cart?.items?.length) {
    out.textContent = "Cart is empty.";
    return;
  }

  try {
    const payload = {
      items: state.cart.items.map((item) => ({
        productId: item.productId,
        variantId: null,
        qty: item.quantity,
        unitPriceUSD: item.unitPrice,
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

    if (res.orderId) {
      out.textContent = `Order created: #${res.orderId}`;
      await window.cart.clear();
      await loadCart();
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
  if (!state.cart?.items?.length) {
    renderSimilar([]);
    return;
  }

  // Get most frequent category from cart products
  const freq = new Map();
  for (const item of state.cart.items) {
    const product = state.products.get(item.productId);
    if (!product?.categoryId) continue;
    const k = String(product.categoryId);
    freq.set(k, (freq.get(k) || 0) + 1);
  }

  if (!freq.size) {
    renderSimilar([]);
    return;
  }

  const topCat = Array.from(freq.entries()).sort((a, b) => b[1] - a[1])[0][0];

  let list = [];
  try {
    const r = await fetch(API.PRODUCTS_BY_CATEGORY(topCat));
    if (!r.ok) throw new Error("no-endpoint");
    list = await r.json();
  } catch {
    try {
      const all = await httpGetJson(API.PRODUCTS_ALL);
      list = all.filter((x) => String(x.categoryId) === String(topCat));
    } catch {}
  }

  // Exclude products already in cart
  const inCart = new Set(
    state.cart.items.map((item) => String(item.productId))
  );
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
    const img = p.imageUrls?.length ? normalizeImg(p.imageUrls[0]) : "";
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
