// Store data - Bu backend-dən gələcək data
let storesData = [];
let filteredData = [];

// API base
const API_BASE = "http://116.203.51.133/luxmart";

// Initialize data
async function initializeStores() {
  try {
    document.getElementById("stores-container").innerHTML =
      '<div class="loading">Loading stores data...</div>';
    const list = await fetchStoresFromAPI();
    storesData = list;
    filteredData = [...storesData];
    renderStoresTable();
  } catch (e) {
    console.error("Initialize stores failed:", e);
    storesData = [];
    filteredData = [];
    renderStoresTable();
  }
}

// Render stores table
function renderStoresTable() {
  const container = document.getElementById("stores-container");

  if (filteredData.length === 0) {
    container.innerHTML = `
                    <div class="empty-state">
                        <i>🏪</i>
                        <h3>No stores found</h3>
                        <p>No stores match your current filters</p>
                    </div>
                `;
    return;
  }

  const tableHTML = `
                <table class="stores-table">
                    <thead>
                        <tr>
                            <th>Logo</th>
                            <th>Store Name</th>
                            <th>Owner</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Location</th>
                            <th>Category</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredData
                          .map(
                            (store) => `
                            <tr>
                                <td>
                                    <img src="${
                                      store.logo ||
                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        store.storeName || "S"
                                      )}&background=667eea&color=fff&size=100`
                                    }" 
                                         alt="${store.storeName}" 
                                         class="store-logo" 
                                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(
                                           (store.storeName || "Store").charAt(
                                             0
                                           )
                                         )}&background=667eea&color=fff&size=100'">
                                </td>
                                <td><strong>${
                                  store.storeName || "N/A"
                                }</strong><br><small>${
                              store.slug || "no-slug"
                            }</small></td>
                                <td>${store.ownerName || "N/A"}</td>
                                <td>${store.email || "N/A"}</td>
                                <td>${store.phone || "N/A"}</td>
                                <td>${store.location || "N/A"}</td>
                                <td><span class="store-category">${
                                  Array.isArray(store.category)
                                    ? store.category.join(", ")
                                    : (store.category || "general")
                                }</span></td>
                                <td>${
                                  store.storeDescription || "No description"
                                }</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            `;

  container.innerHTML = tableHTML;

  // Populate category filter with unique categories from real data
  populateCategoryFilter();
}

// Populate category filter with actual categories from API data
function populateCategoryFilter() {
  const categoryFilter = document.querySelector(".category-filter");
  const currentValue = categoryFilter.value;

  // Get unique categories from stores data
  const catSet = new Set();
  storesData.forEach((store) => {
    const c = store.category;
    if (!c) return;
    if (Array.isArray(c)) {
      c.forEach((x) => {
        const v = String(x || "").trim();
        if (v && v.toLowerCase() !== "general") catSet.add(v);
      });
    } else {
      const v = String(c || "").trim();
      if (v && v.toLowerCase() !== "general") catSet.add(v);
    }
  });
  const categories = Array.from(catSet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  // Clear and repopulate options
  categoryFilter.innerHTML = '<option value="">All Categories</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = String(category).toLowerCase();
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  // Restore previous selection
  categoryFilter.value = currentValue;
}

// Filter stores by search
function filterStores() {
  const searchTerm = document
    .querySelector(".search-input")
    .value.toLowerCase();
  const categoryFilter = document.querySelector(".category-filter").value;

  filteredData = storesData.filter((store) => {
    const name = String(store.storeName || "").toLowerCase();
    const owner = String(store.ownerName || "").toLowerCase();
    const email = String(store.email || "").toLowerCase();
    const matchesSearch =
      name.includes(searchTerm) || owner.includes(searchTerm) || email.includes(searchTerm);

    let matchesCategory = true;
    if (categoryFilter) {
      const cat = store.category;
      if (Array.isArray(cat)) {
        const list = cat.map((x) => String(x || "").toLowerCase());
        matchesCategory = list.includes(categoryFilter);
      } else {
        matchesCategory = String(cat || "").toLowerCase() === categoryFilter;
      }
    }

    return matchesSearch && matchesCategory;
  });

  renderStoresTable();
}

// Filter by category
function filterByCategory() {
  filterStores();
}

// Export to Excel
function exportToExcel() {
  const data = filteredData.map((store) => ({
    "Store Name": store.storeName,
    "Owner Name": store.ownerName,
    Slug: store.slug,
    Email: store.email,
    Phone: store.phone,
    Location: store.location,
    Category: Array.isArray(store.category) ? store.category.join("; ") : (store.category || ""),
    Description: store.storeDescription,
  }));

  const worksheet = createWorksheet(data);
  downloadExcel(worksheet, "stores_export.xlsx");
}

// Export to CSV
function exportToCSV() {
  const headers = [
    "Store Name",
    "Owner Name",
    "Slug",
    "Email",
    "Phone",
    "Location",
    "Category",
    "Description",
  ];
  const csvContent = [
    headers.join(","),
    ...filteredData.map((store) =>
      [
        escapeCSV(store.storeName),
        escapeCSV(store.ownerName),
        escapeCSV(store.slug),
        escapeCSV(store.email),
        escapeCSV(store.phone),
        escapeCSV(store.location),
        escapeCSV(Array.isArray(store.category) ? store.category.join("; ") : (store.category || "")),
        escapeCSV(store.storeDescription),
      ].join(",")
    ),
  ].join("\n");

  downloadCSV(csvContent, "stores_export.csv");
}

// Helper function to escape CSV values
function escapeCSV(value) {
  if (typeof value !== "string") value = String(value);
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

// Create Excel worksheet
function createWorksheet(data) {
  const headers = Object.keys(data[0] || {});
  const rows = [
    headers,
    ...data.map((row) => headers.map((header) => row[header])),
  ];

  return rows
    .map((row) => row.map((cell) => `<td>${cell || ""}</td>`).join(""))
    .map((row) => `<tr>${row}</tr>`)
    .join("");
}

// Download Excel file
function downloadExcel(content, filename) {
  const html = `
                <html>
                    <head><meta charset="utf-8"></head>
                    <body>
                        <table border="1">
                            ${content}
                        </table>
                    </body>
                </html>
            `;

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Download CSV file
function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// API call to backend (real implementation)
async function fetchStoresFromAPI() {
  try {
    const response = await fetch(`${API_BASE}/store/all-stores`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`Failed to fetch stores: ${response.status}`);
    const data = await response.json();
    const list = Array.isArray(data) ? data : data.stores || [];
    // Normalize fields used by table and filters
    return list.map((s) => ({
      logo: s.logo || s.image || "",
      storeName: s.storeName || s.name || s.title || "",
      ownerName: s.ownerName || s.owner || s.owner_email || "",
      email: s.email || s.ownerEmail || "",
      phone: s.phone || s.ownerPhone || "",
      location: s.location || s.address || "",
      slug: s.slug || s.storeSlug || "",
      category: s.categoryList || s.categories || s.category || [],
      storeDescription: s.storeDescription || s.description || "",
    })).map((s) => {
      // Ensure category is string or array consistently
      if (!s.category) s.category = [];
      if (typeof s.category === "string") {
        s.category = s.category
          .split(/[,;]+/)
          .map((x) => x.trim())
          .filter(Boolean);
      }
      return s;
    });
  } catch (error) {
    console.error("Error fetching stores:", error);
    document.getElementById("stores-container").innerHTML = `
                    <div class="error-message">
                        Failed to load stores. Please try again later.
                    </div>
                `;
    return [];
  }
}

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  // Auth guard for admin pages
  enforceAdminAuth();

  // Bind logout if present
  const logout = document.getElementById("adminLogoutBtn");
  if (logout) {
    logout.addEventListener("click", adminLogout);
  }

  initializeStores();
});

// ===== Admin auth helpers =====
function getAdminToken() {
  try {
    return localStorage.getItem("adminJWT");
  } catch (_) {
    return null;
  }
}

function enforceAdminAuth() {
  const t = getAdminToken();
  if (!t) {
    // Replace to avoid back navigation to a protected page
    window.location.replace("./adminLogin.html");
  }
}

function adminLogout() {
  try {
    localStorage.removeItem("adminJWT");
  } catch (_) {}
  // Clear history entry for current page and go to login
  try { history.replaceState(null, "", "./adminLogin.html"); } catch (_) {}
  window.location.replace("./adminLogin.html");
}

// Handle BFCache back-forward navigation: force re-check
window.addEventListener("pageshow", function (e) {
  if (!getAdminToken()) {
    window.location.replace("./adminLogin.html");
  }
});
