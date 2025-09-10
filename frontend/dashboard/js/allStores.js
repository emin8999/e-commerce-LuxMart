// Store data - Bu backend-dən gələcək data
let storesData = [];
let filteredData = [];

// Sample data - Backend API-dən gələcək

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
                                    <img src="${store.logo}" alt="${
                              store.storeName
                            }" class="store-logo" 
                                         onerror="this.src='https://via.placeholder.com/50x50/667eea/ffffff?text=${store.storeName.charAt(
                                           0
                                         )}'">
                                </td>
                                <td><strong>${
                                  store.storeName
                                }</strong><br><small>${store.slug}</small></td>
                                <td>${store.ownerName}</td>
                                <td>${store.email}</td>
                                <td>${store.phone}</td>
                                <td>${store.location}</td>
                                <td><span class="store-category">${
                                  store.category
                                }</span></td>
                                <td>${store.storeDescription}</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            `;

  container.innerHTML = tableHTML;
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
