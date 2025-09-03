document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("adminJWT");
  if (!token) {
    // если токена нет — значит не авторизован → кидаем на логин
    window.location.href = "adminLogin.html";
  }
});
