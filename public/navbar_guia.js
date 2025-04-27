/* navbar_guia.js
   Controla visibilidad, saludo y enlace activo para GUÍAS */
   (function () {
    const user = JSON.parse(localStorage.getItem('cc_user') || 'null');
  
    /* Si no existe sesión de guía, redirigir a login */
    if (!user || user.role !== 'guia') {
      window.location.href = '/login';
      return;
    }
  
    /* Mostrar saludo + logout */
    document.getElementById('userWelcome').classList.remove('d-none');
    document.getElementById('userWelcome').textContent = `Hola, ${user.name}!`;
    document.getElementById('logoutNav').classList.remove('d-none');
    document.getElementById('loginNav').classList.add('d-none');
  
    document.getElementById('logoutLink').onclick = e => {
      e.preventDefault();
      localStorage.removeItem('cc_user');
      window.location.href = '/login';
    };
  
    /* Resaltar el enlace activo basado en la ruta */
    const path = location.pathname;
    const map  = { '/reservas_asignadas': 'resNav', '/perfilguia': 'perfilNav' };
    const id   = map[path];
    if (id) document.getElementById(id).classList.add('active');
  })();
  