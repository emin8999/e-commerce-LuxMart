// Store dashboard: load and edit store info
(function () {
  const API_BASE = "http://116.203.51.133/luxmart";
  const TOKEN_KEY = "storeJwt";
  const STORE_INFO_URL = `${API_BASE}/store/info`;
  // NOTE: Backend currently has no update endpoint; this is prepared for future use
  const STORE_UPDATE_URL = `${API_BASE}/store/update`;

  const authHeaders = () => {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? { Authorization: `Bearer ${t}` } : {};
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

  async function loadStoreInfo() {
    setMsg("");
    try {
      const res = await fetch(STORE_INFO_URL, { headers: { ...authHeaders() } });
      if (!res.ok) throw new Error(`Ошибка загрузки: ${res.status}`);
      const data = await res.json();
      originalData = data;
      fillForm(data);
    } catch (e) {
      console.error(e);
      setMsg("Не удалось загрузить информацию о магазине");
    }
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
    setMsg("");

    const payload = {
      storeName: $("storeName").value.trim(),
      ownerName: $("ownerName").value.trim(),
      phone: $("phone").value.trim(),
      location: $("location").value.trim(),
      category: $("category").value.trim(),
      storeDescription: $("storeDescription").value.trim(),
      slug: $("slug").value.trim(),
    };

    // If backend update endpoint is not available, inform user gracefully
    try {
      const res = await fetch(STORE_UPDATE_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Endpoint недоступен (${res.status}). Свяжитесь с разработчиком.`);
      }
      const updated = await res.json().catch(() => payload);
      originalData = { ...originalData, ...updated };
      fillForm(originalData);
      setDisabled(true);
      setMsg("Данные магазина сохранены", true);
    } catch (err) {
      console.warn("Store update skipped:", err.message);
      setMsg(
        "Сохранение пока недоступно. Отображение работает, endpoint для обновления отсутствует."
      );
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!location.pathname.endsWith("/store.html")) return;
    setDisabled(true);
    loadStoreInfo();

    $("editStoreBtn")?.addEventListener("click", enterEditMode);
    $("cancelEditBtn")?.addEventListener("click", cancelEdit);
    $("storeInfoForm")?.addEventListener("submit", onSave);
  });
})();
