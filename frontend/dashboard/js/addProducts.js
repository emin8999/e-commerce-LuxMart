// ==================== КОНФИГ API ====================
const API_BASE = "http://116.203.51.133/luxmart";

// Категории
const CATEGORIES_URL = `${API_BASE}/api/categories`; // GET: [{id, name/nameEn}]

// Магазины / Текущий магазин (по JWT)
const MY_STORE_URL = `${API_BASE}/store/info`; // GET: {id, storeName}
const STORES_URL = `${API_BASE}/stores`; // GET: [{id, name}]

// Подсказка slug (если есть)
const SLUG_SUGGEST_URL = `${API_BASE}/utils/slug?title=`;

// Создание товара
const CREATE_PRODUCT_URL = `${API_BASE}/api/products`; // POST: multipart/form-data
const IMAGES_FIELD_NAME = "imageUrls";

// Токен
const TOKEN_KEY = "storeJwt";

// ==================== УТИЛИТЫ ====================
const authHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const setMsg = (text, ok = false) => {
  const msg = document.getElementById("addProductMessage");
  if (!msg) return;
  msg.textContent = text;
  msg.className = `msg ${ok ? "ok" : "error"}`;
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};
const safeText = async (res) => {
  try {
    return await res.text();
  } catch {
    return "";
  }
};

const slugifyLocal = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 140);

const normalizePrice = (v) => {
  if (v == null) return null;
  const n = String(v).replace(",", ".").trim();
  if (!n) return null;
  const num = Number(n);
  return Number.isFinite(num) ? Number(n) : null;
};
const toBigDecimalString = (n) => n.toFixed(2);

const toggleDisabled = (disabled) => {
  document
    .querySelectorAll(
      "#addProductForm input, #addProductForm textarea, #addProductForm select, #addProductForm button"
    )
    .forEach((el) => {
      el.disabled = disabled;
    });
};

// (Опц.) Жёсткий лимит на файлы (например, 5 МБ/файл, максимум 10 файлов) — чтобы не ловить 413 Nginx
const MAX_FILES = 10;
const MAX_FILE_MB = 5;
function validateFiles(files) {
  if (files.length > MAX_FILES)
    return `Можно загрузить не более ${MAX_FILES} файлов.`;
  const tooBig = Array.from(files).find(
    (f) => f.size > MAX_FILE_MB * 1024 * 1024
  );
  if (tooBig) return `Файл "${tooBig.name}" превышает ${MAX_FILE_MB} МБ.`;
  return null;
}

// ==================== ПОДГРУЗКА ДАННЫХ С БЭКА ====================
async function fetchCategories() {
  const sel = document.getElementById("categoryId");
  sel.innerHTML = `<option value="">Загрузка категорий…</option>`;
  try {
    const res = await fetch(CATEGORIES_URL, { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error(`Ошибка категорий ${res.status}`);
    const list = await res.json();
    sel.innerHTML = `<option value="">— Выберите категорию —</option>`;
    let count = 0;
    (Array.isArray(list) ? list : []).forEach((c) => {
      if (!c || typeof c.id === "undefined") return;
      const opt = document.createElement("option");
      opt.value = String(c.id);
      opt.textContent = c.nameEn || c.name || `#${c.id}`;
      sel.appendChild(opt);
      count++;
    });
    const catCount = document.getElementById("catCount");
    if (catCount) catCount.textContent = String(count);
  } catch (e) {
    sel.innerHTML = `<option value="">Не удалось загрузить</option>`;
    const catCount = document.getElementById("catCount");
    if (catCount) catCount.textContent = "—";
    console.error(e);
  }
}

async function fetchStoreContext() {
  const storeSelect = document.getElementById("storeSelect");
  const storeDisplay = document.getElementById("storeDisplay");
  if (storeSelect)
    storeSelect.innerHTML = `<option value="">Загрузка магазина…</option>`;

  // 1) Текущий магазин (по токену)
  try {
    const me = await fetch(MY_STORE_URL, { headers: { ...authHeaders() } });
    if (me.ok) {
      const data = await me.json();
      if (data && data.id && storeSelect) {
        storeSelect.innerHTML = "";
        const opt = document.createElement("option");
        opt.value = String(data.id);
        opt.textContent = data.storeName || data.name || `Store #${data.id}`;
        storeSelect.appendChild(opt);
        storeSelect.disabled = true;
        if (storeDisplay) storeDisplay.textContent = opt.textContent;
        return;
      }
    }
  } catch {}

  // 2) Список магазинов (для админа)
  try {
    const res = await fetch(STORES_URL, { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error(`Ошибка магазинов ${res.status}`);
    const list = await res.json();
    if (!storeSelect) return;
    storeSelect.innerHTML = `<option value="">— Выберите магазин —</option>`;
    (Array.isArray(list) ? list : []).forEach((s) => {
      if (!s || typeof s.id === "undefined") return;
      const opt = document.createElement("option");
      opt.value = String(s.id);
      opt.textContent = s.name || s.storeName || `Store #${s.id}`;
      storeSelect.appendChild(opt);
    });
    storeSelect.addEventListener("change", () => {
      const opt = storeSelect.selectedOptions[0];
      if (storeDisplay) storeDisplay.textContent = opt ? opt.textContent : "";
    });
  } catch (e) {
    if (storeSelect)
      storeSelect.innerHTML = `<option value="">Не удалось загрузить магазины</option>`;
    if (storeDisplay) storeDisplay.textContent = "—";
    console.error(e);
  }
}

async function suggestSlugFromBackend(title) {
  if (!SLUG_SUGGEST_URL) return null;
  try {
    const res = await fetch(SLUG_SUGGEST_URL + encodeURIComponent(title), {
      headers: { ...authHeaders() },
    });
    if (!res.ok) return null;
    const data = await safeJson(res);
    if (data && data.slug) return String(data.slug);
  } catch {}
  return null;
}

// ==================== ИНИЦИАЛИЗАЦИЯ UI ====================
let variantCounter = 0;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addProductForm");
  const titleEl = document.getElementById("title");
  const slugEl = document.getElementById("slug");
  const descEl = document.getElementById("description");
  const basePriceEl = document.getElementById("basePrice");
  const salePriceEl = document.getElementById("salePrice");
  const categoryIdEl = document.getElementById("categoryId");
  const imagesEl = document.getElementById("images");
  const previewEl = document.getElementById("imagePreview");

  const sizesWrapper = document.getElementById("sizesWrapper");
  const presetSizeEl = document.getElementById("presetSize");
  const addPresetBtn = document.getElementById("addPresetBtn");
  const addCustomBtn = document.getElementById("addCustomBtn");

  // Данные с бэка
  fetchCategories();
  fetchStoreContext();

  // Авто-slug: локально + мягкая подсказка с бэка
  let slugTimeout = null;
  titleEl?.addEventListener("input", () => {
    const base = slugifyLocal(titleEl.value);
    if (!slugEl.dataset.touched) slugEl.value = base;
    clearTimeout(slugTimeout);
    if (titleEl.value.trim().length > 2) {
      slugTimeout = setTimeout(async () => {
        const suggested = await suggestSlugFromBackend(titleEl.value.trim());
        if (suggested && !slugEl.dataset.touched) slugEl.value = suggested;
      }, 300);
    }
  });
  slugEl?.addEventListener("input", () => (slugEl.dataset.touched = "1"));

  // Превью изображений + (опц.) валидация размеров
  imagesEl?.addEventListener("change", () => {
    previewEl.innerHTML = "";
    const files = Array.from(imagesEl.files || []);
    const err = validateFiles(files);
    if (err) {
      setMsg(err);
      imagesEl.value = ""; // сброс выбранных
      return;
    }
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = document.createElement("img");
      img.src = url;
      img.className = "thumb";
      previewEl.appendChild(img);
    });
  });

  // Размеры (варианты)
  addPresetBtn?.addEventListener("click", () => {
    const val = (presetSizeEl.value || "").trim();
    if (!val) return;
    addSizeRow(val);
    presetSizeEl.value = "";
  });
  addCustomBtn?.addEventListener("click", () => addSizeRow(""));

  document.getElementById("resetBtn")?.addEventListener("click", () => {
    sizesWrapper.innerHTML = "";
    previewEl.innerHTML = "";
    setMsg("");
    slugEl.dataset.touched = "";
  });

  // Сабмит
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg("");

    const title = titleEl.value.trim();
    const slug = slugEl.value.trim();
    const description = descEl.value.trim();
    const basePriceUSD = normalizePrice(basePriceEl.value);
    const salePriceUSD = salePriceEl.value
      ? normalizePrice(salePriceEl.value)
      : null;
    const categoryId = categoryIdEl.value ? Number(categoryIdEl.value) : null;

    if (!title || !slug || !description)
      return setMsg("Заполните название, slug и описание.");
    if (basePriceUSD === null || basePriceUSD < 0)
      return setMsg("Некорректная базовая цена.");
    if (salePriceUSD !== null && salePriceUSD < 0)
      return setMsg("Некорректная цена со скидкой.");
    if (!categoryId) return setMsg("Выберите категорию.");

    // Строгая проверка строк размеров
    const rows = document.querySelectorAll(".size-row");
    for (const row of rows) {
      const { sizeInput, qtyInput } = row._refs || {};
      if (!sizeInput?.value.trim()) {
        sizeInput?.reportValidity?.();
        return setMsg("Укажите размер в каждой добавленной строке.");
      }
      if (qtyInput?.value === "" || Number(qtyInput.value) < 0) {
        qtyInput?.reportValidity?.();
        return setMsg("Укажите корректное количество для каждого размера.");
      }
    }

    const variants = collectVariants();
    if (!variants.length)
      return setMsg("Добавьте хотя бы один размер и количество.");

    // storeId (важно для проверки прав на стороне бэкенда)
    const storeSelect = document.getElementById("storeSelect");
    const selectedStoreId = storeSelect?.value
      ? Number(storeSelect.value)
      : null;

    // JSON часть "product"
    const productPayload = {
      title,
      slug,
      description,
      basePriceUSD: toBigDecimalString(basePriceUSD),
      salePriceUSD:
        salePriceUSD !== null ? toBigDecimalString(salePriceUSD) : null,
      categoryId,
      variants, // [{ size, quantity }]
      storeId: selectedStoreId, // ← добавлено: бэкенду проще проверить права и владельца
    };

    const fd = new FormData();
    fd.append(
      "product",
      new Blob([JSON.stringify(productPayload)], { type: "application/json" })
    );
    const files = Array.from(imagesEl.files || []);
    files.forEach((f) => fd.append(IMAGES_FIELD_NAME, f));

    try {
      toggleDisabled(true);
      const res = await fetch(CREATE_PRODUCT_URL, {
        method: "POST",
        headers: { ...authHeaders() }, // НЕ ставим вручную Content-Type для FormData
        body: fd,
      });
      if (!res.ok) {
        const t = await safeText(res);
        throw new Error(`Ошибка ${res.status}: ${t || res.statusText}`);
      }
      setMsg("Товар успешно сохранён.", true);
      form.reset();
      sizesWrapper.innerHTML = "";
      document.getElementById("imagePreview").innerHTML = "";
      document.getElementById("slug").dataset.touched = "";
    } catch (err) {
      setMsg(err.message || "Ошибка сохранения товара.");
    } finally {
      toggleDisabled(false);
    }
  });
});

// ==== helpers для variants (с уникальными id/name) ====
function addSizeRow(initialSize = "") {
  variantCounter++;

  const row = document.createElement("div");
  row.className = "size-row";

  // Размер
  const sizeInput = document.createElement("input");
  sizeInput.type = "text";
  sizeInput.placeholder = "Размер (напр.: M или 42)";
  sizeInput.required = true;
  sizeInput.value = initialSize;
  sizeInput.id = `variant_size_${variantCounter}`;
  sizeInput.name = `variants[${variantCounter}][size]`;
  sizeInput.autocomplete = "off";

  // Количество
  const qtyInput = document.createElement("input");
  qtyInput.type = "number";
  qtyInput.min = "0";
  qtyInput.step = "1";
  qtyInput.placeholder = "Количество";
  qtyInput.required = true;
  qtyInput.id = `variant_qty_${variantCounter}`;
  qtyInput.name = `variants[${variantCounter}][quantity]`;
  qtyInput.autocomplete = "off";

  // Удалить
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn";
  removeBtn.textContent = "Удалить";
  removeBtn.addEventListener("click", () => row.remove());

  // Можно добавить скрытые <label> для доступности (если нужно)
  // Оставляю компактно без визуального шума; id/name уже есть.

  row.appendChild(sizeInput);
  row.appendChild(qtyInput);
  row.appendChild(removeBtn);

  // ссылки для collectVariants()
  row._refs = { sizeInput, qtyInput };

  const sizesWrapper = document.getElementById("sizesWrapper");
  sizesWrapper.appendChild(row);
}

function collectVariants() {
  const rows = document.querySelectorAll(".size-row");
  const list = [];
  rows.forEach((row) => {
    const { sizeInput, qtyInput } = row._refs || {};
    const size = (sizeInput?.value || "").trim();
    const qty = Number(qtyInput?.value || "0");
    if (!size || !Number.isFinite(qty) || qty < 0) return;
    list.push({ size, quantity: qty });
  });
  // Если хотите объединять дубли — можно агрегировать. Тут оставляем как есть (каждая строка — отдельный вариант).
  return list;
}
