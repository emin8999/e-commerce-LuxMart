// OurStores.js - CORS və backend inteqrasiya problemlərinin həlli
document.addEventListener("DOMContentLoaded", function () {
  // ===== KONFİQURASİYA =====
  const API_CONFIG = {
    baseURL: "http://116.203.51.133/luxmart",
    endpoints: {
      allStores: "/store/all-stores",
    },
  };

  // ===== HELPER FUNKSIYALARI =====
  function getElement(id) {
    return document.getElementById(id);
  }

  function getJwtToken() {
    try {
      return localStorage.getItem("Jwt");
    } catch (error) {
      console.warn("JWT token alınmadı:", error);
      return null;
    }
  }

  function createRequestHeaders() {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // CORS üçün əlavə header-lər
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";

    const token = getJwtToken();
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }

    return headers;
  }

  // Image URL normallaşdırma
  function normalizeImageUrl(imageUrl) {
    if (!imageUrl) return "";

    const url = String(imageUrl).trim();

    // Əgər tam URL-dirsə, olduğu kimi qaytar
    if (/^(https?:)?\/\//i.test(url) || /^data:/i.test(url)) {
      return url;
    }

    // Əks halda, base URL əlavə et
    const baseUrl = API_CONFIG.baseURL.replace(/\/$/, "");
    return baseUrl + "/" + url.replace(/^\/+/, "");
  }

  // Product-dan birinci şəkli götürmə
  function getFirstProductImage(product) {
    if (!product) return "";

    // Müxtəlif image field-ləri yoxla
    if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
      return normalizeImageUrl(product.imageUrls[0]);
    }

    if (Array.isArray(product.images) && product.images.length > 0) {
      return normalizeImageUrl(product.images[0]);
    }

    if (product.image) {
      return normalizeImageUrl(product.image);
    }

    if (product.imageUrl) {
      return normalizeImageUrl(product.imageUrl);
    }

    return "";
  }

  // Qiymət formatlaşdırma
  function formatPrice(price) {
    if (price == null || isNaN(price)) {
      return "Qiymət yoxdur";
    }

    const numPrice = Number(price);
    return numPrice.toFixed(2) + " ₼";
  }

  // ===== API ÇAĞIRILARI =====
  async function fetchStoresFromAPI() {
    console.log("Store-lar API-dən yüklənir...");

    const storesURL = API_CONFIG.baseURL + API_CONFIG.endpoints.allStores;

    try {
      // CORS problemini həll etmək üçün mode: 'cors' əlavə edirik
      const response = await fetch(storesURL, {
        method: "GET",
        mode: "cors", // CORS rejimi
        credentials: "omit", // Cookie-ləri göndərmə
        headers: createRequestHeaders(),
      });

      console.log("API Response Status:", response.status);
      console.log("API Response Headers:", response.headers);

      if (!response.ok) {
        throw new Error(
          "API xətası: " + response.status + " - " + response.statusText
        );
      }

      const responseData = await response.json();
      console.log("API-dən alınan raw data:", responseData);

      // Backend response formatını müəyyən etmə
      let storesArray = [];

      if (Array.isArray(responseData)) {
        storesArray = responseData;
      } else if (responseData.stores && Array.isArray(responseData.stores)) {
        storesArray = responseData.stores;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        storesArray = responseData.data;
      } else if (responseData.content && Array.isArray(responseData.content)) {
        storesArray = responseData.content;
      }

      if (!Array.isArray(storesArray)) {
        throw new Error("Stores məlumatı array formatında deyil");
      }

      console.log("Parsed stores array:", storesArray);

      // localStorage-ə yadda saxla
      try {
        localStorage.setItem("stores_cache", JSON.stringify(storesArray));
        localStorage.setItem("stores_cache_timestamp", Date.now().toString());
      } catch (error) {
        console.warn("localStorage-ə yazıla bilmədi:", error);
      }

      return storesArray;
    } catch (error) {
      console.error("Store-ları API-dən yükləmək mümkün olmadı:", error);
      throw error;
    }
  }

  // Bütün məhsulları yüklə və mağaza üzrə qrupla
  async function fetchAllProductsGroupedByStore() {
    try {
      const res = await fetch(`${API_CONFIG.baseURL}/api/products/all-products`, {
        method: "GET",
        headers: createRequestHeaders(),
      });
      if (!res.ok) return new Map();
      const data = await res.json();
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const map = new Map();
      list.forEach((p) => {
        const sid = p.storeId ?? p.store_id ?? p.store?.id;
        if (sid == null) return;
        const key = String(sid);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(p);
      });
      return map;
    } catch (_) {
      return new Map();
    }
  }

  // Cache-dən store-ları götürmə
  function getStoresFromCache() {
    try {
      const cachedStores = localStorage.getItem("stores_cache");
      const cacheTimestamp = localStorage.getItem("stores_cache_timestamp");

      if (!cachedStores || !cacheTimestamp) {
        return [];
      }

      // 1 saatlıq cache (3600000 ms)
      const cacheAge = Date.now() - parseInt(cacheTimestamp);
      if (cacheAge > 3600000) {
        console.log("Cache köhnədir, təmizlənir");
        localStorage.removeItem("stores_cache");
        localStorage.removeItem("stores_cache_timestamp");
        return [];
      }

      return JSON.parse(cachedStores);
    } catch (error) {
      console.warn("Cache-dən oxumaq mümkün olmadı:", error);
      return [];
    }
  }

  // ===== RENDER FUNKSIYALARI =====
  function createProductCard(product) {
    const productImage = getFirstProductImage(product);
    const productName =
      product.name || product.title || product.productName || "Məhsul";
    const productPrice = formatPrice(
      product.price || product.basePriceUSD || product.priceUSD
    );

    const cardElement = document.createElement("div");
    cardElement.className = "product-card";

    cardElement.innerHTML = `
      <div class="product-image">
        ${
          productImage
            ? '<img src="' +
              productImage +
              '" alt="' +
              productName +
              "\" onerror=\"this.style.display='none'; this.nextElementSibling.style.display='flex';\">" +
              '<div class="no-image" style="display:none;">📦</div>'
            : '<div class="no-image">📦</div>'
        }
      </div>
      <div class="product-info">
        <h4 class="product-name">${productName}</h4>
        <p class="product-price">${productPrice}</p>
      </div>`;

    // Product click handler
    cardElement.addEventListener("click", function (event) {
      event.stopPropagation();

      try {
        localStorage.setItem("selectedProduct", JSON.stringify(product));
        window.location.href =
          "./productView.html?id=" +
          encodeURIComponent(product.id || product.productId || "");
      } catch (error) {
        console.error("Product selection xətası:", error);
      }
    });

    return cardElement;
  }

  function createStoreSection(store, productsByStore) {
    const storeName =
      store.storeName || store.name || store.shopName || "Naməlum Mağaza";
    let storeProducts = Array.isArray(store.products)
      ? store.products
      : Array.isArray(store.items)
      ? store.items
      : [];
    // Əgər backend mağaza içində məhsulları göndərmirsə, ümumi siyahıdan götür
    if (!storeProducts || storeProducts.length === 0) {
      const sid =
        store.id ?? store.storeId ?? store.store_id ?? (store.store && store.store.id);
      if (sid != null) {
        const key = String(sid);
        if (productsByStore && productsByStore.has(key)) {
          storeProducts = productsByStore.get(key);
        }
      }
    }

    const storeElement = document.createElement("div");
    storeElement.className = "store-section";
    storeElement.setAttribute("data-store-id", store.id || "");
    storeElement.setAttribute("data-store-name", storeName);

    const storeHeader = document.createElement("div");
    storeHeader.className = "store-header";
    storeHeader.innerHTML = `
      <h2 class="store-title">${storeName}</h2>
      <p class="store-info">${storeProducts.length} məhsul</p>
    `;

    const productsContainer = document.createElement("div");
    productsContainer.className = "products-container";

    if (storeProducts.length > 0) {
      const productsGrid = document.createElement("div");
      productsGrid.className = "products-grid";

      // Maksimum 8 məhsul göstər
      const displayProducts = storeProducts.slice(0, 8);

      displayProducts.forEach((product) => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
      });

      productsContainer.appendChild(productsGrid);

      // Əgər 8-dən çox məhsul varsa, "Hamısını gör" düyməsi
      if (storeProducts.length > 8) {
        const seeAllButton = document.createElement("button");
        seeAllButton.className = "see-all-btn";
        seeAllButton.textContent = `Hamısını gör (${storeProducts.length})`;

        seeAllButton.addEventListener("click", function (event) {
          event.stopPropagation();
          localStorage.setItem("selectedStore", JSON.stringify(store));
          window.location.href =
            "./storePage.html?storeId=" + encodeURIComponent(store.id || "");
        });

        productsContainer.appendChild(seeAllButton);
      }
    } else {
      productsContainer.innerHTML =
        '<p class="no-products">Bu mağazada hələ məhsul yoxdur</p>';
    }

    storeElement.appendChild(storeHeader);
    storeElement.appendChild(productsContainer);

    // Store click handler
    storeHeader.addEventListener("click", function () {
      try {
        localStorage.setItem("selectedStore", JSON.stringify(store));
        window.location.href =
          "./storePage.html?storeId=" + encodeURIComponent(store.id || "");
      } catch (error) {
        console.error("Store selection xətası:", error);
      }
    });

    return storeElement;
  }

  function renderStores(stores, productsByStore) {
    const container = getElement("storesSlider");
    if (!container) {
      console.error("storesSlider elementi tapılmadı!");
      return;
    }

    container.innerHTML = "";

    if (!stores || stores.length === 0) {
      container.innerHTML = `
        <div class="no-stores">
          <h3>Hal-hazırda mağaza mövcud deyil</h3>
          <p>Yaxın zamanda yeni mağazalar əlavə ediləcək</p>
        </div>`;
      return;
    }

    console.log("Render ediləcək store sayı:", stores.length);

    stores.forEach((store, index) => {
      try {
        const storeSection = createStoreSection(store, productsByStore);
        container.appendChild(storeSection);
        console.log(
          `Store ${index + 1} render edildi:`,
          store.storeName || store.name
        );
      } catch (error) {
        console.error(`Store ${index} render edilərkən xəta:`, error, store);
      }
    });
  }

  function showLoadingState() {
    const container = getElement("storesSlider");
    if (container) {
      container.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Mağazalar yüklənir...</p>
        </div>`;
    }
  }

  function showErrorState(errorMessage) {
    const container = getElement("storesSlider");
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <h3>⚠️ Xəta baş verdi</h3>
          <p>${errorMessage}</p>
          <button onclick="location.reload()" class="retry-btn">Yenidən cəhd et</button>
        </div>`;
    }
  }

  // ===== MAIN İNİSİALİZASİYA =====
  async function initializeStoresPage() {
    console.log("=== Stores səhifəsi başlanır ===");

    showLoadingState();

    let stores = [];
    let productsByStore = new Map();

    try {
      // Birinci cəhd: API-dən yükləmə
      const [s, pmap] = await Promise.all([
        fetchStoresFromAPI(),
        fetchAllProductsGroupedByStore(),
      ]);
      stores = s;
      productsByStore = pmap;
      console.log("API-dən store-lar yükləndi:", stores.length);
    } catch (apiError) {
      console.warn(
        "API-dən yükləmə uğursuz, cache-ə keçilir:",
        apiError.message
      );

      // İkinci cəhd: Cache-dən yükləmə
      stores = getStoresFromCache();

      if (stores.length === 0) {
        console.error(
          "Nə API-dən, nə də cache-dən store məlumatı alına bilmədi"
        );
        showErrorState(
          "Mağaza məlumatları yüklənə bilmədi. İnternet bağlantınızı yoxlayın və səhifəni yeniləyin."
        );
        return;
      } else {
        console.log("Cache-dən store-lar yükləndi:", stores.length);
      }
    }

    // Stores-u render et
    renderStores(stores, productsByStore);

    console.log("=== Stores səhifəsi hazır ===");
  }

  // Səhifə yüklənən kimi başla
  initializeStoresPage();
});
