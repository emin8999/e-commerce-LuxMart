// -------- API base (configurable) --------
const API_BASE =
  (window.LUXMART_CONFIG && window.LUXMART_CONFIG.API_BASE) ||
  "http://116.203.51.133/luxmart";

const API_CONTEXT =
  (window.LUXMART_CONFIG && window.LUXMART_CONFIG.API_CONTEXT) || "";

// -------- Helpers --------
const $$ = (sel, root = document) => root.querySelector(sel);
const $$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// -------- User management --------
function getOrCreateUserId() {
  let userId = localStorage.getItem("guestUserId");
  if (!userId) {
    userId = "999" + Date.now();
    localStorage.setItem("guestUserId", userId);
  }
  return userId;
}

// -------- Image normalization --------
function normalizeImg(src) {
  if (!src) return "";
  const s = String(src).trim();
  if (/^(https?:)?\/\//i.test(s) || /^data:/i.test(s)) return s;
  return `${API_BASE}${API_CONTEXT}/${s.replace(/^\/+/, "")}`;
}

// -------- Cart API integration --------
const CartAPI = {
  async getCart() {
    const userId = getOrCreateUserId();
    try {
      const res = await fetch(`${API_BASE}${API_CONTEXT}/api/cart/get`, {
        method: "GET",
        headers: { Accept: "application/json", "User-Id": userId },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error("Error fetching cart:", e);
      return { items: [], totalPrice: 0, totalItemsCount: 0 };
    }
  },

  async deleteItem(cartItemId) {
    const userId = getOrCreateUserId();
    try {
      const res = await fetch(
        `${API_BASE}${API_CONTEXT}/api/cart/${cartItemId}`,
        {
          method: "DELETE",
          headers: { "User-Id": userId },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error("Error deleting item:", e);
      throw e;
    }
  },

  async updateQuantity(cartItemId, quantity) {
    const userId = getOrCreateUserId();
    try {
      const res = await fetch(
        `${API_BASE}${API_CONTEXT}/api/cart/${cartItemId}/quantity`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "User-Id": userId },
          body: JSON.stringify({ quantity }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error("Error updating quantity:", e);
      throw e;
    }
  },

  async clearCart() {
    const userId = getOrCreateUserId();
    try {
      const res = await fetch(`${API_BASE}${API_CONTEXT}/api/cart/clear`, {
        method: "DELETE",
        headers: { "User-Id": userId },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error("Error clearing cart:", e);
      throw e;
    }
  },
};

// -------- Cart badge update --------
async function updateCartBadge() {
  try {
    const cart = await CartAPI.getCart();
    const badges = [
      $$("#cartBadge"),
      $$("#drawerCartBadge"),
      $$("#cart-badge"),
    ].filter(Boolean);

    const count = cart.totalItemsCount || 0;
    badges.forEach((badge) => {
      badge.textContent = count > 0 ? String(count) : "0";
      badge.style.display = count > 0 ? "inline-block" : "none";
    });
  } catch (error) {
    console.error("Error updating cart badge:", error);
  }
}

// -------- Price helpers --------
function computePriceUSD(p) {
  const base = Number(p.basePriceUSD || 0);
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

// -------- Products API --------
async function fetchAllProducts() {
  const endpoints = [
    `${API_BASE}${API_CONTEXT}/api/products/all-products`,
    `${API_BASE}${API_CONTEXT}/api/products/public`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) continue;

      const data = await res.json();
      let products = [];
      if (Array.isArray(data)) products = data;
      else if (data && typeof data === "object")
        products =
          data.data || data.content || data.items || data.products || [];
      if (products.length > 0) return products;
    } catch (err) {
      console.error(`Error fetching from ${url}:`, err);
    }
  }
  return [];
}

function firstImage(p) {
  let images = [];
  if (Array.isArray(p.imageUrls)) images = p.imageUrls;
  else if (Array.isArray(p.images)) images = p.images;
  else if (typeof p.imageUrl === "string") images = [p.imageUrl];
  else if (typeof p.imageUrls === "string") images = [p.imageUrls];
  return images.length > 0 ? normalizeImg(images[0]) : "";
}

// -------- Render product grid --------
function renderGrid(list) {
  const grid = $$("#productsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (!list.length) {
    grid.innerHTML =
      '<div style="text-align:center;padding:20px;">No products available</div>';
    return;
  }

  list.forEach((p) => {
    const price = computePriceUSD(p);
    const img = firstImage(p);

    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText =
      "border:1px solid #ddd;padding:15px;margin:10px;border-radius:8px;background:white;";

    const thumb = document.createElement("a");
    thumb.href = `./productView.html?id=${encodeURIComponent(p.id)}`;
    thumb.innerHTML = img
      ? `<img src="${img}" alt="${
          p.title || ""
        }" style="max-width:100%;height:200px;object-fit:cover;border-radius:4px;">`
      : '<div style="height:200px;display:flex;align-items:center;justify-content:center;background:#f5f5f5;border-radius:4px;font-size:3em;">🛍️</div>';
    card.appendChild(thumb);

    const title = document.createElement("div");
    title.textContent = p.title || `Product #${p.id}`;
    title.style.fontWeight = "600";
    card.appendChild(title);

    const priceDiv = document.createElement("div");
    priceDiv.innerHTML = price.old
      ? `<span style="color:#27ae60;font-weight:bold;">${formatCurrencyFromUSD(
          price.current
        )}</span> <span style="text-decoration:line-through;color:#95a5a6;margin-left:5px;">${formatCurrencyFromUSD(
          price.old
        )}</span>`
      : `<span style="font-weight:bold;">${formatCurrencyFromUSD(
          price.current
        )}</span>`;
    card.appendChild(priceDiv);

    const addBtn = document.createElement("button");
    addBtn.textContent = "Add to Cart";
    addBtn.style.cssText =
      "padding:8px 16px;background:#27ae60;color:white;border:none;border-radius:4px;cursor:pointer;";
    addBtn.addEventListener("click", async () => {
      try {
        const cart = await CartAPI.getCart();
        const existingItem = cart.items.find((i) => i.productId === p.id);
        if (existingItem) {
          await CartAPI.updateQuantity(
            existingItem.id,
            existingItem.quantity + 1
          );
        } else {
          // Создаем новый товар через updateQuantity на бэке (имитация add)
          // В бэке может быть отдельный add endpoint, если нет — нужен кастом
          alert("Cannot add new item: backend endpoint missing");
        }
        await renderCart();
        await updateCartBadge();
      } catch (e) {
        console.error(e);
      }
    });
    card.appendChild(addBtn);

    grid.appendChild(card);
  });
}

// -------- Render cart in #cartList --------
async function renderCart() {
  const cartContainer = $$("#cartList");
  if (!cartContainer) return;

  const cart = await CartAPI.getCart();
  cartContainer.innerHTML = "";

  if (!cart.items || !cart.items.length) {
    cartContainer.innerHTML = "<div>Your cart is empty</div>";
    return;
  }

  cart.items.forEach((item) => {
    const row = document.createElement("div");
    row.style.cssText =
      "display:flex;align-items:center;gap:10px;margin-bottom:10px;border-bottom:1px solid #eee;padding-bottom:10px;";

    const img = document.createElement("img");
    img.src = normalizeImg(item.imageUrl || item.imageUrls?.[0]);
    img.style.cssText =
      "width:60px;height:60px;object-fit:cover;border-radius:4px;";
    row.appendChild(img);

    const info = document.createElement("div");
    info.style.flex = "1";

    const title = document.createElement("div");
    title.textContent = item.title || `Product #${item.productId}`;
    title.style.fontWeight = "600";
    info.appendChild(title);

    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.value = item.quantity;
    qtyInput.min = 1;
    qtyInput.style.width = "50px";

    qtyInput.addEventListener("change", async () => {
      try {
        await CartAPI.updateQuantity(item.id, parseInt(qtyInput.value, 10));
        renderCart();
        updateCartBadge();
      } catch (e) {
        alert("Error updating quantity");
      }
    });

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.style.cssText =
      "background:red;color:white;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;";
    delBtn.addEventListener("click", async () => {
      try {
        await CartAPI.deleteItem(item.id);
        renderCart();
        updateCartBadge();
      } catch (e) {
        alert("Error deleting item");
      }
    });

    const qtyDiv = document.createElement("div");
    qtyDiv.style.display = "flex";
    qtyDiv.style.gap = "5px";
    qtyDiv.appendChild(qtyInput);
    qtyDiv.appendChild(delBtn);

    info.appendChild(qtyDiv);
    row.appendChild(info);

    const priceDiv = document.createElement("div");
    priceDiv.textContent = formatCurrencyFromUSD(
      item.unitPriceUSD * item.quantity
    );
    priceDiv.style.fontWeight = "600";
    row.appendChild(priceDiv);

    cartContainer.appendChild(row);
  });

  const totalDiv = document.createElement("div");
  totalDiv.style.textAlign = "right";
  totalDiv.style.fontWeight = "700";
  totalDiv.style.marginTop = "10px";
  totalDiv.textContent = `Total: ${formatCurrencyFromUSD(cart.totalPrice)}`;
  cartContainer.appendChild(totalDiv);

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear Cart";
  clearBtn.style.cssText =
    "margin-top:10px;padding:8px 16px;background:#e74c3c;color:white;border:none;border-radius:4px;cursor:pointer;";
  clearBtn.addEventListener("click", async () => {
    await CartAPI.clearCart();
    renderCart();
    updateCartBadge();
  });
  cartContainer.appendChild(clearBtn);
}

// -------- Initialize page --------
document.addEventListener("DOMContentLoaded", async () => {
  await updateCartBadge();
  await renderCart();

  const grid = $$("#productsGrid");
  if (!grid) return;

  grid.innerHTML =
    '<div style="text-align:center;padding:20px;">Loading products...</div>';

  try {
    const products = await fetchAllProducts();
    renderGrid(products);
  } catch (e) {
    console.error("Error initializing products:", e);
  }
});
