// -------- API base --------
const API_BASE = "http://116.203.51.133:9090"; // Укажите правильный порт
const API_CONTEXT = "/luxmart"; // Контекстный путь

// -------- Helpers --------
const $$ = (sel, root = document) => root.querySelector(sel);
const $$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// -------- User management (для корзины) --------
function getOrCreateUserId() {
  let userId = localStorage.getItem("guestUserId");
  if (!userId) {
    // Генерируем временный ID для гостя (большое число, чтобы не пересекалось с реальными)
    userId = "999" + Date.now().toString();
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
  async addItem(productId, size = null, quantity = 1) {
    const userId = getOrCreateUserId();
    try {
      const response = await fetch(`${API_BASE}${API_CONTEXT}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Id": userId,
        },
        body: JSON.stringify({
          productId: productId,
          size: size,
          quantity: quantity,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Item added to cart:", data);
      updateCartBadge();
      return data;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  },

  async getCart() {
    const userId = getOrCreateUserId();
    try {
      const response = await fetch(`${API_BASE}${API_CONTEXT}/api/cart/get`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Id": userId,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Корзина не найдена - возвращаем пустую
          return {
            cartId: null,
            userId: userId,
            items: [],
            totalPrice: 0,
            totalItemsCount: 0,
          };
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching cart:", error);
      return {
        cartId: null,
        userId: userId,
        items: [],
        totalPrice: 0,
        totalItemsCount: 0,
      };
    }
  },
};

// -------- Cart badge update --------
async function updateCartBadge() {
  try {
    const cart = await CartAPI.getCart();
    const badge = $$("#cartBadge");
    if (badge) {
      const count = cart.totalItemsCount || 0;
      badge.textContent = count > 0 ? String(count) : "0";
      if (count > 0) {
        badge.style.display = "inline-block";
      } else {
        badge.style.display = "none";
      }
    }
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
  console.log("Fetching products...");

  const endpoints = [
    `${API_BASE}${API_CONTEXT}/api/products/all-products`,
    `${API_BASE}${API_CONTEXT}/api/products/public`,
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

      console.log(`Response status: ${res.status}`);

      if (!res.ok) {
        console.warn(`HTTP ${res.status} for ${url}`);
        continue;
      }

      const data = await res.json();
      console.log("Products fetched:", data);

      // Проверяем структуру ответа
      let products = [];
      if (Array.isArray(data)) {
        products = data;
      } else if (data && typeof data === "object") {
        products =
          data.data || data.content || data.items || data.products || [];
      }

      if (products.length > 0) {
        console.log(`Found ${products.length} products`);
        return products;
      }
    } catch (err) {
      console.error(`Error fetching from ${url}:`, err);
    }
  }

  console.warn("No products found");
  return [];
}

// -------- Get first image --------
function firstImage(p) {
  let images = [];

  if (Array.isArray(p.imageUrls)) {
    images = p.imageUrls;
  } else if (Array.isArray(p.images)) {
    images = p.images;
  } else if (typeof p.imageUrl === "string") {
    images = [p.imageUrl];
  } else if (typeof p.imageUrls === "string") {
    images = [p.imageUrls];
  }

  return images.length > 0 ? normalizeImg(images[0]) : "";
}

// -------- Render product grid --------
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

  list.forEach((p) => {
    const price = computePriceUSD(p);
    const img = firstImage(p);

    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText =
      "border: 1px solid #ddd; padding: 15px; margin: 10px; border-radius: 8px; background: white;";

    const thumb = document.createElement("a");
    thumb.className = "thumb";
    thumb.href = `./productView.html?id=${encodeURIComponent(p.id)}`;
    thumb.style.cssText =
      "display: block; text-align: center; margin-bottom: 10px;";

    if (img) {
      thumb.innerHTML = `<img src="${img}" alt="${
        p.title || ""
      }" style="max-width: 100%; height: 200px; object-fit: cover; border-radius: 4px;">`;
    } else {
      thumb.innerHTML =
        '<div style="height: 200px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; border-radius: 4px; font-size: 3em;">🛍️</div>';
    }

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("a");
    title.className = "title";
    title.href = thumb.href;
    title.textContent = p.title || `Product #${p.id}`;
    title.style.cssText =
      "display: block; font-weight: 600; margin-bottom: 8px; text-decoration: none; color: #333; font-size: 1.1em;";

    const priceDiv = document.createElement("div");
    priceDiv.className = "price";
    priceDiv.style.cssText =
      "margin-bottom: 10px; font-size: 1.2em; color: #2c3e50;";

    if (price.old) {
      priceDiv.innerHTML = `
        <span style="color: #27ae60; font-weight: bold;">${formatCurrencyFromUSD(
          price.current
        )}</span>
        <span style="text-decoration: line-through; color: #95a5a6; margin-left: 10px; font-size: 0.9em;">${formatCurrencyFromUSD(
          price.old
        )}</span>
      `;
    } else {
      priceDiv.innerHTML = `<span style="font-weight: bold;">${formatCurrencyFromUSD(
        price.current
      )}</span>`;
    }

    // Категория
    if (p.nameEn || p.categoryName) {
      const categoryDiv = document.createElement("div");
      categoryDiv.className = "category";
      categoryDiv.textContent = p.nameEn || p.categoryName;
      categoryDiv.style.cssText =
        "font-size: 0.9em; color: #7f8c8d; margin-bottom: 10px;";
      body.appendChild(categoryDiv);
    }

    // Выбор размера (если есть варианты)
    let sizeSelect = null;
    if (p.variants && p.variants.length > 0) {
      const sizeDiv = document.createElement("div");
      sizeDiv.style.cssText = "margin-bottom: 10px;";

      const sizeLabel = document.createElement("label");
      sizeLabel.textContent = "Size: ";
      sizeLabel.style.cssText = "font-size: 0.9em; margin-right: 5px;";

      sizeSelect = document.createElement("select");
      sizeSelect.style.cssText =
        "padding: 5px; border: 1px solid #ddd; border-radius: 4px;";
      sizeSelect.innerHTML = '<option value="">Select size</option>';

      p.variants.forEach((v) => {
        if (v.size && v.stockQuantity > 0) {
          const option = document.createElement("option");
          option.value = v.size;
          option.textContent = `${v.size} (${v.stockQuantity} in stock)`;
          sizeSelect.appendChild(option);
        }
      });

      sizeDiv.appendChild(sizeLabel);
      sizeDiv.appendChild(sizeSelect);
      body.appendChild(sizeDiv);
    }

    const actions = document.createElement("div");
    actions.className = "card-actions";
    actions.style.cssText = "display: flex; gap: 10px; margin-top: 10px;";

    const viewBtn = document.createElement("a");
    viewBtn.className = "btn-view";
    viewBtn.href = thumb.href;
    viewBtn.textContent = "View Details";
    viewBtn.style.cssText =
      "padding: 8px 16px; background: #3498db; color: white; text-decoration: none; border-radius: 4px; font-size: 0.9em; text-align: center; flex: 1;";

    const addBtn = document.createElement("button");
    addBtn.className = "btn-add";
    addBtn.textContent = "Add to Cart";
    addBtn.style.cssText =
      "padding: 8px 16px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em; flex: 1;";

    addBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      // Получаем размер, если есть селектор
      let selectedSize = null;
      if (sizeSelect) {
        selectedSize = sizeSelect.value;
        if (!selectedSize) {
          alert("Please select a size");
          return;
        }
      }

      try {
        await CartAPI.addItem(p.id, selectedSize, 1);
        alert(
          `Added to cart: ${p.title}${
            selectedSize ? ` (Size: ${selectedSize})` : ""
          }`
        );
      } catch (error) {
        alert("Error adding to cart. Please try again.");
        console.error(error);
      }
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

// -------- Initialize page --------
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Page loaded, initializing...");

  // Инициализируем userId для гостя
  const userId = getOrCreateUserId();
  console.log("User ID:", userId);

  // Обновляем бейдж корзины
  await updateCartBadge();

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

// -------- Глобальные функции для работы с корзиной --------
window.cart = {
  async add(productId, size = null, quantity = 1) {
    return await CartAPI.addItem(productId, size, quantity);
  },

  async getCart() {
    return await CartAPI.getCart();
  },

  async getCount() {
    const cart = await CartAPI.getCart();
    return cart.totalItemsCount || 0;
  },
};

// -------- Debug helper --------
window.debugAPI = async function () {
  console.log("=== API Debug ===");
  console.log("Base URL:", API_BASE);
  console.log("Context:", API_CONTEXT);
  console.log("User ID:", getOrCreateUserId());

  // Тест корзины
  try {
    console.log("\n--- Testing Cart API ---");
    const cart = await CartAPI.getCart();
    console.log("Cart:", cart);
  } catch (e) {
    console.error("Cart API error:", e);
  }

  // Тест продуктов
  try {
    console.log("\n--- Testing Products API ---");
    const products = await fetchAllProducts();
    console.log(`Products count: ${products.length}`);
    if (products.length > 0) {
      console.log("Sample product:", products[0]);
    }
  } catch (e) {
    console.error("Products API error:", e);
  }
};
