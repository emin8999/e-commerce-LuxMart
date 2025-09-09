// Simple profile page behavior
(function(){
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      try {
        localStorage.removeItem('Jwt');
      } catch(_) {}
      // After logout, go to login
      window.location.href = './login.html';
    });
  }

  // Optional: protect page if not logged in
  try {
    const token = localStorage.getItem('Jwt');
    if (!token || token.length === 0) {
      // redirect to login if not authenticated
      // Comment out if you want to allow anonymous view
      window.location.replace('./login.html');
    }
  } catch(_) {}
})();

