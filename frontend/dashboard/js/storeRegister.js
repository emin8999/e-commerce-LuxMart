document.addEventListener("DOMContentLoaded", () => {
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
      alert("Passwords do not match!");
      return;
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
    formData.append("agreedToTerms", form.agreedToTerms.checked ? true : false);

    // === Файл ===
    if (form.logo.files.length > 0) {
      formData.append("logo", form.logo.files[0]); // как MultipartFile
    }

    // === Логируем FormData как массив объектов ===
    const debugData = [];
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        debugData.push({
          field: key,
          type: "File",
          name: value.name,
          size: value.size + " bytes",
          mime: value.type,
        });
      } else {
        debugData.push({
          field: key,
          value: value,
          type: typeof value,
        });
      }
    }
    console.log("📤 Отправляемые данные:", debugData);

    try {
      const response = await fetch(
        "http://116.203.51.133/luxmart/store/register",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Ошибка: ${response.status} → ${text}`);
      }

      const result = await response.json();
      console.log("✅ Успешная регистрация:", result);
      alert("Store registered successfully!");
    } catch (error) {
      console.error("❌ Ошибка при отправке:", error);
      alert("Произошла ошибка при регистрации: " + error.message);
    }
  });
});
