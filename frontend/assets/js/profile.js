// Profile.js - Sizin backend API-nız üçün tam hazır kod
// GET: http://116.203.51.133/luxmart/api/profile
// PUT: http://116.203.51.133/luxmart/api/update/{id}
document.addEventListener("DOMContentLoaded", function () {
  // ===== API KONFİQURASİYASI =====
  const API_BASE_URL = "http://116.203.51.133/luxmart/api";
  const API_ENDPOINTS = {
    getProfile: API_BASE_URL + "/profile",
    updateProfile: function (userId) {
      return API_BASE_URL + "/update/" + userId;
    },
  };
  // ===== UTILITY FUNKSIYALARI =====
  function getElement(elementId) {
    return document.getElementById(elementId);
  }
  function getJwtToken() {
    try {
      return localStorage.getItem("Jwt");
    } catch (error) {
      console.error("JWT token alınmadı:", error);
      return null;
    }
  }
  function createApiHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };
    const token = getJwtToken();
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }
    return headers;
  }
  function setLoadingState(isLoading, message) {
    const loadingEl = getElement("loading");
    const saveBtn = getElement("saveBtn");
    if (loadingEl) {
      loadingEl.textContent = isLoading ? message || "Yüklənir..." : "";
    }
    if (saveBtn) {
      saveBtn.disabled = isLoading;
    }
  }
  function showMessage(type, text) {
    const statusEl = getElement("status");
    if (statusEl) {
      statusEl.className = "status " + (type || "");
      statusEl.textContent = text || "";
    }
  }
  function clearDebug() {
    const debugEl = getElement("debug");
    if (debugEl) {
      debugEl.textContent = "";
    }
  }
  function showDebug(info) {
    const debugEl = getElement("debug");
    if (debugEl) {
      debugEl.textContent = info;
    }
  }
  // ===== AUTHENTİKASİYA YOXLAMASI =====
  function checkAuth() {
    const token = getJwtToken();
    if (!token) {
      console.warn("JWT token yoxdur, login səhifəsinə yönləndirilir");
      window.location.replace("./login.html");
      return false;
    }
    return true;
  }
  // ===== LOGOUT =====
  function handleLogout() {
    try {
      localStorage.removeItem("Jwt");
    } catch (error) {
      console.error("Logout xətası:", error);
    }
    window.location.href = "./login.html";
  }
  // ===== PROFİL MƏLUMATLARINI YÜKLƏMƏ =====
  function loadProfile() {
    console.log("Profil yüklənir...");
    setLoadingState(true, "Profil məlumatları alınır...");
    showMessage("", "");
    clearDebug();
    fetch(API_ENDPOINTS.getProfile, {
      method: "GET",
      headers: createApiHeaders(),
    })
      .then(function (response) {
        console.log("GET /profile - Status:", response.status);
        if (!response.ok) {
          throw new Error(
            "Server xətası: " + response.status + " " + response.statusText
          );
        }
        return response.json();
      })
      .then(function (profileData) {
        console.log("Profil məlumatları alındı:", profileData);
        // Backend response: {id, email, name, surname, address, phone, roles, createdAt, updatedAt}
        fillForm(profileData);
        showMessage("success", "Profil məlumatları yükləndi");
      })
      .catch(function (error) {
        console.error("Profil yükləmə xətası:", error);
        showMessage("error", "Profil yüklənə bilmədi: " + error.message);
        showDebug("Xəta: " + error.toString());
      })
      .finally(function () {
        setLoadingState(false);
      });
  }
  // ===== FORMU DOLDURMA =====
  function fillForm(data) {
    console.log("Form doldurulur...");
    // HTML field mappings
    const fieldMappings = [
      { htmlId: "id", backendKey: "id" },
      { htmlId: "email", backendKey: "email" },
      { htmlId: "name", backendKey: "name" },
      { htmlId: "surname", backendKey: "surname" },
      { htmlId: "address", backendKey: "address" },
      { htmlId: "phone", backendKey: "phone" },
    ];
    fieldMappings.forEach(function (mapping) {
      const element = getElement(mapping.htmlId);
      if (element) {
        const value = data[mapping.backendKey];
        element.value =
          value !== null && value !== undefined ? String(value) : "";
        console.log("Field set:", mapping.htmlId, "=", element.value);
      } else {
        console.warn("HTML element tapılmadı:", mapping.htmlId);
      }
    });
  }
  // ===== PROFİL YENİLƏMƏ =====
  function saveProfile(event) {
    event.preventDefault();
    console.log("Profil yadda saxlanılır...");
    // User ID götür
    const idElement = getElement("id");
    if (!idElement || !idElement.value.trim()) {
      showMessage("error", "User ID tapılmadı");
      return;
    }
    const userId = idElement.value.trim();
    // Update payload hazırla - Backend qəbul edən sahələr: name, surname, address, phone
    const updateData = {
      name: getFieldValue("name"),
      surname: getFieldValue("surname"),
      address: getFieldValue("address"),
      phone: getFieldValue("phone"),
    };
    // Null/empty dəyərləri də göndəririk (backend-də null ola bilər)
    console.log("Göndəriləcək məlumat:", updateData);
    setLoadingState(true, "Profil yenilənir...");
    showMessage("", "");
    fetch(API_ENDPOINTS.updateProfile(userId), {
      method: "PUT",
      headers: createApiHeaders(),
      body: JSON.stringify(updateData),
    })
      .then(function (response) {
        console.log("PUT /update/" + userId + " - Status:", response.status);
        if (!response.ok) {
          return response.text().then(function (errorText) {
            throw new Error(
              "Yeniləmə xətası: " + response.status + " - " + errorText
            );
          });
        }
        // Response JSON olaraq parse et (mətn də ola bilər)
        return response.json().catch(function () {
          return { success: true }; // Əgər JSON deyilsə, müvəffəqiyyətli say
        });
      })
      .then(function (result) {
        console.log("Yeniləmə nəticəsi:", result);
        showMessage("success", "Profil uğurla yeniləndi!");
        // Profili yenidən yükləyək ki, yenilənmiş məlumatları göstərək
        setTimeout(function () {
          loadProfile();
        }, 1500);
      })
      .catch(function (error) {
        console.error("Profil yeniləmə xətası:", error);
        showMessage("error", "Yeniləmə uğursuz oldu: " + error.message);
        showDebug("Xəta: " + error.toString());
      })
      .finally(function () {
        setLoadingState(false);
      });
  }
  // ===== FIELD DƏYƏRİ GÖTÜRMƏ =====
  function getFieldValue(elementId) {
    const element = getElement(elementId);
    if (element) {
      const value = element.value.trim();
      return value.length > 0 ? value : null;
    }
    return null;
  }
  // ===== EVENT LISTENER QURMA =====
  function setupEvents() {
    // Profile form submit
    const form = getElement("profileForm");
    if (form) {
      form.addEventListener("submit", saveProfile);
      console.log("Form submit event əlavə edildi");
    } else {
      console.error("profileForm elementi tapılmadı!");
    }
    // Logout button
    const logoutBtn = getElement("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", handleLogout);
      console.log("Logout button event əlavə edildi");
    } else {
      console.warn("logoutBtn elementi tapılmadı");
    }
  }
  // ===== SƏHIFƏ BAŞLANGICı =====
  function initPage() {
    console.log("=== Profile səhifəsi başlanır ===");
    // Auth yoxla
    if (!checkAuth()) {
      return;
    }
    // Events qur
    setupEvents();
    // Profili yüklə
    loadProfile();
    console.log("=== Profile səhifəsi hazır ===");
  }
  // Başlat
  initPage();
});
