(function () {
    const user = JSON.parse(localStorage.getItem('cc_user') || 'null');
    const loginLink = document.getElementById('loginNav');
    const logoutLi  = document.getElementById('logoutNav');
    const panelLi   = document.getElementById('panelNav');
    const welcome   = document.getElementById('userWelcome');
    const logoutBtn = document.getElementById('logoutLink');
    const navUl     = document.querySelector('.navbar-nav');

    if (user) {
      loginLink.classList.add('d-none');
      logoutLi.classList.remove('d-none');
      welcome.classList.remove('d-none');
      welcome.textContent = `Hola, ${user.name}!`;

      if (user.role === 'user') {
        panelLi.classList.remove('d-none');
        // Elimina opciones de guía si existen
        const guiaNavs = document.querySelectorAll('.guia-only');
        guiaNavs.forEach(el => el.remove());
      } else if (user.role === 'guia') {
        panelLi.classList.add('d-none');
        // Agrega opciones solo si no existen
        if (!document.getElementById('reservasAsignadasNav')) {
          const li1 = document.createElement('li');
          li1.className = 'nav-item guia-only';
          li1.id = 'reservasAsignadasNav';
          li1.innerHTML = '<a class="nav-link" href="/reservas_asignadas">Reservas asignadas</a>';
          navUl.insertBefore(li1, logoutLi);
        }
        if (!document.getElementById('perfilGuiaNav')) {
          const li2 = document.createElement('li');
          li2.className = 'nav-item guia-only';
          li2.id = 'perfilGuiaNav';
          li2.innerHTML = '<a class="nav-link" href="/perfilguia">Perfil</a>';
          navUl.insertBefore(li2, logoutLi);
        }
      } else if (user.role === 'admin') {
        panelLi.classList.add('d-none');
        // Elimina opciones de guía si existen
        const guiaNavs = document.querySelectorAll('.guia-only');
        guiaNavs.forEach(el => el.remove());
        // Agrega opción de panel admin si no existe
        if (!document.getElementById('adminPanelNav')) {
          const li = document.createElement('li');
          li.className = 'nav-item';
          li.id = 'adminPanelNav';
          li.innerHTML = '<a class="nav-link" href="/admin.html">Panel admin</a>';
          navUl.insertBefore(li, logoutLi);
        }
      }
    } else {
      loginLink.classList.remove('d-none');
      logoutLi.classList.add('d-none');
      panelLi.classList.add('d-none');
      welcome.classList.add('d-none');
      // Elimina opciones de guía si existen
      const guiaNavs = document.querySelectorAll('.guia-only');
      guiaNavs.forEach(el => el.remove());
    }

    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('cc_user');
      window.location.href = '/login';
    });
  })();
