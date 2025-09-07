document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://116.203.51.133:9090/home";
  const clientForm = document.getElementById("tab-client");

  clientForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // предотвращаем перезагрузку страницы

    // Собираем данные из формы
    const formData = new FormData(clientForm);
    const data = {};

    // Преобразуем все значения в строки
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // Выводим в консоль полностью то, что отправляем
    console.log("=== Данные для отправки на бэк ===");
    console.log(data);

    try {
      const response = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      console.log("=== Ответ от сервера ===");
      console.log(result);

      if (response.ok) {
        alert("Регистрация успешна!");
      } else {
        alert("Ошибка регистрации: " + (result.message || response.status));
      }
    } catch (error) {
      console.error("Ошибка при отправке:", error);
    }
  });
});
