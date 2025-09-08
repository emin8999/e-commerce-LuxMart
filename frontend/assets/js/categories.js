const API_BASE = "http://116.203.51.133/luxmart";

let CATEGORIES_CACHE = null;

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

async function loadCategories() {
  if (CATEGORIES_CACHE) return CATEGORIES_CACHE;
  try {
    const res = await fetch(`${API_BASE}/api/products/category/{categoryId}`);
    const data = await res.json();
    CATEGORIES_CACHE = Array.isArray(data) ? data : [];
  } catch (e) {
    CATEGORIES_CACHE = [];
  }
  return CATEGORIES_CACHE;
}

window.renderCategories = async function (targetId) {
  const wrap = document.getElementById(targetId);
  if (!wrap) return;
  wrap.innerHTML = "";
  const lc =
    (window.i18n && window.i18n.getLocale && window.i18n.getLocale()) || "en";
  const nameKey = localeField(lc);
  const cats = await loadCategories();
  // Assume API returns root categories with nested subcategories
  cats.forEach((cat) => {
    const title = cat[nameKey] || cat.nameEn || cat.slug || `Cat ${cat.id}`;
    const children = Array.isArray(cat.subcategories) ? cat.subcategories : [];
    const childNames = children
      .map((c) => c[nameKey] || c.nameEn || c.slug)
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

// Re-render on locale change
if (window.i18n && window.i18n.onUpdate) {
  window.i18n.onUpdate(() => {
    ["categoriesGrid", "catList"].forEach((id) => {
      if (document.getElementById(id)) window.renderCategories(id);
    });
  });
}
