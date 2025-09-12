// -------- API base --------
const API_BASE = "http://116.203.51.133:8080"; // Порт может быть 8080 или другой
const API_CONTEXT = "/luxmart"; // Контекстный путь если есть

// -------- Helpers --------
const $$ = (sel, root = document) => root.querySelector(sel);
const $$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function normalizeImg(src) {
  if (!src) return "";
  const s = String(src).trim();
  // Если это полный URL, возвращаем как есть
  if (/^(https?:)?\/\//i.test(s) || /^data:/i.test(s)) return s;
  // Иначе добавляем базовый URL
  return `${API_BASE}${API_CONTEXT}/${s.replace(/^\/+/, "")}`;
}

// -------- Cart (in-memory) --------
let cartItems = [];

function getCart() {
  // Пытаемся загрузить из localStorage, если доступен
  try {
    const stored = localStorage.getItem("cart");
    if (stored) {
      cartItems = JSON.parse(stored);
    }
  } catch (e) {
    console.log("localStorage not available, using memory");
  }
  return cartItems;
}

function setCart(items) {
  cartItems = items;
  // Пытаемся сохранить в localStorage, если доступен
  try {
    localStorage.setItem("cart", JSON.stringify(items));
  } catch (e) {
    console.log("localStorage not available, keeping in memory");
  }
  renderCartBadge();
}

function addToCart(item) {
  const cart = getCart();
  const idx = cart.findIndex(
    (x) =>
      String(x.productId) === String(item.productId) &&
      String(x.variantId || "") === String(item.variantId || "")
  );
  if (idx >= 0) {
    cart[idx].qty = (cart[idx].qty || 1) + (item.qty || 1);
  } else {
    cart.push({ ...item, qty: item.qty || 1 });
  }
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

// -------- Data fetch --------
async function fetchAllProducts() {
  console.log("Fetching products...");

  // Попробуем разные варианты URL
  const endpoints = [
    `${API_BASE}${API_CONTEXT}/api/products/all-products`,
    `${API_BASE}/api/products/all-products`,
    `${API_BASE}${API_CONTEXT}/api/products/public`,
    `${API_BASE}/api/products/public`,
  ];

  for (const url of endpoints) {
    console.log(`Trying: ${url}`);
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      console.log(`Response status for ${url}: ${res.status}`);

      if (!res.ok) {
        console.warn(`HTTP ${res.status} for ${url}`);
        continue;
      }

      const text = await res.text();
      console.log("Raw response:", text.substring(0, 200));

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        continue;
      }

      console.log("Parsed data:", data);

      // Проверяем разные возможные структуры ответа
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && typeof data === "object") {
        // Пробуем разные поля где могут быть продукты
        list =
          data.data ||
          data.content ||
          data.items ||
          data.products ||
          data.list ||
          [];
      }

      if (Array.isArray(list) && list.length > 0) {
        console.log(`Found ${list.length} products`);
        return list;
      }
    } catch (err) {
      console.error(`Error fetching from ${url}:`, err);
    }
  }

  console.warn("No products found from any endpoint");
  return [];
}

// -------- Safe image pick --------
function firstImage(p) {
  // Проверяем разные возможные поля с изображениями
  let images = [];

  if (Array.isArray(p.imageUrls)) {
    images = p.imageUrls;
  } else if (Array.isArray(p.images)) {
    images = p.images;
  } else if (typeof p.imageUrl === "string") {
    images = [p.imageUrl];
  } else if (typeof p.image === "string") {
    images = [p.image];
  } else if (typeof p.imageUrls === "string") {
    images = [p.imageUrls];
  }

  return images.length > 0 ? normalizeImg(images[0]) : "";
}

// -------- Render grid --------
function renderGrid(list) {
  console.log(`Rendering ${list.length} products`);

  const grid = $$("#productsGrid");
  const empty = $$("#gridEmpty");

  if (!grid) {
    console.error("productsGrid element not found");
    return;
  }

  grid.innerHTML = "";

  if (!list || !list.length) {
    if (empty) empty.hidden = false;
    grid.innerHTML =
      '<div style="text-align: center; padding: 20px;">No products available</div>';
    return;
  }

  if (empty) empty.hidden = true;

  list.forEach((p, index) => {
    console.log(`Product ${index}:`, p);

    const price = computePriceUSD(p);
    const img = firstImage(p);

    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText =
      "border: 1px solid #ddd; padding: 10px; margin: 10px; border-radius: 5px;";

    const thumb = document.createElement("a");
    thumb.className = "thumb";
    thumb.href = `./productView.html?id=${encodeURIComponent(p.id)}`;
    thumb.style.cssText =
      "display: block; text-align: center; margin-bottom: 10px;";

    if (img) {
      thumb.innerHTML = `<img src="${img}" alt="${
        p.title || ""
      }" style="max-width: 100%; height: 200px; object-fit: cover;">`;
    } else {
      thumb.innerHTML =
        '<div style="height: 200px; display: flex; align-items: center; justify-content: center; background: #f0f0f0;">🛍️</div>';
    }

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("a");
    title.className = "title";
    title.href = thumb.href;
    title.textContent = p.title || p.name || `Product #${p.id}`;
    title.style.cssText =
      "display: block; font-weight: bold; margin-bottom: 5px; text-decoration: none; color: #333;";

    const priceDiv = document.createElement("div");
    priceDiv.className = "price";
    priceDiv.style.cssText = "margin-bottom: 10px; font-size: 1.1em;";

    if (price.old) {
      priceDiv.innerHTML = `
        <span style="color: #28a745;">${formatCurrencyFromUSD(
          price.current
        )}</span>
        <span style="text-decoration: line-through; color: #999; margin-left: 10px;">${formatCurrencyFromUSD(
          price.old
        )}</span>
      `;
    } else {
      priceDiv.innerHTML = `<span>${formatCurrencyFromUSD(
        price.current
      )}</span>`;
    }

    // Добавляем категорию если есть
    if (p.nameEn || p.categoryName) {
      const categoryDiv = document.createElement("div");
      categoryDiv.className = "category";
      categoryDiv.textContent = p.nameEn || p.categoryName;
      categoryDiv.style.cssText =
        "font-size: 0.85rem; color: #666; margin-bottom: 10px;";
      body.appendChild(categoryDiv);
    }

    const actions = document.createElement("div");
    actions.className = "card-actions";
    actions.style.cssText = "display: flex; gap: 10px;";

    const viewBtn = document.createElement("a");
    viewBtn.className = "btn-view";
    viewBtn.href = thumb.href;
    viewBtn.textContent = "View";
    viewBtn.style.cssText =
      "padding: 5px 10px; background: #007bff; color: white; text-decoration: none; border-radius: 3px;";

    const addBtn = document.createElement("button");
    addBtn.className = "btn-add";
    addBtn.textContent = "Add to Cart";
    addBtn.style.cssText =
      "padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer;";

    addBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const cartItem = {
        productId: p.id,
        variantId:
          p.variants && p.variants.length > 0 ? p.variants[0].id : null,
        storeId: p.storeId,
        title: p.title || p.name,
        basePriceUSD: p.basePriceUSD,
        salePriceUSD: p.salePriceUSD,
        qty: 1,
      };
      addToCart(cartItem);
    });

    actions.appendChild(viewBtn);
    actions.appendChild(addBtn);

    body.appendChild(title);
    body.appendChild(priceDiv);
    body.appendChild(actions);

    card.appendChild(thumb);
    card.appendChild(body);

    grid.appendChild(card);
  });
}

// -------- Filters & sorting --------
function applyFiltersTo(list) {
  const onlySale = $$("#onlySale")?.checked || false;
  const minP = parseFloat($$("#minPrice")?.value) || 0;
  const maxP = parseFloat($$("#maxPrice")?.value) || Infinity;

  let filtered = list.slice();

  if (onlySale) {
    filtered = filtered.filter((p) => {
      const { current, old } = computePriceUSD(p);
      return old != null && current < old;
    });
  }

  filtered = filtered.filter((p) => {
    const { current } = computePriceUSD(p);
    return current >= minP && current <= maxP;
  });

  const sortBy = $$("#sortSel")?.value || "popular";

  switch (sortBy) {
    case "priceAsc":
      filtered.sort(
        (a, b) => computePriceUSD(a).current - computePriceUSD(b).current
      );
      break;
    case "priceDesc":
      filtered.sort(
        (a, b) => computePriceUSD(b).current - computePriceUSD(a).current
      );
      break;
    case "titleAsc":
      filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      break;
    case "titleDesc":
      filtered.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
      break;
  }

  return filtered;
}

// -------- Init --------
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Page loaded, initializing...");

  renderCartBadge();

  const grid = $$("#productsGrid");
  if (grid) {
    grid.innerHTML =
      '<div style="text-align: center; padding: 20px;">Loading products...</div>';
  } else {
    console.error("Element with id 'productsGrid' not found");
  }

  try {
    const products = await fetchAllProducts();
    console.log(`Fetched ${products.length} products`);

    if (products.length === 0) {
      console.warn("No products fetched, check API connection");
    }

    renderGrid(products);

    // Настройка фильтров
    const applyBtn = $$("#applyFilters");
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        renderGrid(applyFiltersTo(products));
      });
    }

    const clearBtn = $$("#clearFilters");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if ($$("#onlySale")) $$("#onlySale").checked = false;
        if ($$("#minPrice")) $$("#minPrice").value = "";
        if ($$("#maxPrice")) $$("#maxPrice").value = "";
        if ($$("#sortSel")) $$("#sortSel").value = "popular";
        renderGrid(products);
      });
    }

    const sortSel = $$("#sortSel");
    if (sortSel) {
      sortSel.addEventListener("change", () => {
        renderGrid(applyFiltersTo(products));
      });
    }

    // Currency change handler
    window.onCurrencyChange = () => {
      try {
        renderGrid(applyFiltersTo(products));
      } catch (e) {
        console.error("Error on currency change:", e);
      }
    };
  } catch (error) {
    console.error("Error initializing page:", error);
    if (grid) {
      grid.innerHTML =
        '<div style="text-align: center; padding: 20px; color: red;">Error loading products. Please check console for details.</div>';
    }
  }
});

// Debug helper
window.debugAPI = async function () {
  console.log("=== API Debug ===");
  console.log("Base URL:", API_BASE);
  console.log("Context:", API_CONTEXT);

  const testUrls = [
    `${API_BASE}${API_CONTEXT}/api/products/all-products`,
    `${API_BASE}/api/products/all-products`,
  ];

  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const res = await fetch(url);
      console.log(`Status: ${res.status}`);
      console.log(`Headers:`, res.headers);
      if (res.ok) {
        const data = await res.json();
        console.log(`Success! Data:`, data);
        return data;
      }
    } catch (e) {
      console.error(`Failed: ${e.message}`);
    }
  }
};
