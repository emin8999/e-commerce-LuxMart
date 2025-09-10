// Simple profile page behavior
(function () {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      try {
        localStorage.removeItem("Jwt");
      } catch (_) {}
      // After logout, go to login
      window.location.href = "./login.html";
    });
  }

  // Optional: protect page if not logged in
  try {
    const token = localStorage.getItem("Jwt");
    if (!token || token.length === 0) {
      // redirect to login if not authenticated
      // Comment out if you want to allow anonymous view
      window.location.replace("./login.html");
    }
  } catch (_) {}
})();

// === CONFIG ===
// Backend endpoints per comment in HTML: GET /luxmart/api/profile
const API_ROOT = "http://116.203.51.133/luxmart/api";
const PROFILE_URL = `${API_ROOT}/profile`;
const UPDATE_URL = (id) => `${API_ROOT}/update/${encodeURIComponent(id)}`;

// === HELPERS ===
const $ = (id) => document.getElementById(id);

function setLoading(isLoading, msg = "") {
  $("saveBtn").disabled = isLoading;
  $("loading").textContent = isLoading ? msg || "Loading…" : "";
}

function setStatus(type, msg) {
  const el = $("status");
  el.className = "status " + (type || "");
  el.textContent = msg || "";
}

function buildHeaders() {
  const h = { "Content-Type": "application/json" };
  try {
    const token = localStorage.getItem("Jwt");
    if (token) h["Authorization"] = `Bearer ${token}`;
  } catch (_) {}
  return h;
}

// Небольшая валидация телефона (мягкая)
function normalizePhone(v) {
  return String(v || "").trim();
}

// === FETCH PROFILE ===
async function loadProfile() {
  setLoading(true, "Loading profile…");
  setStatus("", "");
  try {
    const res = await fetch(PROFILE_URL, {
      method: "GET",
      headers: buildHeaders(),
    });

    if (!res.ok) {
      throw new Error(`GET /profile failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    // Ожидаем, что сервер вернёт объект профиля. Подстройте поля под свой бэкенд:
    // Пример ожидаемых полей: { id, firstName, lastName, email, phone, address }
    $("id").value = data.id ?? data.userId ?? "";
    $("firstName").value = data.firstName ?? data.name ?? "";
    $("email").value = data.email ?? "";

    $("lastName").value = data.lastName ?? data.surname ?? "";
    $("address").value = data.address ?? "";
    $("phone").value = data.phone ?? "";

    setStatus("ok", "Profile loaded.");
    $("debug").textContent = ""; // можно вывести JSON для отладки
  } catch (err) {
    console.error(err);
    setStatus("err", err.message || "Failed to load profile.");
    $("debug").textContent = String(err);
  } finally {
    setLoading(false);
  }
}

// === UPDATE / UPSERT PROFILE FIELDS ===
async function saveProfile(e) {
  e.preventDefault();
  setStatus("", "");
  const id = $("id").value.trim();
  if (!id) {
    setStatus("err", "User ID is missing. Cannot update.");
    return;
  }

  // Берём только редактируемые/добавляемые поля
  const payload = {
    lastName: $("lastName").value.trim() || null,
    address: $("address").value.trim() || null,
    phone: normalizePhone($("phone").value) || null,
  };

  setLoading(true, "Saving…");
  try {
    const res = await fetch(UPDATE_URL(id), {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `PUT /update/${id} failed: ${res.status} ${res.statusText} ${
          text || ""
        }`
      );
    }

    // Предположим, что API возвращает обновлённый профиль
    const updated = await res.json().catch(() => ({}));

    // Обновим форму (если сервер вернул новые значения)
    if (updated) {
      if (typeof updated.lastName !== "undefined")
        $("lastName").value = updated.lastName ?? "";
      if (typeof updated.address !== "undefined")
        $("address").value = updated.address ?? "";
      if (typeof updated.phone !== "undefined")
        $("phone").value = updated.phone ?? "";
    }

    setStatus("ok", "Profile updated successfully.");
  } catch (err) {
    console.error(err);
    setStatus("err", err.message || "Failed to update profile.");
  } finally {
    setLoading(false);
  }
}

// === INIT ===
document.addEventListener("DOMContentLoaded", () => {
  $("profileForm").addEventListener("submit", saveProfile);
  loadProfile();
});
