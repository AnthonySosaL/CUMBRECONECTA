/* =========================================================================
   user.js  –  Panel de usuario con catálogo atractivo + precio
   ========================================================================= */
   (async function () {
    /* ---------- control de sesión ---------- */
    const user = JSON.parse(localStorage.getItem('cc_user') || 'null');
    if (!user || user.role !== 'user') {
      window.location.href = '/login';
      return;
    }
  
    /* saludo y logout */
    document.getElementById('userWelcome').classList.remove('d-none');
    document.getElementById('userWelcome').textContent = `Hola, ${user.name}!`;
    document.getElementById('logoutLink').onclick = e => {
      e.preventDefault();
      localStorage.removeItem('cc_user');
      window.location.href = '/login';
    };
  
    /* ---------- cargar expediciones ---------- */
    try {
      const res  = await fetch('/api/expediciones');
      const exps = await res.json();
      const reservas = await (await fetch('/api/reservas')).json();
      const grid = document.getElementById('catalogo');

      exps.forEach(exp => {
        // Buscar la próxima fecha+hora con cupos disponibles
        let prox = null;
        for (const f of exp.fechas) {
          const reservados = reservas.filter(r => r.id_expedicion == exp.id && r.fecha === f.fecha && r.hora === f.hora && r.estado !== 'rechazada').reduce((sum, r) => sum + Number(r.participantes||0), 0);
          if (exp.cupo - reservados > 0) {
            prox = { ...f, cupos: exp.cupo - reservados };
            break;
          }
        }
        const col = document.createElement('div');
        col.className = 'col-sm-6 col-lg-4';
        col.innerHTML = `
          <div class="card h-100 shadow-sm border-0">
            <div class="position-relative">
              <img src="${exp.imagen}" alt="${exp.nombre}"
                   class="card-img-top" style="height:250px;object-fit:cover;">
              <span class="badge bg-success position-absolute top-0 end-0 m-2 fs-6">
                $${exp.precio}
              </span>
            </div>
            <div class="card-body d-flex flex-column">
              <h5 class="card-title mb-2">${exp.nombre}</h5>
              <p class="text-muted mb-1">Próxima salida: ${prox ? prox.fecha + ' ' + prox.hora : 'Sin fechas disponibles'}</p>
              <p class="mb-2"><b>Cupos restantes:</b> <span class="text-${prox && prox.cupos>0?'success':'danger'}">${prox && prox.cupos>0?prox.cupos:'Agotado'}</span></p>
              <button class="btn btn-brand mt-auto" ${prox && prox.cupos>0 ? '' : 'disabled'}>Reservar</button>
            </div>
          </div>`;
        grid.appendChild(col);
        if (prox && prox.cupos>0) {
          col.querySelector('.btn').addEventListener('click', () => {
            window.location.href = `/reserve?exp=${exp.id}`;
          });
        }
      });
    } catch {
      document.getElementById('catalogo').innerHTML =
        '<p class="text-danger">No se pudieron cargar las expediciones.</p>';
    }
  })();
