(async function(){
  /* --- sesión --- */
  const user=JSON.parse(localStorage.getItem('cc_user')||'null');
  if(!user){window.location.href='/login';return;}

  document.getElementById('userWelcome').classList.remove('d-none');
  document.getElementById('userWelcome').textContent=`Hola, ${user.name}!`;
  document.getElementById('logoutLink').onclick=e=>{
    e.preventDefault();localStorage.removeItem('cc_user');window.location.href='/login';
  };

  /* --- reservas --- */
  try{
    const reservas=await (await fetch('/api/reservas')).json();
    const grid=document.getElementById('listadoReservas');
    const empty=document.getElementById('sinReservas');

    const mias=reservas.filter(r=>r.email===user.email||r.id_usuario===user.id);
    if(!mias.length){empty.classList.remove('d-none');return;}

    // --- Notificación toast de cambio de estado (una por cada cambio) ---
    const lastEstados = JSON.parse(localStorage.getItem('cc_reservas_estados')||'{}');
    const cambios = [];
    mias.forEach(r=>{
      const prevEstado = lastEstados[r.id_reserva];
      if(prevEstado && prevEstado !== r.estado) {
        cambios.push({
          id: r.id_reserva,
          nombre: r.expNombre,
          estado: r.estado
        });
      }
      lastEstados[r.id_reserva] = r.estado;
    });
    localStorage.setItem('cc_reservas_estados', JSON.stringify(lastEstados));
    if (cambios.length) {
      // Elimina toasts previos si existen
      document.querySelectorAll('.toast-estado-cambio').forEach(t => t.remove());
      const toastContainer = document.querySelector('.toast-container');
      cambios.forEach(c => {
        // Crea un toast individual
        const toastDiv = document.createElement('div');
        toastDiv.className = `toast align-items-center text-white toast-estado-cambio bg-${c.estado==='rechazada'?'danger':c.estado==='pagado'?'success':'primary'} border-0 mb-2`;
        toastDiv.setAttribute('role','alert');
        toastDiv.setAttribute('aria-live','assertive');
        toastDiv.setAttribute('aria-atomic','true');
        toastDiv.innerHTML = `
          <div class='d-flex'>
            <div class='toast-body'>
              <b>Reserva ${c.nombre}</b> (#${c.id})<br>
              Estado: <span class='text-capitalize'>${c.estado}</span><br>
              <a href='#' class='toast-detalle-link text-decoration-underline text-light'>¿Deseas ver más detalles? Haz clic aquí</a>
            </div>
            <button type='button' class='btn-close btn-close-white me-2 m-auto' data-bs-dismiss='toast' aria-label='Cerrar'></button>
          </div>`;
        toastContainer.appendChild(toastDiv);
        // Solo el link es clickeable
        toastDiv.querySelector('.toast-detalle-link').onclick = function(e) {
          e.preventDefault();
          const modal = new bootstrap.Modal(document.getElementById('modalToastInfo'));
          modal.show();
        };
        // Muestra el toast
        setTimeout(()=>{
          const toast = new bootstrap.Toast(toastDiv);
          toast.show();
        }, 100);
      });
    }

    mias.forEach(r=>{
      const status=r.estado==='pagado'?'pagado':r.estado==='pendiente'?'pendiente':'falla';
      grid.insertAdjacentHTML('beforeend',`
        <div class="col-sm-10 col-md-6 col-lg-4">
          <div class="card-reserva status-${status}" data-id="${r.id_reserva}">
            <div class="d-flex justify-content-between align-items-start">
              <h5 class="mb-0">${r.expNombre}</h5>
              <span class="badge badge-${status} text-uppercase">${r.estado}</span>
            </div>
            <div class="info mt-2"><i class="bi bi-calendar-event"></i>${r.fecha}</div>
            <div class="info"><i class="bi bi-people"></i>${r.participantes}</div>
            ${r.equipos?.length?`<div class="info"><i class="bi bi-briefcase"></i>${r.equipos.join(', ')}</div>`:''}
            <h6 class="fw-semibold text-end mt-3 mb-0">$${r.total}</h6>
          </div>
        </div>`);
    });

    // Mostrar modal de detalles al hacer click en una card
    grid.querySelectorAll('.card-reserva').forEach(card => {
      card.onclick = async function() {
        const idReserva = Number(card.getAttribute('data-id'));
        const reserva = mias.find(r => r.id_reserva == idReserva);
        let caso = null;
        try {
          const res = await fetch('/api/casos/' + reserva.id_reserva);
          if (res.ok) caso = await res.json();
        } catch {}
        // --- Obtener datos de los guías ---
        let guiasHtml = '';
        if (Array.isArray(reserva.id_guias) && reserva.id_guias.length) {
          try {
            const users = await (await fetch('/data/users.json')).json();
            const guias = users.filter(u => reserva.id_guias.includes(u.id));
            guiasHtml = `<div class='mb-2'><b>Guías asignados:</b><ul>` +
              guias.map(g => `<li>${g.name} (${g.numero || 'sin número'})</li>`).join('') +
              `</ul></div>`;
          } catch {}
        }
        let detalles = `<div class='mb-2'><b>Expedición:</b> ${reserva.expNombre}</div>
          <div class='mb-2'><b>Fecha:</b> ${reserva.fecha}</div>
          <div class='mb-2'><b>Participantes:</b> ${reserva.participantes}</div>
          <div class='mb-2'><b>Estado:</b> ${reserva.estado}</div>
          <div class='mb-2'><b>Total:</b> $${reserva.total}</div>`;
        // Mostrar motivo según estado
        if (reserva.motivos) {
          if (reserva.estado === 'pagado' && reserva.motivos.motivo_aceptacion) {
            detalles += `<div class='mb-2'><b>Motivo de aceptación:</b> ${reserva.motivos.motivo_aceptacion}</div>`;
          } else if (reserva.estado === 'rechazada' && reserva.motivos.motivo_rechazo) {
            detalles += `<div class='mb-2'><b>Motivo de rechazo:</b> ${reserva.motivos.motivo_rechazo}</div>`;
          } else if (reserva.estado === 'pendiente' && reserva.motivos.motivo_pendiente) {
            detalles += `<div class='mb-2'><b>Motivo de pendiente:</b> ${reserva.motivos.motivo_pendiente}</div>`;
          }
        }
        if (guiasHtml) detalles += guiasHtml;
        if (caso && (caso.detalles || caso.resolucion)) {
          detalles += `<hr><div class='mb-2'><b>Detalles adicionales:</b> ${caso.detalles||''}</div>`;
          detalles += `<div class='mb-2'><b>Resolución:</b> ${caso.resolucion||''}</div>`;
        }
        // Crear y mostrar modal dinámico
        let modalDiv = document.getElementById('modalDetallesReserva');
        if (!modalDiv) {
          modalDiv = document.createElement('div');
          modalDiv.id = 'modalDetallesReserva';
          modalDiv.className = 'modal fade modal-paleta';
          modalDiv.tabIndex = -1;
          modalDiv.innerHTML = `
            <div class='modal-dialog modal-dialog-centered'>
              <div class='modal-content'>
                <div class='modal-header'>
                  <h5 class='modal-title'>Detalles de la reserva</h5>
                  <button type='button' class='btn-close' data-bs-dismiss='modal' aria-label='Cerrar'></button>
                </div>
                <div class='modal-body' id='modalDetallesBody'></div>
                <div class='modal-footer'>
                  <button type='button' class='btn btn-brand' data-bs-dismiss='modal'>Cerrar</button>
                </div>
              </div>
            </div>`;
          document.body.appendChild(modalDiv);
        }
        document.getElementById('modalDetallesBody').innerHTML = detalles;
        const modal = new bootstrap.Modal(modalDiv);
        modal.show();
      };
    });
  }catch{
    document.getElementById('listadoReservas')
            .innerHTML='<p class="text-danger">No se pudieron cargar las reservas.</p>';
  }
})();
