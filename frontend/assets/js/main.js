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

  // Products catalog list (all stores)
  if (document.getElementById("productsList")) {
    const catBtn = document.getElementById('openCategories');
    if (catBtn) {
      catBtn.addEventListener('click', () => {
        const modal = document.getElementById('catModal');
        if (modal) {
          modal.classList.add('show');
          if (window.renderCategories) window.renderCategories('catList');
        }
      });
    }
    try {
      const listRoot = document.getElementById("productsList");
      const params = new URLSearchParams(location.search);
      const cat = params.get('cat');
      let products = await fetch(`${API_BASE}/api/products`).then((r) => r.json());
      if (cat) {
        const catId = Number(cat);
        products = products.filter(p => Number(p.categoryId) === catId);
      }
      listRoot.innerHTML = "";
      products.forEach((p) => {
        const price = window.pricing.formatPair(
          window.pricing.computePriceUSD(p, {})
        );
        const card = document.createElement("div");
        card.className = "card product-card";
        const img = (p.imageUrls && p.imageUrls.length ? p.imageUrls[0] : "");
        card.innerHTML = `
          <a class="product-link" href="./product.html?id=${encodeURIComponent(p.id)}">
            <div class="product-thumb">${
              img
                ? `<img src="${img}" alt="${p.title}"/>`
                : `<div class='product-thumb__ph'>🛍️</div>`
            }</div>
            <div class="product-title"><strong>${p.title}</strong></div>
          </a>
          <div class="price">${price.current} ${
          price.old ? `<span class='old'>${price.old}</span>` : ""
        }</div>
          <button class="btn btn-primary add-to-cart" data-id="${p.id}">Add to cart</button>
        `;
        card.querySelector(".add-to-cart").addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.cart.add({
            productId: p.id,
            variantId: null,
            storeId: p.storeId,
            title: p.title,
            basePriceUSD: p.basePriceUSD,
            salePriceUSD: p.salePriceUSD,
            qty: 1,
          });
          if (window.renderCartBadge) window.renderCartBadge();
        });
        listRoot.appendChild(card);
      });
    } catch (e) {
      // noop
    }
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
    const img = (p.imageUrls && p.imageUrls.length ? p.imageUrls[0] : "");
    root.innerHTML = `<div class="card product-detail">
      <div class="product-detail__media">${
        img
          ? `<img src=\"${img}\" alt=\"${p.title}\"/>`
          : `<div class='product-thumb__ph product-detail__ph'>🛍️</div>`
      }</div>
      <div class="product-detail__info">
        <h2>${p.title}</h2>
        <div class="price">${price.current} ${
          price.old ? `<span class='old'>${price.old}</span>` : ""
        }</div>
        ${p.description ? `<p class=\"muted\">${p.description}</p>` : ""}
        ${(p.variants && p.variants.length)
          ? `<label>Size</label><select id=\"variantSel\">${options}</select>`
          : ""}
        <div style="margin-top:8px"><button id="addToCart" class="btn btn-primary">Add to cart</button></div>
      </div>
    </div>`;
    document.getElementById("addToCart").onclick = () => {
      const sel = document.getElementById("variantSel");
      const vId = sel ? sel.value : null;
      const v = (p.variants || []).find((x) => String(x.id) === String(vId)) || {};
      window.cart.add({
        productId: p.id,
        variantId: v.id || null,
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

    // Similar by category
    try {
      const all = await fetch(`${API_BASE}/api/products`).then((r) => r.json());
      const sim = all
        .filter((x) => x.categoryId === p.categoryId && x.id !== p.id)
        .slice(0, 12);
      const row = document.getElementById("similarRow");
      if (row) {
        row.innerHTML = "";
        sim.forEach((sp) => {
          const pr = window.pricing.formatPair(
            window.pricing.computePriceUSD(sp, {})
          );
          const a = document.createElement("a");
          a.className = "card product-card";
          a.href = `./product.html?id=${encodeURIComponent(sp.id)}`;
          const img2 = sp.imageUrls && sp.imageUrls.length ? sp.imageUrls[0] : "";
          a.innerHTML = `
            <div class="product-thumb">${
              img2
                ? `<img src=\"${img2}\" alt=\"${sp.title}\"/>`
                : `<div class='product-thumb__ph'>🛍️</div>`
            }</div>
            <div><strong>${sp.title}</strong></div>
            <div class="price">${pr.current} ${
              pr.old ? `<span class='old'>${pr.old}</span>` : ""
            }</div>`;
          row.appendChild(a);
        });
      }
    } catch (e) {
      // ignore
    }
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
