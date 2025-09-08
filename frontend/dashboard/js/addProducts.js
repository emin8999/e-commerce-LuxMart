// ==================== КОНФИГ API ====================
// Подставьте ваши реальные эндпойнты. Ниже — рабочие предположения.
const API_BASE = "http://116.203.51.133/luxmart";

// Категории
const CATEGORIES_URL = `${API_BASE}/api/categories`; // GET: список категорий [{id, name}]
// Или `${API_BASE}/api/v1/categories`

// Магазины / Текущий магазин (по JWT)
const MY_STORE_URL = `${API_BASE}/store/info`; // GET: текущий магазин {id, name}
const STORES_URL = `${API_BASE}/stores`; // GET: список магазинов (для админа) [{id, name}]

// Опционально: подсказка slug от бэкенда (если есть такой сервис)
const SLUG_SUGGEST_URL = `${API_BASE}/utils/slug?title=`; // GET: ?title=... => { slug: "..." }

// Создание товара
const CREATE_PRODUCT_URL = `${API_BASE}/api/products`; // POST: multipart/form-data
// Имя поля с файлами — под бэкенд, чаще "imageUrls" или "images"
const IMAGES_FIELD_NAME = "imageUrls";

// Где хранится токен (если у вас другой ключ — поменяйте)
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
      opt.textContent = c.name || `#${c.id}`;
      sel.appendChild(opt);
      count++;
    });
    document.getElementById("catCount").textContent = String(count);
  } catch (e) {
    sel.innerHTML = `<option value="">Не удалось загрузить</option>`;
    document.getElementById("catCount").textContent = "—";
    console.error(e);
  }
}

async function fetchStoreContext() {
  const storeSelect = document.getElementById("storeSelect");
  const storeDisplay = document.getElementById("storeDisplay");
  storeSelect.innerHTML = `<option value="">Загрузка магазина…</option>`;

  // 1) Пытаемся получить текущий магазин по токену
  try {
    const me = await fetch(MY_STORE_URL, { headers: { ...authHeaders() } });
    if (me.ok) {
      const data = await me.json();
      if (data && data.id) {
        // Показываем только текущий магазин
        storeSelect.innerHTML = "";
        const opt = document.createElement("option");
        opt.value = String(data.id);
        opt.textContent = data.storeName || `Store #${data.id}`;
        storeSelect.appendChild(opt);
        storeSelect.disabled = true; // для продавца — фиксированный
        storeDisplay.textContent = opt.textContent;
        return;
      }
    }
  } catch {}

  // 2) Если вы админ (или нет /me), подгружаем список магазинов
  try {
    const res = await fetch(STORES_URL, { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error(`Ошибка магазинов ${res.status}`);
    const list = await res.json();
    storeSelect.innerHTML = `<option value="">— Выберите магазин —</option>`;
    (Array.isArray(list) ? list : []).forEach((s) => {
      if (!s || typeof s.id === "undefined") return;
      const opt = document.createElement("option");
      opt.value = String(s.id);
      opt.textContent = s.name || `Store #${s.id}`;
      storeSelect.appendChild(opt);
    });
    storeSelect.addEventListener("change", () => {
      const opt = storeSelect.selectedOptions[0];
      storeDisplay.textContent = opt ? opt.textContent : "";
    });
  } catch (e) {
    storeSelect.innerHTML = `<option value="">Не удалось загрузить магазины</option>`;
    storeDisplay.textContent = "—";
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

  // Загружаем категории и магазин
  fetchCategories();
  fetchStoreContext();

  // Автослаг: сначала локально, затем пытаемся уточнить с бэка (если доступен)
  let slugTimeout = null;
  titleEl.addEventListener("input", () => {
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
  slugEl.addEventListener("input", () => (slugEl.dataset.touched = "1"));

  // Превью изображений
  imagesEl.addEventListener("change", () => {
    previewEl.innerHTML = "";
    const files = Array.from(imagesEl.files || []);
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = document.createElement("img");
      img.src = url;
      img.className = "thumb";
      previewEl.appendChild(img);
    });
  });

  // Размеры
  addPresetBtn.addEventListener("click", () => {
    const val = (presetSizeEl.value || "").trim();
    if (!val) return;
    addSizeRow(val);
    presetSizeEl.value = "";
  });
  addCustomBtn.addEventListener("click", () => addSizeRow(""));

  document.getElementById("resetBtn")?.addEventListener("click", () => {
    sizesWrapper.innerHTML = "";
    previewEl.innerHTML = "";
    setMsg("");
    slugEl.dataset.touched = "";
  });

  // Сабмит
  form.addEventListener("submit", async (e) => {
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

    const variants = collectVariants();
    if (!variants.length)
      return setMsg("Добавьте хотя бы один размер и количество.");

    // Собираем полезную инфу о магазине (для отображения и, возможно, чтобы передать, если бэкенд ждёт)
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
      variants, // [{size, quantity}]
      // Если бэкенд принимает связь с магазином в DTO:
      // storeId: selectedStoreId
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
        headers: { ...authHeaders() }, // ВАЖНО: не добавляйте Content-Type вручную для FormData
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

  // ==== helpers для variants ====
  function addSizeRow(initialSize = "") {
    const row = document.createElement("div");
    row.className = "size-row";

    const sizeInput = document.createElement("input");
    sizeInput.type = "text";
    sizeInput.placeholder = "Размер (напр.: M или 42)";
    sizeInput.required = true;
    sizeInput.value = initialSize;

    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "0";
    qtyInput.step = "1";
    qtyInput.placeholder = "Количество";
    qtyInput.required = true;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn";
    removeBtn.textContent = "Удалить";
    removeBtn.addEventListener("click", () => row.remove());

    row.appendChild(sizeInput);
    row.appendChild(qtyInput);
    row.appendChild(removeBtn);
    sizesWrapper.appendChild(row);
  }

  function collectVariants() {
    const rows = document.querySelectorAll(".size-row");
    const list = [];
    rows.forEach((row) => {
      const [sizeInput, qtyInput] = row.querySelectorAll("input");
      const size = (sizeInput?.value || "").trim();
      const qty = Number(qtyInput?.value || "0");
      if (size && Number.isFinite(qty) && qty >= 0) {
        list.push({ size, quantity: qty });
      }
    });
    // Аггрегируем дубли по size
    const bySize = new Map();
    list.forEach((v) => {
      const k = v.size.toLowerCase();
      bySize.set(k, {
        size: v.size,
        quantity: (bySize.get(k)?.quantity || 0) + v.quantity,
      });
    });
    return Array.from(bySize.values());
  }
});
