// ProductView.js - Düzəldilmiş versiya
// Backend API: http://116.203.51.133/luxmart/api

document.addEventListener("DOMContentLoaded", async function () {
  // ===== KONFİQURASİYA =====
  const API_BASE = "http://116.203.51.133/luxmart/api";
  const API_ENDPOINTS = {
    productById: function (id) {
      return API_BASE + "/products/public/" + encodeURIComponent(id);
    },
    allProducts: API_BASE + "/products/public",
    categoryProducts: function (categoryId) {
      return API_BASE + "/products/category/" + encodeURIComponent(categoryId);
    },
  };

  // ===== HELPER FUNKSIYALARI =====
  function getElement(selector) {
    return document.querySelector(selector);
  }

  function getAllElements(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function getJwtToken() {
    try {
      return localStorage.getItem("Jwt");
    } catch (error) {
      return null;
    }
  }

  function createApiHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    const token = getJwtToken();
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }

    return headers;
  }

  // Currency formatting
  function formatPrice(priceUSD) {
    const currency = window.currency?.getCurrency?.() || "USD";
    const symbol = window.currency?.symbol?.(currency) || "$";
    const converted =
      window.currency?.convertUSD?.(Number(priceUSD) || 0, currency) ||
      Number(priceUSD) ||
      0;
    return symbol + converted.toFixed(2);
  }

  // Price hesablaması (sale price vs normal price)
  function calculatePrice(product) {
    const basePrice = Number(product.basePriceUSD || 0);
    const salePrice =
      product.salePriceUSD != null ? Number(product.salePriceUSD) : null;
    const hasDiscount =
      salePrice != null && salePrice > 0 && salePrice < basePrice;

    return {
      currentPrice: hasDiscount ? salePrice : basePrice,
      oldPrice: hasDiscount ? basePrice : null,
    };
  }

  // Price HTML yaratma
  function createPriceHTML(product) {
    const prices = calculatePrice(product);
    const currentFormatted = formatPrice(prices.currentPrice);
    const oldFormatted = prices.oldPrice ? formatPrice(prices.oldPrice) : null;

    return (
      '<span class="price">' +
      currentFormatted +
      "</span>" +
      (oldFormatted
        ? ' <span class="old-price">' + oldFormatted + "</span>"
        : "")
    );
  }

  // Image URL normallaşdırma
  function normalizeImageUrl(imageUrl) {
    if (!imageUrl) return "";

    const url = String(imageUrl).trim();
    if (/^(https?:)?\/\//i.test(url) || /^data:/i.test(url)) {
      return url;
    }

    const baseUrl = API_BASE.replace(/\/api\/?$/, "");
    return baseUrl + "/" + url.replace(/^\/+/, "");
  }

  // Cart-a əlavə etmə
  function addToCart(item) {
    if (window.cart && typeof window.cart.add === "function") {
      window.cart.add(item);
      if (typeof window.renderCartBadge === "function") {
        window.renderCartBadge();
      }
    } else {
      // Fallback: localStorage
      const cartKey = "cart";
      let cartData;
      try {
        cartData = JSON.parse(localStorage.getItem(cartKey) || '{"items":[]}');
      } catch (error) {
        cartData = { items: [] };
      }
      cartData.items.push(item);
      localStorage.setItem(cartKey, JSON.stringify(cartData));

      const cartBadge = getElement("#cartBadge");
      if (cartBadge) {
        const totalQty = cartData.items.reduce(
          (sum, item) => sum + (item.qty || 1),
          0
        );
        cartBadge.textContent = String(totalQty);
      }
    }
  }

  // ===== API ÇAĞIRILARI =====
  async function fetchJSON(url) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: createApiHeaders(),
      });

      if (!response.ok) {
        throw new Error("HTTP " + response.status + ": " + response.statusText);
      }

      return await response.json();
    } catch (error) {
      console.error("API xətası:", error);
      throw error;
    }
  }

  // Product by ID alınması
  async function getProductById(productId) {
    try {
      // Birinci cəhd: specific endpoint
      const productData = await fetchJSON(API_ENDPOINTS.productById(productId));
      return productData;
    } catch (error) {
      console.warn("Product by ID endpoint uğursuz, fallback...");

      try {
        // İkinci cəhd: bütün products arasında axtarış
        const allProducts = await fetchJSON(API_ENDPOINTS.allProducts);
        const productList = Array.isArray(allProducts)
          ? allProducts
          : allProducts.content && Array.isArray(allProducts.content)
          ? allProducts.content
          : [];

        const foundProduct = productList.find(
          (p) => String(p.id) === String(productId)
        );
        if (!foundProduct) {
          throw new Error("Product tapılmadı");
        }

        return foundProduct;
      } catch (fallbackError) {
        console.error("Fallback də uğursuz:", fallbackError);
        throw new Error("Product yüklənə bilmədi");
      }
    }
  }

  // ===== PRODUCT DISPLAY =====
  function createGalleryHTML(product) {
    const images = Array.isArray(product.imageUrls)
      ? product.imageUrls.map(normalizeImageUrl)
      : [];
    const mainImage = images[0] || "";

    const galleryHTML = `
      <div class="gallery">
        <div class="gallery-main" id="galleryMain">
          ${
            mainImage
              ? '<img src="' +
                mainImage +
                '" alt="' +
                (product.title || "Product") +
                '">'
              : '<div class="no-image">🛍️</div>'
          }
        </div>
        <div class="gallery-thumbs" id="galleryThumbs">
          ${images
            .map(
              (url, index) =>
                '<div class="thumb ' +
                (index === 0 ? "active" : "") +
                '" data-src="' +
                url +
                '">' +
                '<img src="' +
                url +
                '" alt="">' +
                "</div>"
            )
            .join("")}
        </div>
      </div>`;

    return galleryHTML;
  }

  function createProductInfoHTML(product) {
    const priceHTML = createPriceHTML(product);
    const variants = Array.isArray(product.variants) ? product.variants : [];

    const variantOptions = variants
      .map((variant) => {
        const stock = Number(variant.stockQuantity || variant.stock || 0);
        const disabled = stock <= 0 ? "disabled" : "";
        const label = (variant.size || "Default") + " — Stok: " + stock;
        return (
          '<option value="' +
          variant.id +
          '" ' +
          disabled +
          ">" +
          label +
          "</option>"
        );
      })
      .join("");

    const infoHTML = `
      <div class="product-info">
        <h1>${product.title || "Unnamed Product"}</h1>
        <div class="price-section" id="priceSection">${priceHTML}</div>
        ${
          product.description
            ? '<p class="description">' + product.description + "</p>"
            : ""
        }

        <div class="product-controls">
          ${
            variants.length > 0
              ? `
            <div class="variant-selector">
              <label for="variantSelect">Ölçü seçin:</label>
              <select id="variantSelect">${variantOptions}</select>
            </div>`
              : ""
          }

          <div class="actions">
            <button id="addToCartBtn" class="btn btn-primary">Səbətə əlavə et</button>
          </div>
        </div>
      </div>`;

    return infoHTML;
  }

  // ===== EVENT HANDLERS =====
  function setupGalleryEvents(product) {
    const mainGallery = getElement("#galleryMain");
    const thumbs = getAllElements("#galleryThumbs .thumb");

    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", function () {
        thumbs.forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");

        const imageSrc = thumb.getAttribute("data-src");
        if (mainGallery && imageSrc) {
          mainGallery.innerHTML =
            '<img src="' +
            imageSrc +
            '" alt="' +
            (product.title || "Product") +
            '">';
        }
      });
    });
  }

  function setupAddToCartEvent(product) {
    const addToCartBtn = getElement("#addToCartBtn");
    if (!addToCartBtn) return;

    addToCartBtn.addEventListener("click", function () {
      const variantSelect = getElement("#variantSelect");
      const selectedVariantId = variantSelect ? variantSelect.value : null;

      const selectedVariant =
        (product.variants || []).find(
          (v) => String(v.id) === String(selectedVariantId)
        ) || {};

      const cartItem = {
        productId: product.id,
        variantId: selectedVariant.id || null,
        storeId: product.storeId || null,
        title: product.title,
        size: selectedVariant.size || null,
        basePriceUSD: product.basePriceUSD,
        salePriceUSD: product.salePriceUSD,
        qty: 1,
      };

      addToCart(cartItem);
      alert("Məhsul səbətə əlavə edildi!");
    });
  }

  // ===== SIMILAR PRODUCTS =====
  async function loadSimilarProducts(product) {
    try {
      let similarProducts = [];

      // Əgər category var isə, həmin kateqoriyadan məhsullar gətir
      if (product.categoryId) {
        try {
          const categoryProducts = await fetchJSON(
            API_ENDPOINTS.categoryProducts(product.categoryId)
          );
          similarProducts = (
            Array.isArray(categoryProducts) ? categoryProducts : []
          )
            .filter((p) => String(p.id) !== String(product.id))
            .slice(0, 12);
        } catch (error) {
          console.warn("Category products yüklənmədi, fallback...");
        }
      }

      // Əgər category products yox isə, eyni store-dan məhsullar gətir
      if (similarProducts.length === 0) {
        const allProducts = await fetchJSON(API_ENDPOINTS.allProducts);
        const productList = Array.isArray(allProducts)
          ? allProducts
          : allProducts.content && Array.isArray(allProducts.content)
          ? allProducts.content
          : [];

        similarProducts = productList
          .filter(
            (p) =>
              String(p.storeId) === String(product.storeId) &&
              String(p.id) !== String(product.id)
          )
          .slice(0, 12);
      }

      const similarRow = getElement("#similarRow");
      if (!similarRow) return;

      similarRow.innerHTML = "";

      similarProducts.forEach((similarProduct) => {
        const productImage =
          similarProduct.imageUrls && similarProduct.imageUrls.length
            ? normalizeImageUrl(similarProduct.imageUrls[0])
            : "";

        const productCard = document.createElement("a");
        productCard.className = "product-card";
        productCard.href =
          "./productView.html?id=" + encodeURIComponent(similarProduct.id);

        productCard.innerHTML = `
          <div class="card-image">
            ${
              productImage
                ? '<img src="' +
                  productImage +
                  '" alt="' +
                  similarProduct.title +
                  '">'
                : '<div class="no-image">🛍️</div>'
            }
          </div>
          <div class="card-body">
            <div class="card-title">${similarProduct.title}</div>
            <div class="card-price">${createPriceHTML(similarProduct)}</div>
          </div>`;

        similarRow.appendChild(productCard);
      });
    } catch (error) {
      console.error("Similar products yüklənmədi:", error);
    }
  }

  // ===== MAIN EXECUTION =====
  try {
    // Cart badge render et
    if (typeof window.renderCartBadge === "function") {
      window.renderCartBadge();
    }
  } catch (error) {
    console.warn("Cart badge render edilmədi:", error);
  }

  // URL-dən product ID-ni al
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (!productId) {
    getElement("#productView").innerHTML = "<p>Məhsul tapılmadı.</p>";
    return;
  }

  try {
    console.log("Product yüklənir, ID:", productId);

    // Product məlumatlarını yüklə
    const product = await getProductById(productId);
    console.log("Product yükləndi:", product);

    // Product view-ı yarat
    const galleryHTML = createGalleryHTML(product);
    const infoHTML = createProductInfoHTML(product);

    const productView = getElement("#productView");
    productView.innerHTML = `
      <div class="product-container">
        ${galleryHTML}
        ${infoHTML}
      </div>`;

    // Event listener-ləri quraşdır
    setupGalleryEvents(product);
    setupAddToCartEvent(product);

    // Similar products yüklə
    loadSimilarProducts(product);
  } catch (error) {
    console.error("Product yükləmə xətası:", error);
    getElement("#productView").innerHTML =
      "<p>Məhsul yüklənə bilmədi: " + error.message + "</p>";
  }

  // Currency dəyişiklikləri üçün handler
  window.onCurrencyChange = async function () {
    try {
      const currentProductId = new URLSearchParams(window.location.search).get(
        "id"
      );
      if (currentProductId) {
        const updatedProduct = await getProductById(currentProductId);
        const priceSection = getElement("#priceSection");
        if (priceSection) {
          priceSection.innerHTML = createPriceHTML(updatedProduct);
        }
      }
    } catch (error) {
      console.warn("Price update xətası:", error);
    }
  };
});
