const API_BASE = "http://116.203.51.133/luxmart";
document.addEventListener("DOMContentLoaded", async () => {
  // Render categories (modal & home grid)
  if (document.getElementById("categoriesGrid")) {
    window.renderCategories("categoriesGrid");
  }

  // Home feed (sale/best/fbt)
  try {
    const home = await fetch(`${API_BASE}/api/home`).then((r) => r.json());
    const sections = [
      { id: "saleRow", list: home.sale || [] },
      { id: "bestRow", list: home.best || [] },
      { id: "fbtRow", list: home.frequentlyTogether || [] },
    ];
    sections.forEach((sec) => {
      const root = document.getElementById(sec.id);
      if (!root) return;
      root.innerHTML = "";
      sec.list.forEach((p) => {
        const price = window.pricing.formatPair(
          window.pricing.computePriceUSD(p, {})
        );
        const el = document.createElement("a");
        el.className = "card";
        el.href = `./product.html?id=${encodeURIComponent(p.id)}`;
        el.innerHTML = `<div><strong>${p.title}</strong></div>
                        <div class="price">${price.current} ${
          price.old ? `<span class='old'>${price.old}</span>` : ""
        }</div>
                        <button class="btn btn-primary">View</button>`;
        root.appendChild(el);
      });
    });
  } catch (e) {}

  // Our Stores page
  if (document.getElementById("storesSlider")) {
    const stores = await fetch(`${API_BASE}/api/stores`)
      .then((r) => r.json())
      .catch(() => []);
    const products = await fetch(`${API_BASE}/api/products`)
      .then((r) => r.json())
      .catch(() => []);
    const wrap = document.getElementById("storesSlider");
    wrap.innerHTML = "";
    stores.forEach((s) => {
      const slide = document.createElement("div");
      slide.className = "store-slide";
      slide.innerHTML = `<div class="store-head"><div class="logo">${
        s.logo || "🏬"
      }</div><div><h3>${s.name}</h3></div></div>
                         <div class="carousel row"></div>`;
      const row = slide.querySelector(".row");
      products
        .filter((p) => p.storeId === s.id)
        .forEach((p) => {
          const price = window.pricing.formatPair(
            window.pricing.computePriceUSD(p, {})
          );
          const a = document.createElement("a");
          a.className = "card";
          a.href = `./product.html?id=${encodeURIComponent(p.id)}`;
          a.innerHTML = `<strong>${p.title}</strong>
                       <div class="price">${price.current} ${
            price.old ? `<span class='old'>${price.old}</span>` : ""
          }</div>`;
          row.appendChild(a);
        });
      wrap.appendChild(slide);
    });
  }

  // Product view
  if (document.getElementById("productView")) {
    const params = new URLSearchParams(location.search);
    const id = params.get("id") || "p1";
    const p = await fetch(`${API_BASE}/api/products/${id}`).then((r) =>
      r.json()
    );
    const root = document.getElementById("productView");
    const price = window.pricing.formatPair(
      window.pricing.computePriceUSD(p, {})
    );
    // Variants selector
    const options = (p.variants || [])
      .map(
        (v) =>
          `<option value="${v.id}" ${v.stock <= 0 ? "disabled" : ""}>${
            v.size
          } — stock: ${v.stock}</option>`
      )
      .join("");
    root.innerHTML = `<div class="card">
      <h2>${p.title}</h2>
      <div class="price">${price.current} ${
      price.old ? `<span class='old'>${price.old}</span>` : ""
    }</div>
      <label>Size</label>
      <select id="variantSel">${options}</select>
      <div><button id="addToCart" class="btn btn-primary">Add to cart</button></div>
    </div>`;
    document.getElementById("addToCart").onclick = () => {
      const vId = document.getElementById("variantSel").value;
      const v = (p.variants || []).find((x) => x.id === vId) || {};
      window.cart.add({
        productId: p.id,
        variantId: v.id || p.id,
        storeId: p.storeId,
        title: p.title,
        size: v.size,
        basePriceUSD: v.basePriceUSD ?? p.basePriceUSD,
        salePriceUSD: v.salePriceUSD ?? p.salePriceUSD,
        qty: 1,
      });
      alert("Added");
      if (window.renderCartBadge) window.renderCartBadge();
    };
  }

  // Cart page
  if (document.getElementById("cartView")) {
    window.renderCartPage();
    window.onCurrencyChange = window.renderCartPage;
  }

  // Checkout
  if (document.getElementById("summary")) {
    window.renderCheckout();
  }
});
