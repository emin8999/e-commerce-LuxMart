// Store dashboard: load and edit store info
(function () {
  const API_BASE = "http://116.203.51.133/luxmart";
  const TOKEN_KEY = "storeJwt";
  const STORE_INFO_URL = `${API_BASE}/api/store/info`;
  const STORE_UPDATE_URL = `${API_BASE}/api/store/update`;
  // Products
  const PRODUCTS_URL = `${API_BASE}/api/products`;
  const PRODUCTS_MY_STORE_URL = `${API_BASE}/api/products/my-store`;
  const PRODUCT_BY_ID = (id) =>
    `${API_BASE}/api/products/${encodeURIComponent(id)}`;

  const authHeaders = () => {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  // Debug function to check token
  const debugAuth = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    console.log("Token exists:", !!token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("Token payload:", payload);
        console.log("Token expired:", payload.exp < Date.now() / 1000);
      } catch (e) {
        console.log("Token parse error:", e);
      }
    }
  };

  const $ = (id) => document.getElementById(id);
  const setDisabled = (disabled) => {
    [
      "storeName",
      "ownerName",
      "email",
      "phone",
      "location",
      "category",
      "storeDescription",
      "slug",
      "agreedToTerms",
    ].forEach((id) => {
      const el = $(id);
      if (el) el.disabled = disabled;
    });
    $("saveStoreBtn").disabled = disabled;
    $("cancelEditBtn").disabled = disabled;
  };

  const setMsg = (text, ok = false) => {
    const msg = $("storeInfoMsg");
    if (!msg) return;
    msg.textContent = text || "";
    msg.style.color = ok ? "#2e7d32" : "#c62828";
  };

  const setProductsMsg = (text, ok = false) => {
    const msg = document.getElementById("productsMsg");
    if (!msg) return;
    msg.textContent = text || "";
    msg.style.color = ok ? "#2e7d32" : "#c62828";
  };

  const fillForm = (data) => {
    if (!data) return;
    $("storeName").value = data.storeName || "";
    $("ownerName").value = data.ownerName || "";
    $("email").value = data.email || "";
    $("phone").value = data.phone || "";
    $("location").value = data.location || "";
    $("category").value = data.category || "";
    $("storeDescription").value = data.storeDescription || "";
    $("slug").value = data.slug || "";
    const agreed = Boolean(data.agreedToTerms);
    $("agreedToTerms").checked = agreed;
    const logo = $("logoPreview");
    if (logo) logo.src = data.logo || "";
  };

  let originalData = null;
  let storeId = null;
  let productsCache = [];

  async function loadStoreInfo() {
    setMsg("Loading store info...");
    debugAuth(); // Debug için

    try {
      const res = await fetch(STORE_INFO_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });

      console.log("Store info response status:", res.status);

      if (res.status === 401) {
        setMsg("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
        // Redirect to login or clear token
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "../login.html";
        return;
      }

      if (res.status === 403) {
        setMsg("Bu işlem için yetkiniz yok.");
        return;
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log("Store data received:", data);

      // Role kontrolü için debug
      if (data.roles) {
        console.log("User roles:", data.roles);
        const hasStoreRole = Array.isArray(data.roles)
          ? data.roles.some((role) => role === "STORE" || role === "ROLE_STORE")
          : false;
        console.log("Has STORE role:", hasStoreRole);
      }

      originalData = data;
      if (data && (data.id || data.storeId)) {
        storeId = data.id ?? data.storeId;
      }
      fillForm(data);
      setMsg("Store info loaded successfully", true);
    } catch (e) {
      console.error("Store info load error:", e);
      setMsg(`Не удалось загрузить информацию о магазине: ${e.message}`);
    }
  }

  // ===== Products =====
  const firstImage = (p) => {
    if (!p) return "";
    if (Array.isArray(p.imageUrls) && p.imageUrls.length) return p.imageUrls[0];
    if (Array.isArray(p.images) && p.images.length) return p.images[0];
    if (p.image) return p.image;
    return "";
  };

  const sumStock = (p) => {
    const list = Array.isArray(p?.variants) ? p.variants : [];
    return list.reduce(
      (acc, v) => acc + (Number(v.stockQuantity ?? v.stock ?? 0) || 0),
      0
    );
  };

  const variantsLabel = (p) => {
    const list = Array.isArray(p?.variants) ? p.variants : [];
    if (!list.length) return "—";
    return list
      .map(
        (v) =>
          `${v.size ?? v.name ?? "?"}:${Number(
            v.stockQuantity ?? v.stock ?? 0
          )}`
      )
      .join(", ");
  };

  function renderProducts(list) {
    const tbody = document.getElementById("store-products");
    if (!tbody) return;
    tbody.innerHTML = "";
    (list || []).forEach((p) => {
      const tr = document.createElement("tr");
      tr.dataset.id = p.id;
      const img = firstImage(p);
      const base = p.basePriceUSD != null ? Number(p.basePriceUSD) : null;
      const sale = p.salePriceUSD != null ? Number(p.salePriceUSD) : null;
      tr.innerHTML = `
        <td style="width:72px"><img src="${
          img || ""
        }" alt="" style="width:64px;height:64px;object-fit:cover;border:1px solid #eee;border-radius:6px" onerror="this.style.display='none'"/></td>
        <td>${p.title ?? ""}</td>
        <td>${p.slug ?? ""}</td>
        <td>${p.nameEn ?? p.category ?? p.categoryId ?? ""}</td>
        <td>${base ?? ""}</td>
        <td>${sale ?? ""}</td>
        <td>${variantsLabel(p)}</td>
        <td>${sumStock(p)}</td>
        <td>
          <button class="btn" data-act="edit">Edit</button>
          <button class="btn" data-act="delete">Delete</button>
          <a class="btn" href="../productView.html?id=${encodeURIComponent(
            p.id
          )}" target="_blank">View</a>
        </td>`;
      tbody.appendChild(tr);
    });

    // actions
    tbody.querySelectorAll("button[data-act]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tr = e.currentTarget.closest("tr");
        const id = tr?.dataset?.id;
        const act = e.currentTarget.dataset.act;
        const product = productsCache.find((x) => String(x.id) === String(id));
        if (!id || !product) return;
        if (act === "delete") return onDeleteProduct(id);
        if (act === "edit") return openEditRow(tr, product);
      });
    });
  }

  async function loadProducts() {
    setProductsMsg("Loading products...");
    try {
      // Prefer server-side filter for current store
      let res = await fetch(PRODUCTS_MY_STORE_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });

      if (res.status === 401) {
        setProductsMsg("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
        return;
      }

      if (res.status === 403) {
        setProductsMsg("Bu işlem için yetkiniz yok.");
        return;
      }

      if (!res.ok) {
        // Fallback to legacy endpoint if specific one is unavailable
        res = await fetch(PRODUCTS_URL, {
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        });
      }

      if (!res.ok) throw new Error(`Ошибка продуктов: ${res.status}`);

      const all = await res.json();
      const list = Array.isArray(all)
        ? all
        : Array.isArray(all?.content)
        ? all.content
        : [];

      // If backend already scopes to store, no extra filtering needed
      productsCache = list;
      renderProducts(productsCache);
      setProductsMsg(`Loaded: ${productsCache.length} products`, true);
    } catch (e) {
      console.error("Products load error:", e);
      setProductsMsg("Не удалось загрузить товары");
    }
  }

  function openEditRow(tr, product) {
    closeAllEditors();
    const editTr = document.createElement("tr");
    editTr.className = "edit-row";
    editTr.innerHTML = `<td colspan="9">
      <form class="form" id="editForm_${product.id}" autocomplete="off">
        <div class="grid two">
          <label><span>Title</span><input type="text" name="title" value="${
            product.title ?? ""
          }" /></label>
          <label><span>Slug</span><input type="text" name="slug" value="${
            product.slug ?? ""
          }" /></label>
          <label><span>Base USD</span><input type="number" step="0.01" name="basePriceUSD" value="${
            product.basePriceUSD ?? ""
          }" /></label>
          <label><span>Sale USD</span><input type="number" step="0.01" name="salePriceUSD" value="${
            product.salePriceUSD ?? ""
          }" /></label>
          <label><span>Category Id</span><input type="number" name="categoryId" value="${
            product.categoryId ?? ""
          }" /></label>
          <label><span>New Images</span><input type="file" name="imageUrls" accept="image/*" multiple /></label>
        </div>
        <label><span>Description</span><textarea name="description" rows="3">${(
          product.description ?? ""
        ).replace(/</g, "&lt;")}</textarea></label>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn primary" data-act="save">Save</button>
          <button class="btn" data-act="cancel" type="button">Cancel</button>
        </div>
      </form>
    </td>`;
    tr.after(editTr);

    const form = editTr.querySelector("form");
    form.querySelector('[data-act="cancel"]').addEventListener("click", () => {
      editTr.remove();
    });
    form.addEventListener("submit", (e) => onSaveEdit(e, product.id));
  }

  function closeAllEditors() {
    document.querySelectorAll("tr.edit-row").forEach((el) => el.remove());
  }

  async function onSaveEdit(e, id) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    let ok = false;
    try {
      const res = await fetch(PRODUCT_BY_ID(id), {
        method: "PUT",
        headers: { ...authHeaders() }, // do not set content-type for FormData
        body: fd,
      });

      if (res.status === 401) {
        setProductsMsg("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
        return;
      }

      if (res.status === 403) {
        setProductsMsg("Bu işlem için yetkiniz yok.");
        return;
      }

      if (!res.ok) throw new Error(String(res.status));
      ok = true;
    } catch (err) {
      try {
        fd.append("_method", "PUT");
        const res2 = await fetch(PRODUCT_BY_ID(id), {
          method: "POST",
          headers: { ...authHeaders() },
          body: fd,
        });
        if (!res2.ok) throw new Error(String(res2.status));
        ok = true;
      } catch (e2) {
        setProductsMsg("Не удалось сохранить изменения товара");
        return;
      }
    }
    if (ok) {
      setProductsMsg("Товар обновлён", true);
      closeAllEditors();
      await loadProducts();
    }
  }

  async function onDeleteProduct(id) {
    if (!confirm("Удалить товар? Это действие необратимо.")) return;
    try {
      const res = await fetch(PRODUCT_BY_ID(id), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });

      if (res.status === 401) {
        setProductsMsg("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
        return;
      }

      if (res.status === 403) {
        setProductsMsg("Bu işlem için yetkiniz yok.");
        return;
      }

      if (!res.ok) throw new Error(String(res.status));
      setProductsMsg("Товар удалён", true);
      productsCache = productsCache.filter((p) => String(p.id) !== String(id));
      renderProducts(productsCache);
    } catch (e) {
      console.error("Product delete error:", e);
      setProductsMsg("Не удалось удалить товар");
    }
  }

  // Export to XLS (Excel-compatible HTML)
  function exportTableToXls() {
    const table = document.getElementById("productsTable");
    if (!table) return;
    const html = `\n      <html xmlns:o=\"urn:schemas-microsoft-com:office:office\"\n            xmlns:x=\"urn:schemas-microsoft-com:office:excel\"\n            xmlns=\"http://www.w3.org/TR/REC-html40\">\n      <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Products</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>\n      <body>${table.outerHTML}</body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `store_products_${Date.now()}.xls`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
  }

  function enterEditMode() {
    setDisabled(false);
    // email and agreedToTerms typically not editable
    $("email").disabled = true;
    $("agreedToTerms").disabled = true;
  }

  function cancelEdit() {
    fillForm(originalData);
    setDisabled(true);
    setMsg("");
  }

  async function onSave(e) {
    e.preventDefault();
    setMsg("Saving...");

    // FormData kullan çünkü logo upload olabilir
    const formData = new FormData();
    formData.append("storeName", $("storeName").value.trim());
    formData.append("ownerName", $("ownerName").value.trim());
    formData.append("phone", $("phone").value.trim());
    formData.append("location", $("location").value.trim());
    formData.append("category", $("category").value.trim());
    formData.append("storeDescription", $("storeDescription").value.trim());

    // Slug alanını ekle (eğer backend'de slug update yapılıyorsa)
    const slugValue = $("slug").value.trim();
    if (slugValue) {
      formData.append("slug", slugValue);
    }

    // Logo file varsa ekle
    const logoInput = document.querySelector('input[name="logo"]');
    if (logoInput && logoInput.files.length > 0) {
      formData.append("logo", logoInput.files[0]);
    }

    try {
      const res = await fetch(STORE_UPDATE_URL, {
        method: "PUT",
        headers: { ...authHeaders() }, // Content-Type header'ını ekleme, FormData otomatik ayarlar
        body: formData,
      });

      console.log("Update response status:", res.status);

      if (res.status === 401) {
        setMsg("Oturumunuz sona erdi. Lütfen tekrar giriş yapın.");
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "../login.html";
        return;
      }

      if (res.status === 403) {
        setMsg("Bu işlem için yetkiniz yok.");
        return;
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const updated = await res.json().catch(() => null);
      console.log("Update response:", updated);

      if (updated) {
        originalData = { ...originalData, ...updated };
        fillForm(originalData);
      }

      setDisabled(true);
      setMsg("Данные магазина сохранены", true);
    } catch (err) {
      console.error("Store update error:", err);
      setMsg(`Ошибка сохранения: ${err.message}`);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!location.pathname.endsWith("/store.html")) return;

    setDisabled(true);

    // Debug için token kontrolü
    debugAuth();

    loadStoreInfo().then(() => loadProducts());

    $("editStoreBtn")?.addEventListener("click", enterEditMode);
    $("cancelEditBtn")?.addEventListener("click", cancelEdit);
    $("storeInfoForm")?.addEventListener("submit", onSave);

    document
      .getElementById("exportXlsBtn")
      ?.addEventListener("click", exportTableToXls);
  });
})();
