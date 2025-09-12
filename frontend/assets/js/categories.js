const API_CATEGORIES_BASE = "http://116.203.51.133/luxmart";

let CATEGORIES_CACHE = null;

// Если нужен токен для категорий — раскомментируй и добавь в fetch
// const TOKEN_KEY = "storeJwt";
// const authHeaders = () => {
//   const t = localStorage.getItem(TOKEN_KEY);
//   return t ? { Authorization: `Bearer ${t}` } : {};
// };

function localeField(lc) {
  switch ((lc || "en").toLowerCase()) {
    case "az":
      return "nameAz";
    case "es":
      return "nameEs";
    case "de":
      return "nameDe";
    default:
      return "nameEn";
  }
}

// Нормализация массива категорий из разных форматов бэка
function normalizeCategories(raw) {
  if (!raw) return [];
  // Если пришёл объект-обёртка (пагинация или др.)
  if (!Array.isArray(raw)) {
    if (Array.isArray(raw.content)) return raw.content;
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.data)) return raw.data;
  }
  return Array.isArray(raw) ? raw : [];
}

// Безопасно достаём список детей из разных полей
function getChildren(cat) {
  const keys = [
    "subcategories",
    "subCategories",
    "children",
    "childCategories",
  ];
  for (const k of keys) {
    const v = cat?.[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

// Имя категории с запасными вариантами
function categoryTitle(cat, nameKey) {
  return (
    cat?.[nameKey] ||
    cat?.name ||
    cat?.nameEn ||
    cat?.title ||
    cat?.slug ||
    `Cat ${cat?.id ?? "?"}`
  );
}

async function loadCategories() {
  if (CATEGORIES_CACHE) return CATEGORIES_CACHE;
  try {
    const res = await fetch(`${API_CATEGORIES_BASE}/api/categories`, {
      // headers: { ...authHeaders() },
    });
    if (!res.ok) {
      console.error("[categories] HTTP", res.status, await res.text());
      CATEGORIES_CACHE = [];
      return CATEGORIES_CACHE;
    }
    const data = await res.json();
    const list = normalizeCategories(data);
    CATEGORIES_CACHE = list;
  } catch (e) {
    console.error("[categories] fetch error:", e);
    CATEGORIES_CACHE = [];
  }
  return CATEGORIES_CACHE;
}

// Собираем категории, которые реально используются в товарах
async function loadUsedCategoryInfo() {
  try {
    const res = await fetch(`${API_CATEGORIES_BASE}/api/products/all-products`);
    if (!res.ok) return { ids: new Set(), names: new Set() };
    const data = await res.json();
    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

    const ids = new Set();
    const names = new Set();
    list.forEach((p) => {
      // Находим возможные поля категорий на товаре
      const pid = p.categoryId ?? p.category_id ?? p.category?.id;
      if (pid != null) ids.add(String(pid));

      const pname =
        p.categoryName ??
        p.category_name ??
        p.category?.name ??
        p.category ??
        null;
      if (pname) names.add(String(pname).trim().toLowerCase());
    });
    return { ids, names };
  } catch (_) {
    return { ids: new Set(), names: new Set() };
  }
}

window.renderCategories = async function (targetId) {
  const wrap = document.getElementById(targetId);
  if (!wrap) return;

  wrap.innerHTML = "";
  wrap.setAttribute("data-loading", "1");

  const lc = window.i18n?.getLocale?.() || "en";
  const nameKey = localeField(lc);

  // Загружаем все категории и пересекаем с реально используемыми
  const [cats, used] = await Promise.all([loadCategories(), loadUsedCategoryInfo()]);
  wrap.removeAttribute("data-loading");

  if (!cats.length) {
    // Пустое состояние с подсказкой — чтобы понимать, что не так
    const empty = document.createElement("div");
    empty.className = "card";
    empty.innerHTML = `
      <strong>Нет категорий</strong>
      <div class="label" style="opacity:.75;font-size:.9em">
        Проверьте эндпойнт <code>/api/categories</code> и авторизацию. 
        Откройте консоль — там логи запроса/ошибки.
      </div>`;
    wrap.appendChild(empty);
    return;
  }

  // Фильтруем категории: оставляем только те, что встречаются в товарах (по id или имени)
  const isUsed = (node) => {
    const idMatch = node?.id != null && used.ids.has(String(node.id));
    const rawName = categoryTitle(node, nameKey);
    const nameMatch = rawName && used.names.has(String(rawName).trim().toLowerCase());
    return idMatch || nameMatch;
  };

  cats.forEach((cat) => {
    // Оставляем карточку, если сама категория используется или любой из её детей используется
    const childrenAll = getChildren(cat);
    const usedChildren = childrenAll.filter(isUsed);
    if (!(isUsed(cat) || usedChildren.length)) return;

    const title = categoryTitle(cat, nameKey);
    const childNames = usedChildren
      .map((c) => categoryTitle(c, nameKey))
      .filter(Boolean);

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML =
      `<strong>${title}</strong>` +
      (childNames.length
        ? `<div class="label">${childNames.join(" • ")}</div>`
        : "");

    card.addEventListener("click", () => {
      window.location.href = `./products.html?cat=${encodeURIComponent(
        cat.id
      )}`;
    });

    wrap.appendChild(card);
  });
};

// Перерисовка при смене языка
if (window.i18n?.onUpdate) {
  window.i18n.onUpdate(() => {
    ["categoriesGrid", "catList"].forEach((id) => {
      if (document.getElementById(id)) window.renderCategories(id);
    });
  });
}
