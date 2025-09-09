const API_STORES_BASE = "http://116.203.51.133/luxmart";
const STORES_ENDPOINT = `${API_STORES_BASE}/store/all-stores`;

/* ----------------- helpers ----------------- */
async function fetchStores() {
  try {
    const res = await fetch(STORES_ENDPOINT, {
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error(`Stores fetch failed: ${res.status}`);

    const data = await res.json();
    console.log("Raw API data:", data);

    // Поддержка разных форматов ответа
    const stores = Array.isArray(data) ? data : data.stores || [];
    if (!Array.isArray(stores)) throw new Error("Stores must be an array");

    localStorage.setItem("stores", JSON.stringify(stores));
    return stores;
  } catch (err) {
    console.error("Error fetching stores:", err);
    throw err;
  }
}

function getLocalStores() {
  try {
    return JSON.parse(localStorage.getItem("stores") || "[]");
  } catch {
    return [];
  }
}

function firstImageOf(product) {
  if (!product) return "";
  if (Array.isArray(product.images) && product.images.length)
    return product.images[0];
  if (Array.isArray(product.imageUrls) && product.imageUrls.length)
    return product.imageUrls[0];
  return product.image || "";
}

/* ----------------- render ----------------- */
function renderStores(stores) {
  const container = document.getElementById("shopContainer");
  if (!container)
    return console.warn("No container found with id 'shopContainer'");

  container.innerHTML = "";

  if (!stores || stores.length === 0) {
    container.innerHTML = "<p style='padding:20px;'>No stores available.</p>";
    return;
  }

  stores.forEach((store) => {
    const storeName = store.storeName || store.name || "Unknown Store";
    const products = Array.isArray(store.products)
      ? store.products
      : store.items || [];

    const storeBox = document.createElement("div");
    storeBox.className = "store-box";
    storeBox.setAttribute("data-store", storeName);

    const storeHeader = document.createElement("h2");
    storeHeader.textContent = storeName;
    storeBox.appendChild(storeHeader);

    const sliderWrapper = document.createElement("div");
    sliderWrapper.className = "slider-wrapper";

    const leftButton = document.createElement("button");
    leftButton.innerHTML = "←";
    leftButton.className = "slider-btn left";

    const rightButton = document.createElement("button");
    rightButton.innerHTML = "→";
    rightButton.className = "slider-btn right";

    const productsWrapper = document.createElement("div");
    productsWrapper.className = "products-wrapper";

    products.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.className = "product-card";

      productCard.innerHTML = `
        <img src="${firstImageOf(product)}" alt="${
        product.name || "Product"
      }" />
        <p>${product.name || product.title || "Unnamed"}</p>
        <strong>${
          product.price != null ? product.price + " ₼" : "Price N/A"
        }</strong>
      `;

      productCard.addEventListener("click", (e) => {
        e.stopPropagation();
        localStorage.setItem("selectedProduct", JSON.stringify(product));
        window.location.href = "productVision.html";
      });

      productsWrapper.appendChild(productCard);
    });

    sliderWrapper.appendChild(leftButton);
    sliderWrapper.appendChild(productsWrapper);
    sliderWrapper.appendChild(rightButton);
    storeBox.appendChild(sliderWrapper);
    container.appendChild(storeBox);

    // Клик по магазину
    storeBox.addEventListener("click", () => {
      localStorage.setItem("selectedStore", storeName);
      window.location.href = "storePage.html";
    });

    // Прокрутка товаров
    const scrollAmount = 250;
    rightButton.addEventListener("click", (e) => {
      e.stopPropagation();
      productsWrapper.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });
    leftButton.addEventListener("click", (e) => {
      e.stopPropagation();
      productsWrapper.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });
  });
}

/* ----------------- init ----------------- */
(async function bootstrapStores() {
  let stores = [];
  try {
    stores = await fetchStores();
  } catch (e) {
    console.warn("Backend unavailable, using localStorage stores.", e);
    stores = getLocalStores();
  }
  console.log("Loaded stores:", stores);
  renderStores(stores);
})();
