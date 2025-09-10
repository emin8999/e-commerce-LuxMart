// Store data - Bu backend-dən gələcək data
let storesData = [];
let filteredData = [];

// Sample data - Backend API-dən gələcək
// const mockStoresData = [
//   {
//     storeName: "Tech Haven",
//     ownerName: "Anar Mammadov",
//     slug: "tech-haven",
//     email: "anar@techhaven.az",
//     storeDescription: "Premium electronics and gadgets store",
//     logo: "https://via.placeholder.com/100x100/667eea/ffffff?text=TH",
//     phone: "+994 12 555 0101",
//     location: "Baku, Azerbaijan",
//     category: "electronics",
//   },
//   {
//     storeName: "Fashion Forward",
//     ownerName: "Leyla Hasanova",
//     slug: "fashion-forward",
//     email: "leyla@fashionforward.az",
//     storeDescription: "Trendy clothing and accessories",
//     logo: "https://via.placeholder.com/100x100/764ba2/ffffff?text=FF",
//     phone: "+994 12 555 0102",
//     location: "Baku, Azerbaijan",
//     category: "fashion",
//   },
//   {
//     storeName: "Book Paradise",
//     ownerName: "Rashad Aliyev",
//     slug: "book-paradise",
//     email: "rashad@bookparadise.az",
//     storeDescription: "Wide collection of books and educational materials",
//     logo: "https://via.placeholder.com/100x100/28a745/ffffff?text=BP",
//     phone: "+994 12 555 0103",
//     location: "Baku, Azerbaijan",
//     category: "books",
//   },
//   {
//     storeName: "Gourmet Corner",
//     ownerName: "Nigar Qasimova",
//     slug: "gourmet-corner",
//     email: "nigar@gourmetcorner.az",
//     storeDescription: "Organic foods and specialty ingredients",
//     logo: "https://via.placeholder.com/100x100/ffc107/ffffff?text=GC",
//     phone: "+994 12 555 0104",
//     location: "Baku, Azerbaijan",
//     category: "food",
//   },
//   {
//     storeName: "Sport Zone",
//     ownerName: "Elvin Huseynov",
//     slug: "sport-zone",
//     email: "elvin@sportzone.az",
//     storeDescription: "Sports equipment and fitness gear",
//     logo: "https://via.placeholder.com/100x100/dc3545/ffffff?text=SZ",
//     phone: "+994 12 555 0105",
//     location: "Baku, Azerbaijan",
//     category: "sports",
//   },
// ];

// Initialize data
function initializeStores() {
  // Bu hissədə real API çağrısı olacaq
  setTimeout(() => {
    storesData = mockStoresData;
    filteredData = [...storesData];
    renderStoresTable();
  }, 1000);
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
                                  store.category || "general"
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
  const categories = [
    ...new Set(
      storesData
        .map((store) => store.category)
        .filter((cat) => cat && cat !== "general" && cat !== "")
    ),
  ].sort();

  // Clear and repopulate options
  categoryFilter.innerHTML = '<option value="">All Categories</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.toLowerCase();
    option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
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
    const matchesSearch =
      store.storeName.toLowerCase().includes(searchTerm) ||
      store.ownerName.toLowerCase().includes(searchTerm) ||
      store.email.toLowerCase().includes(searchTerm);
    const matchesCategory =
      !categoryFilter || store.category === categoryFilter;

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
    Category: store.category,
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
        escapeCSV(store.category),
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
    const response = await fetch("/api/stores"); // Backend endpoint
    if (!response.ok) throw new Error("Failed to fetch stores");
    const stores = await response.json();
    return stores;
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
  initializeStores();
});
