document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const alertBox = document.getElementById('loginAlert');
  
    try {
      const res = await fetch('/api/login', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error();
  
      const data = await res.json();
      localStorage.setItem('cc_user', JSON.stringify(data.user));
  
      /* ---- redirección por rol ---- */
      if (data.user.role === 'admin') {
        window.location.href = '/admin.html?view=enlazar';
      } else if (data.user.role === 'guia') {
        window.location.href = '/reservas_asignadas';
      } else {
        window.location.href = '/user';
      }
    } catch {
      alertBox.classList.remove('d-none', 'alert-success');
      alertBox.classList.add('alert-danger');
      alertBox.textContent = 'Credenciales inválidas';
    }
  });
