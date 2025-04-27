(async function(){
  // --- sesión y control de rol ---
  const user = JSON.parse(localStorage.getItem('cc_user')||'null');
  if(!user || user.role !== 'guia'){
    window.location.href = '/login';
    return;
  }
  document.getElementById('userWelcome').classList.remove('d-none');
  document.getElementById('userWelcome').textContent = `Hola, ${user.name}!`;
  document.getElementById('logoutLink').onclick = e => {
    e.preventDefault();
    localStorage.removeItem('cc_user');
    window.location.href = '/login';
  };

  // --- cargar reservas asignadas ---
  let reservas = [];
  try {
    reservas = await (await fetch('/api/reservas')).json();
    const grid = document.getElementById('listadoReservas');
    const empty = document.getElementById('sinReservas');
    // Filtrar reservas donde el id del guía esté en id_guias
    const asignadas = reservas.filter(r => Array.isArray(r.id_guias) && r.id_guias.includes(user.id));
    if(!asignadas.length){
      empty.classList.remove('d-none');
      return;
    }
    grid.innerHTML = '';
    asignadas.forEach(r => {
      // Ajuste: si estado es 'rechazada', usar 'falla' para color
      const status = r.estado === 'pagado' ? 'pagado' : r.estado === 'pendiente' ? 'pendiente' : (r.estado === 'rechazada' ? 'falla' : 'falla');
      const card = document.createElement('div');
      card.className = 'col-sm-10 col-md-6 col-lg-4';
      card.innerHTML = `
        <div class="card-reserva status-${status}" data-id="${r.id_reserva}">
          <div class="d-flex justify-content-between align-items-start">
            <h5 class="mb-0">${r.expNombre}</h5>
            <span class="badge badge-${status} text-uppercase">${r.estado}</span>
          </div>
          <div class="info mt-2"><i class="bi bi-calendar-event"></i>${r.fecha}</div>
          <div class="info"><i class="bi bi-people"></i>${r.participantes}</div>
          ${r.equipos?.length?`<div class="info"><i class="bi bi-briefcase"></i>${r.equipos.join(', ')}</div>`:''}
          <h6 class="fw-semibold text-end mt-3 mb-0">$${r.total}</h6>
        </div>`;
      grid.appendChild(card);
      // Click para abrir modal
      card.querySelector('.card-reserva').onclick = () => mostrarModal(r.id_reserva);
    });
  } catch {
    document.getElementById('listadoReservas').innerHTML = '<p class="text-danger">No se pudieron cargar las reservas.</p>';
  }

  // --- Modal y cambio de estado ---
  let reservaActual = null;
  window.mostrarModal = function(id) {
    reservaActual = reservas.find(r => r.id_reserva == id);
    if (!reservaActual) return;
    // Detalles
    const body = document.getElementById('modalReservaBody');
    // Ajuste: badge color para 'rechazada'
    const badgeClass = reservaActual.estado === 'pagado' ? 'pagado' : reservaActual.estado === 'pendiente' ? 'pendiente' : (reservaActual.estado === 'rechazada' ? 'falla' : 'falla');
    let motivoHtml = '';
    if (reservaActual.motivos) {
      if (reservaActual.estado === 'pagado' && reservaActual.motivos.motivo_aceptacion) {
        motivoHtml = `<div class='mb-2'><strong>Motivo aceptación:</strong> ${reservaActual.motivos.motivo_aceptacion}</div>`;
      } else if (reservaActual.estado === 'rechazada' && reservaActual.motivos.motivo_rechazo) {
        motivoHtml = `<div class='mb-2'><strong>Motivo rechazo:</strong> ${reservaActual.motivos.motivo_rechazo}</div>`;
      } else if (reservaActual.estado === 'pendiente' && reservaActual.motivos.motivo_pendiente) {
        motivoHtml = `<div class='mb-2'><strong>Motivo pendiente:</strong> ${reservaActual.motivos.motivo_pendiente}</div>`;
      }
    }
    body.innerHTML = `
      <div class="mb-2"><strong>Expedición:</strong> ${reservaActual.expNombre}</div>
      <div class="mb-2"><strong>Fecha:</strong> ${reservaActual.fecha}</div>
      <div class="mb-2"><strong>Participantes:</strong> ${reservaActual.participantes}</div>
      <div class="mb-2"><strong>Email usuario:</strong> ${reservaActual.email}</div>
      <div class="mb-2"><strong>Equipos:</strong> ${reservaActual.equipos?.join(', ') || 'Ninguno'}</div>
      <div class="mb-2"><strong>Total:</strong> $${reservaActual.total}</div>
      <div class="mb-2"><strong>Estado actual:</strong> <span class="badge badge-${badgeClass}">${reservaActual.estado}</span></div>
      ${motivoHtml}
    `;
    // Estado select
    const estadoSelect = document.getElementById('estadoSelect');
    estadoSelect.value = reservaActual.estado === 'rechazada' ? 'rechazada' : reservaActual.estado;
    // Motivos inputs dinámicos
    let motivoInputs = {
      pagado: document.getElementById('motivoAceptacion'),
      rechazada: document.getElementById('motivoRechazo'),
      pendiente: document.getElementById('motivoPendiente')
    };
    if (!motivoInputs.pagado) {
      // Crear inputs si no existen
      const footer = estadoSelect.parentElement.parentElement;
      const inputAcept = document.createElement('input');
      inputAcept.type = 'text';
      inputAcept.id = 'motivoAceptacion';
      inputAcept.className = 'form-control form-control-sm ms-2 d-none';
      inputAcept.placeholder = 'Motivo de aceptación';
      inputAcept.style.maxWidth = '220px';
      footer.insertBefore(inputAcept, footer.children[footer.children.length-1]);
      const inputPend = document.createElement('input');
      inputPend.type = 'text';
      inputPend.id = 'motivoPendiente';
      inputPend.className = 'form-control form-control-sm ms-2 d-none';
      inputPend.placeholder = 'Motivo de pendiente';
      inputPend.style.maxWidth = '220px';
      footer.insertBefore(inputPend, footer.children[footer.children.length-1]);
      motivoInputs = {
        pagado: inputAcept,
        rechazada: document.getElementById('motivoRechazo'),
        pendiente: inputPend
      };
    }
    motivoInputs.pagado.value = reservaActual.motivos?.motivo_aceptacion || '';
    motivoInputs.rechazada.value = reservaActual.motivos?.motivo_rechazo || '';
    motivoInputs.pendiente.value = reservaActual.motivos?.motivo_pendiente || '';
    // Mostrar solo el input correspondiente
    Object.entries(motivoInputs).forEach(([estado, input]) => {
      input.classList.toggle('d-none', estadoSelect.value !== estado);
    });
    estadoSelect.onchange = () => {
      Object.entries(motivoInputs).forEach(([estado, input]) => {
        input.classList.toggle('d-none', estadoSelect.value !== estado);
      });
    };
    // Limpiar mensajes
    document.getElementById('modalMsg').classList.add('d-none');
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalReserva'));
    modal.show();
  };

  document.getElementById('guardarEstadoBtn').onclick = async function() {
    if (!reservaActual) return;
    const nuevoEstado = document.getElementById('estadoSelect').value;
    const motivoAcept = document.getElementById('motivoAceptacion').value.trim();
    const motivoRech = document.getElementById('motivoRechazo').value.trim();
    const motivoPend = document.getElementById('motivoPendiente').value.trim();
    let motivoPayload = {};
    if (nuevoEstado === 'pagado') {
      if (!motivoAcept) {
        const msg = document.getElementById('modalMsg');
        msg.className = 'alert alert-danger m-3 mb-0 p-2';
        msg.textContent = 'Debes ingresar un motivo de aceptación.';
        msg.classList.remove('d-none');
        return;
      }
      motivoPayload.motivo_aceptacion = motivoAcept;
    } else if (nuevoEstado === 'rechazada') {
      if (!motivoRech) {
        const msg = document.getElementById('modalMsg');
        msg.className = 'alert alert-danger m-3 mb-0 p-2';
        msg.textContent = 'Debes ingresar un motivo de rechazo.';
        msg.classList.remove('d-none');
        return;
      }
      motivoPayload.motivo_rechazo = motivoRech;
    } else if (nuevoEstado === 'pendiente') {
      if (!motivoPend) {
        const msg = document.getElementById('modalMsg');
        msg.className = 'alert alert-danger m-3 mb-0 p-2';
        msg.textContent = 'Debes ingresar un motivo de pendiente.';
        msg.classList.remove('d-none');
        return;
      }
      motivoPayload.motivo_pendiente = motivoPend;
    }
    try {
      const res = await fetch(`/api/reservas/${reservaActual.id_reserva}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado, ...motivoPayload })
      });
      if (!res.ok) throw new Error();
      // Actualizar en memoria y UI
      reservaActual.estado = nuevoEstado;
      if (!reservaActual.motivos) reservaActual.motivos = { motivo_aceptacion: '', motivo_rechazo: '', motivo_pendiente: '' };
      if (motivoPayload.motivo_aceptacion) reservaActual.motivos.motivo_aceptacion = motivoPayload.motivo_aceptacion;
      if (motivoPayload.motivo_rechazo) reservaActual.motivos.motivo_rechazo = motivoPayload.motivo_rechazo;
      if (motivoPayload.motivo_pendiente) reservaActual.motivos.motivo_pendiente = motivoPayload.motivo_pendiente;
      // Actualizar la card en la lista
      const card = document.querySelector(`.card-reserva[data-id="${reservaActual.id_reserva}"]`);
      if (card) {
        const status = reservaActual.estado === 'pagado' ? 'pagado' : reservaActual.estado === 'pendiente' ? 'pendiente' : (reservaActual.estado === 'rechazada' ? 'falla' : 'falla');
        card.className = `card-reserva status-${status}`;
        card.querySelector('.badge').className = `badge badge-${status} text-uppercase`;
        card.querySelector('.badge').textContent = reservaActual.estado;
      }
      // Mensaje éxito
      const msg = document.getElementById('modalMsg');
      msg.className = 'alert alert-success m-3 mb-0 p-2';
      msg.textContent = 'Estado actualizado correctamente';
      msg.classList.remove('d-none');
    } catch {
      const msg = document.getElementById('modalMsg');
      msg.className = 'alert alert-danger m-3 mb-0 p-2';
      msg.textContent = 'Error al actualizar el estado';
      msg.classList.remove('d-none');
    }
  };
})();
