document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://116.203.51.133:9090"; // сервер бэкенда
  const form = document.getElementById("tab-store");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const passwordError = document.getElementById("passwordError");

  // 🔹 Проверка совпадения паролей в реальном времени
  function validatePasswords() {
    if (confirmPasswordInput.value.length === 0) {
      passwordError.style.display = "none";
      confirmPasswordInput.classList.remove("error-input");
      return true;
    }

    if (passwordInput.value !== confirmPasswordInput.value) {
      passwordError.style.display = "block";
      confirmPasswordInput.classList.add("error-input");
      return false;
    } else {
      passwordError.style.display = "none";
      confirmPasswordInput.classList.remove("error-input");
      return true;
    }
  }

  confirmPasswordInput.addEventListener("input", validatePasswords);
  passwordInput.addEventListener("input", validatePasswords);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validatePasswords()) {
      alert("Пароли не совпадают");
      return;
    }

    // Согласие с условиями обязательно (соответствует проверке на бэке)
    if (!form.agreedToTerms.checked) {
      alert("Необходимо согласиться с условиями использования");
      return;
    }

    // Логотип обязателен (на бэке колонка logo nullable = false)
    if (!form.logo || form.logo.files.length === 0) {
      alert("Пожалуйста, загрузите логотип магазина");
      form.logo?.classList?.add("error-input");
      return;
    } else {
      form.logo.classList?.remove("error-input");
    }

    const formData = new FormData();

    // === Строковые поля ===
    formData.append("storeName", form.storeName.value);
    formData.append("ownerName", form.ownerName.value);
    formData.append("email", form.email.value);
    formData.append("password", form.password.value);
    formData.append("confirmPassword", form.confirmPassword.value);
    formData.append("storeDescription", form.storeDescription.value);
    formData.append("phone", form.phone.value);
    formData.append("location", form.location.value);
    formData.append("category", form.category.value);

    // === Boolean ===
    formData.append("agreedToTerms", form.agreedToTerms.checked ? "true" : "false");

    // === Файл ===
    // Логотип как MultipartFile (обязателен)
    formData.append("logo", form.logo.files[0]);

    // === Легкое логирование без чувствительных данных ===
    try {
      const safeLog = [];
      for (let [key, value] of formData.entries()) {
        if (key === "password" || key === "confirmPassword") {
          safeLog.push({ field: key, value: "***" });
        } else if (value instanceof File) {
          safeLog.push({ field: key, type: "File", name: value.name, size: `${value.size} bytes`, mime: value.type });
        } else {
          safeLog.push({ field: key, value: value });
        }
      }
      console.log("📤 Отправляемые данные:", safeLog);
    } catch (_) {}

    try {
      const response = await fetch(`${API_BASE}/home/store/register`, {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type") || "";
      const parseBody = async () =>
        contentType.includes("application/json") ? response.json() : response.text();

      if (!response.ok) {
        const errBody = await parseBody();
        const errMsg = typeof errBody === "string" ? errBody : errBody?.message || JSON.stringify(errBody);
        throw new Error(`Ошибка: ${response.status} → ${errMsg}`);
      }

      const body = await parseBody();
      console.log("✅ Успешная регистрация:", body);
      alert("Магазин успешно зарегистрирован");
    } catch (error) {
      console.error("❌ Ошибка при отправке:", error);
      alert("Произошла ошибка при регистрации: " + error.message);
    }
  });
});
