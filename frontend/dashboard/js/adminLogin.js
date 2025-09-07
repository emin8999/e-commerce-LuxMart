document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://116.203.51.133:9090/home";
  const form = document.getElementById("tab-admin");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // отменяем стандартное поведение формы

    // Берем значения полей как строки
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    // Создаем объект данных для JSON
    const dataToSend = {
      email: email,
      password: password,
    };

    // Логируем в консоль то, что отправляем
    console.log("Отправляем на бэк:", dataToSend);

    try {
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // обязательно для JSON
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const result = await response.json();
      console.log("Ответ от сервера:", result);

      // Проверяем, есть ли токен в ответе
      if (result && result.token) {
        // Сохраняем JWT в localStorage
        localStorage.setItem("adminJWT", result.token);
        console.log("JWT успешно сохранен в localStorage");

        // Редирект на admin.html
        window.location.href = "admin.html";
      } else {
        console.error("❌ JWT не найден в ответе сервера");
      }
    } catch (err) {
      console.error("❌ Ошибка при отправке:", err);
    }
  });
});
