const API_BASE = "http://116.203.51.133/luxmart";

/* helpers */
function q(sel) {
  return document.querySelector(sel);
}
function fmtUSD(v) {
  if (v == null) return "";
  const n = Number(v);
  return isFinite(n) ? `$${n.toFixed(2)}` : "";
}
function pricePair(p) {
  const base = Number(p.basePriceUSD ?? 0);
  const sale = p.salePriceUSD != null ? Number(p.salePriceUSD) : null;
  if (sale != null && isFinite(sale) && sale > 0 && sale < base)
    return { current: fmtUSD(sale), old: fmtUSD(base) };
  return { current: fmtUSD(base), old: "" };
}
function normalizeImg(src) {
  if (!src) return "";
  const s = String(src).trim();
  if (/^(https?:)?\/\//i.test(s) || /^data:/i.test(s)) return s;
  return `${API_BASE}/${s.replace(/^\/+/, "")}`;
}

/* simple cart */
const CART_KEY = "cart";
const Cart = {
  _read() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
      return [];
    }
  },
  _write(x) {
    localStorage.setItem(CART_KEY, JSON.stringify(x));
  },
  add(item) {
    const it = this._read();
    it.push(item);
    this._write(it);
    this.renderBadge();
  },
  count() {
    return this._read().length;
  },
  renderBadge() {
    const el = q("#cartBadge");
    if (el) el.textContent = String(this.count());
  },
};

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  Cart.renderBadge();

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (!id) {
    q("#productView").innerHTML = "<p>Product not found.</p>";
    return;
  }

  try {
    const p = await getJSON(
      `${API_BASE}/api/products/${encodeURIComponent(id)}`
    );

    // Build gallery
    const imgs = Array.isArray(p.imageUrls)
      ? p.imageUrls.map(normalizeImg)
      : [];
    const main = imgs[0] || "";
    const gallery = `
      <div class="gallery">
        <div class="gallery-main" id="gMain">${
          main ? `<img src="${main}" alt="${p.title}">` : "🛍️"
        }</div>
        <div class="gallery-thumbs" id="gThumbs">${imgs
          .map(
            (url, idx) =>
              `<div class="thumb ${
                idx === 0 ? "active" : ""
              }" data-src="${url}"><img src="${url}" alt=""></div>`
          )
          .join("")}
        </div>
      </div>`;

    // Pricing
    const pr = pricePair(p);

    // Variants (size + stockQuantity)
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const options = variants
      .map((v) => {
        const stock = Number(v.stockQuantity ?? v.stock ?? 0);
        const disabled = stock <= 0 ? "disabled" : "";
        const label = `${v.size ?? ""} — stock: ${stock}`;
        return `<option value="${v.id}" ${disabled}>${label}</option>`;
      })
      .join("");

    const info = `
      <div class="info">
        <h1>${p.title}</h1>
        <div class="priceRow">
          <span class="price">${pr.current}</span>
          ${pr.old ? `<span class="old">${pr.old}</span>` : ""}
        </div>
        ${p.description ? `<p class="desc">${p.description}</p>` : ""}

        <div class="controls">
          ${
            variants.length
              ? `
            <div class="select">
              <label for="variantSel">Size</label>
              <select id="variantSel">${options}</select>
            </div>`
              : ""
          }

          <div class="actions">
            <button id="addToCart" class="btn btn-primary">Add to cart</button>
          </div>
        </div>
      </div>`;

    q("#productView").innerHTML = `
      <div class="product">
        ${gallery}
        ${info}
      </div>`;

    // Thumbs click
    const gMain = q("#gMain");
    qAll("#gThumbs .thumb").forEach((el) => {
      el.addEventListener("click", () => {
        qAll("#gThumbs .thumb").forEach((x) => x.classList.remove("active"));
        el.classList.add("active");
        const src = el.getAttribute("data-src");
        gMain.innerHTML = src ? `<img src="${src}" alt="${p.title}">` : "🛍️";
      });
    });

    // Add to cart
    q("#addToCart").addEventListener("click", () => {
      const sel = q("#variantSel");
      const vId = sel ? sel.value : null;
      const v =
        (variants || []).find((x) => String(x.id) === String(vId)) || {};
      Cart.add({
        productId: p.id,
        variantId: v.id || null,
        title: p.title,
        size: v.size,
        basePriceUSD: p.basePriceUSD, // у варианта цен нет — используем цену товара
        salePriceUSD: p.salePriceUSD,
        qty: 1,
      });
      alert("Added");
    });

    // Similar (по категории, если есть; иначе по storeId)
    try {
      let similar = [];
      if (p.categoryId != null) {
        try {
          const list = await getJSON(
            `${API_BASE}/api/products/category/${encodeURIComponent(
              p.categoryId
            )}`
          );
          similar = (Array.isArray(list) ? list : [])
            .filter((x) => String(x.id) !== String(p.id))
            .slice(0, 12);
        } catch {
          const all = await getJSON(`${API_BASE}/api/products/all-products`);
          similar = (Array.isArray(all) ? all : [])
            .filter(
              (x) =>
                String(x.categoryId) === String(p.categoryId) &&
                String(x.id) !== String(p.id)
            )
            .slice(0, 12);
        }
      } else {
        // Фоллбек: по тому же магазину
        const all = await getJSON(`${API_BASE}/api/products/all-products`);
        similar = (Array.isArray(all) ? all : [])
          .filter(
            (x) =>
              String(x.storeId) === String(p.storeId) &&
              String(x.id) !== String(p.id)
          )
          .slice(0, 12);
      }

      const sRow = q("#similarRow");
      sRow.innerHTML = "";
      similar.forEach((sp) => {
        const pair = pricePair(sp);
        const img =
          sp.imageUrls && sp.imageUrls.length
            ? normalizeImg(sp.imageUrls[0])
            : "";
        const a = document.createElement("a");
        a.className = "card";
        a.href = `./productView.html?id=${encodeURIComponent(sp.id)}`;
        a.innerHTML = `
          <div class="thumb">${
            img ? `<img src="${img}" alt="${sp.title}">` : "🛍️"
          }</div>
          <div class="body">
            <div class="title">${sp.title}</div>
            <div class="priceRow"><span class="price">${pair.current}</span> ${
          pair.old ? `<span class="old">${pair.old}</span>` : ""
        }</div>
          </div>`;
        sRow.appendChild(a);
      });
    } catch (e) {
      /* ignore similar errors */
    }
  } catch (e) {
    q("#productView").innerHTML = "<p>Product not found or failed to load.</p>";
    console.error(e);
  }

  function qAll(sel) {
    return Array.from(document.querySelectorAll(sel));
  }
});
