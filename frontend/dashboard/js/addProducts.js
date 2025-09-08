const API_BASE = "http://116.203.51.133/luxmart";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addProductForm");
  const wrapper = document.getElementById("sizeQuantitiesWrapper");
  const message = document.getElementById("addProductMessage");
  const storeNameInput = document.getElementById("productStore");
  const submitBtn = form ? form.querySelector('[type="submit"]') : null;
  const categorySelect = document.getElementById("productCategory");

  function setMsg(text, ok = false) {
    if (!message) return;
    message.textContent = text;
    message.style.color = ok ? "green" : "crimson";
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
  }

  function decodeJwtPayload(token) {
    try {
      const part = token.split(".")[1];
      const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "===".slice((base64.length + 3) % 4);
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  // ---------- SIZE BLOCKS ----------
  const sizeOptions = `
    <option value="">Size</option>
    <option value="TWO_XS">2XS</option>
    <option value="XS">XS</option>
    <option value="S">S</option>
    <option value="M">M</option>
    <option value="L">L</option>
    <option value="XL">XL</option>
    <option value="TWO_XL">2XL</option>
  `;

  function updateRemoveButtons() {
    if (!wrapper) return;
    const blocks = wrapper.querySelectorAll(".size-quantity-wrapper");
    const many = blocks.length > 1;
    blocks.forEach((blk) => {
      const btn = blk.querySelector(".remove-button");
      if (btn) btn.style.display = many ? "inline-block" : "none";
    });
  }

  function createSizeBlock() {
    const div = document.createElement("div");
    div.className = "size-quantity-wrapper";
    div.innerHTML = `
      <select name="productSizes" class="size-input">${sizeOptions}</select>
      <input type="number" name="quantities" class="quantity-input" placeholder="Quantity" min="0" step="1" />
      <input type="number" name="variantPrices" class="variant-price-input" placeholder="Variant price (USD)" min="0" step="0.01" />
      <button type="button" class="remove-button">X</button>
    `;
    return div;
  }

  function addSizeBlock() {
    if (!wrapper) return;
    const addBtn = wrapper.querySelector(".add-size-btn");
    const block = createSizeBlock();
    wrapper.insertBefore(block, addBtn);
    updateRemoveButtons();
  }

  function resetSizeBlocks() {
    if (!wrapper) return;
    wrapper.innerHTML = `
      <div class="size-quantity-wrapper">
        <select name="productSizes" class="size-input">${sizeOptions}</select>
        <input type="number" name="quantities" class="quantity-input" placeholder="Quantity" min="0" step="1"/>
        <input type="number" name="variantPrices" class="variant-price-input" placeholder="Variant price (USD)" min="0" step="0.01"/>
        <button type="button" class="remove-button" style="display:none;">X</button>
      </div>
      <input type="button" value="+" class="add-size-btn" aria-label="Add size" />
    `;
    updateRemoveButtons();
  }

  if (wrapper) {
    if (!wrapper.querySelector(".size-quantity-wrapper")) resetSizeBlocks();
    wrapper.addEventListener("click", (e) => {
      const addBtn = e.target.closest(".add-size-btn");
      const removeBtn = e.target.closest(".remove-button");
      if (addBtn) {
        addSizeBlock();
        return;
      }
      if (removeBtn) {
        const block = removeBtn.closest(".size-quantity-wrapper");
        if (block) {
          block.remove();
          updateRemoveButtons();
        }
      }
    });
  }

  // ---------- AUTH + STORE NAME ----------
  const storeJwt = localStorage.getItem("storeJwt");
  if (!storeJwt) {
    window.location.href = "storeLogin.html";
    return;
  }
  const decodedToken = decodeJwtPayload(storeJwt) || {};

  async function fillStoreName() {
    try {
      const resp = await fetch(`${API_BASE}/store/info`, {
        headers: { Authorization: `Bearer ${storeJwt}` },
      });
      if (resp.ok) {
        const dto = await resp.json();
        if (storeNameInput)
          storeNameInput.value =
            dto.storeName || dto.email || decodedToken.sub || "Unknown Store";
      } else {
        if (storeNameInput)
          storeNameInput.value = decodedToken.sub || "Unknown Store";
      }
    } catch {
      if (storeNameInput)
        storeNameInput.value = decodedToken.sub || "Unknown Store";
    }
  }
  fillStoreName();

  // ---------- CATEGORIES ----------
  async function populateCategories() {
    if (!categorySelect) return;
    try {
      categorySelect.innerHTML =
        '<option value="" disabled selected>Loading categories...</option>';
      const res = await fetch(`${API_BASE}/api/categories`);
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      categorySelect.innerHTML =
        '<option value="" disabled selected>Choose category</option>';
      const queue = [...list];
      while (queue.length) {
        const c = queue.shift();
        const opt = document.createElement("option");
        opt.value = String(c.id);
        opt.textContent = c.nameEn || c.slug || `Category #${c.id}`;
        categorySelect.appendChild(opt);
        if (c.subcategories && c.subcategories.length)
          c.subcategories.forEach((sc) => queue.push(sc));
      }
    } catch (e) {
      console.warn("Categories load failed", e);
    }
  }
  populateCategories();

  // ---------- SUBMIT ----------
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg("");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.orig = submitBtn.textContent || submitBtn.value || "";
      if ("textContent" in submitBtn) submitBtn.textContent = "Saving...";
      if ("value" in submitBtn && submitBtn.type === "submit")
        submitBtn.value = "Saving...";
    }

    try {
      const name = val("productName").trim();
      if (!name) throw new Error("Please enter product name.");

      const basePrice = Number(val("productPrice"));
      if (!Number.isFinite(basePrice) || basePrice < 0)
        throw new Error("Base price must be >= 0.");

      const salePriceEl = document.getElementById("productSalePrice");
      const salePrice =
        salePriceEl && salePriceEl.value !== ""
          ? Number(salePriceEl.value)
          : undefined;
      if (
        salePrice !== undefined &&
        (!Number.isFinite(salePrice) || salePrice < 0)
      )
        throw new Error("Sale price must be >= 0.");

      const categoryId = Number(val("productCategory"));
      if (!Number.isFinite(categoryId) || categoryId <= 0)
        throw new Error("Select a valid category.");

      const formData = new FormData();
      formData.append("title", name);
      formData.append("description", val("productDescription"));
      formData.append("basePriceUSD", String(basePrice));
      if (salePrice !== undefined)
        formData.append("salePriceUSD", String(salePrice));
      formData.append("categoryId", String(categoryId));

      // Variants
      const blocks = wrapper.querySelectorAll(".size-quantity-wrapper");
      let vi = 0;
      blocks.forEach((blk) => {
        const size = blk.querySelector(".size-input")?.value || "";
        const q = Number(blk.querySelector(".quantity-input")?.value || "");
        const vStr = blk.querySelector(".variant-price-input")?.value || "";
        const vPrice = vStr === "" ? basePrice : Number(vStr);
        if (size && Number.isFinite(q) && q > 0) {
          formData.append(`variants[${vi}].size`, size);
          formData.append(`variants[${vi}].stockQuantity`, String(q));
          formData.append(`variants[${vi}].variantPriceUSD`, String(vPrice));
          vi++;
        }
      });
      if (vi === 0)
        throw new Error("Add at least one variant (size and quantity).");

      // Images
      const imgInput = document.getElementById("productImages");
      if (!imgInput || imgInput.files.length === 0)
        throw new Error("Upload at least one image.");
      for (let i = 0; i < imgInput.files.length; i++)
        formData.append("imageUrls", imgInput.files[i]);

      const res = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: { Authorization: `Bearer ${storeJwt}` },
        body: formData,
      });

      const ct = res.headers.get("content-type") || "";
      const parse = async () =>
        ct.includes("application/json") ? res.json() : res.text();
      const body = await parse();
      if (!res.ok) {
        const msg =
          typeof body === "string"
            ? body
            : body?.message || JSON.stringify(body);
        throw new Error(msg);
      }

      setMsg("Product added successfully!", true);
      form.reset();
      resetSizeBlocks();
    } catch (err) {
      console.error(err);
      setMsg(err?.message || "Failed to add product.", false);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        if ("textContent" in submitBtn && submitBtn.dataset.orig)
          submitBtn.textContent = submitBtn.dataset.orig;
        if (
          "value" in submitBtn &&
          submitBtn.type === "submit" &&
          submitBtn.dataset.orig
        )
          submitBtn.value = submitBtn.dataset.orig;
      }
    }
  });
});
