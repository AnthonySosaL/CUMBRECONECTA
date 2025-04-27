// admin.js – Panel de administración
// Esperar a que el DOM esté listo antes de ejecutar cualquier código
window.addEventListener('DOMContentLoaded', function () {
  // --- INICIO DEL BLOQUE PRINCIPAL ---
  const user = JSON.parse(localStorage.getItem('cc_user') || 'null');
  if (!user || user.role !== 'admin') {
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
  const secciones = ['adminHome','adminEnlazar','adminCrearExp','adminReservas','adminPerfil'];
  function mostrar(id) {
    secciones.forEach(s => document.getElementById(s).classList.add('d-none'));
    document.getElementById(id).classList.remove('d-none');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (id==='adminHome') document.getElementById('navHome').classList.add('active');
    if (id==='adminEnlazar') {
      document.getElementById('navEnlazar').classList.add('active');
      if (typeof cargarDatos === 'function') cargarDatos();
    }
    if (id==='adminCrearExp') document.getElementById('navCrearExp').classList.add('active');
    if (id==='adminReservas') {
      document.getElementById('navReservas').classList.add('active');
      if (typeof cargarReservas === 'function') cargarReservas();
    }
    if (id==='adminPerfil') document.getElementById('navPerfil').classList.add('active');
  }
  document.getElementById('navHome').onclick = e => { e.preventDefault(); mostrar('adminHome'); };
  document.getElementById('navEnlazar').onclick = e => { e.preventDefault(); mostrar('adminEnlazar'); };
  document.getElementById('navCrearExp').onclick = e => { e.preventDefault(); mostrar('adminCrearExp'); };
  document.getElementById('navReservas').onclick = e => { e.preventDefault(); mostrar('adminReservas'); };
  document.getElementById('navPerfil').onclick = e => { e.preventDefault(); mostrar('adminPerfil'); };
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'enlazar') {
    mostrar('adminEnlazar');
  } else {
    mostrar('adminHome');
  }

  // === Lógica para crear expedición ===
  const form = document.getElementById('formCrearExp');
  if (!form) return;
  let fechas = [];
  const fechasList = document.getElementById('fechasList');
  const btnAddFecha = document.getElementById('btnAddFecha');
  const inputFecha = document.getElementById('nuevaFecha');
  const inputHora = document.getElementById('nuevaHora');
  const msg = document.getElementById('crearExpMsg');

  function renderFechas() {
    fechasList.innerHTML = '';
    if (!fechas.length) {
      fechasList.innerHTML = '<div class="text-muted small">Agrega al menos una fecha y hora.</div>';
      return;
    }
    fechas.forEach((f, i) => {
      const div = document.createElement('div');
      div.className = 'd-flex align-items-center gap-2 mb-1';
      div.innerHTML = `<span>${f.fecha} ${f.hora}</span> <button type="button" class="btn btn-sm btn-danger" data-i="${i}"><i class="bi bi-x"></i></button>`;
      fechasList.appendChild(div);
      div.querySelector('button').onclick = () => {
        fechas.splice(i, 1);
        renderFechas();
      };
    });
  }

  btnAddFecha.onclick = function() {
    const fecha = inputFecha.value;
    const hora = inputHora.value;
    if (!fecha || !hora) {
      msg.className = 'alert alert-danger mt-3';
      msg.textContent = 'Debes ingresar fecha y hora.';
      msg.classList.remove('d-none');
      return;
    }
    if (fechas.some(f => f.fecha === fecha && f.hora === hora)) {
      msg.className = 'alert alert-warning mt-3';
      msg.textContent = 'Esa fecha y hora ya fue agregada.';
      msg.classList.remove('d-none');
      return;
    }
    fechas.push({ fecha, hora });
    renderFechas();
    msg.classList.add('d-none');
  };

  form.onsubmit = async function(e) {
    e.preventDefault();
    msg.classList.add('d-none');
    // Validaciones
    const nombre = document.getElementById('expNombre').value.trim();
    const imagen = document.getElementById('expImagen').value.trim();
    const precio = Number(document.getElementById('expPrecio').value);
    const cupo = Number(document.getElementById('expCupo').value);
    if (!nombre || !imagen || !precio || !cupo || !fechas.length) {
      msg.className = 'alert alert-danger mt-3';
      msg.textContent = 'Completa todos los campos y agrega al menos una fecha.';
      msg.classList.remove('d-none');
      return;
    }
    if (precio <= 0 || cupo <= 0) {
      msg.className = 'alert alert-danger mt-3';
      msg.textContent = 'Precio y cupo deben ser mayores a cero.';
      msg.classList.remove('d-none');
      return;
    }
    const datos = { nombre, imagen, precio, cupo, fechas };
    try {
      const res = await fetch('/api/expediciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      msg.className = 'alert alert-success mt-3';
      msg.innerHTML = 'Expedición creada correctamente.<br><pre style="white-space:pre-wrap;word-break:break-all;">' + JSON.stringify(data.expedicion, null, 2) + '</pre>';
      msg.classList.remove('d-none');
      // Limpiar formulario y fechas
      form.reset();
      fechas.length = 0;
      renderFechas();
      // Actualizar secciones de enlazar guía y reservas SOLO si están visibles
      if (document.getElementById('adminEnlazar') && !document.getElementById('adminEnlazar').classList.contains('d-none') && typeof window.cargarDatosEnlazarGuia === 'function') {
        window.cargarDatosEnlazarGuia();
      }
      if (document.getElementById('adminReservas') && !document.getElementById('adminReservas').classList.contains('d-none') && typeof window.cargarReservasAdmin === 'function') {
        window.cargarReservasAdmin();
      }
      msg.innerHTML += '<br><span class="text-success">Listas de expediciones y reservas actualizadas.</span>';
    } catch {
      msg.className = 'alert alert-danger mt-3';
      msg.textContent = 'Error al crear la expedición. Intenta de nuevo.';
      msg.classList.remove('d-none');
    }
  };
  renderFechas();

  // === Lógica para enlazar guía con expedición ===
  const formEnlazar = document.getElementById('formEnlazarGuia');
  if (!formEnlazar) return;
  const expSel = document.getElementById('enlazarExpedicion');
  const guiasList = document.getElementById('enlazarGuiasList');
  const msgEnlazar = document.getElementById('enlazarMsg');
  let expediciones = [], guias = [];

  async function cargarDatos() {
    // Cargar expediciones
    try {
      expediciones = await (await fetch('/api/expediciones')).json();
      expSel.innerHTML = '';
      expediciones.forEach(e => {
        expSel.insertAdjacentHTML('beforeend', `<option value="${e.id}">${e.nombre}</option>`);
      });
    } catch {
      expSel.innerHTML = '<option value="">Error cargando expediciones</option>';
    }
    // Cargar guías
    try {
      const users = await (await fetch('/data/users.json')).json();
      guias = users.filter(u => u.role === 'guia');
      renderGuias();
    } catch {
      guiasList.innerHTML = '<div class="text-danger">Error cargando guías</div>';
    }
  }

  function renderGuias() {
    guiasList.innerHTML = '';
    if (!guias.length) {
      guiasList.innerHTML = '<div class="text-muted">No hay guías disponibles.</div>';
      return;
    }
    guias.forEach(g => {
      const id = 'guia_' + g.id;
      guiasList.insertAdjacentHTML('beforeend',
        `<div class="form-check">
          <input class="form-check-input" type="checkbox" value="${g.id}" id="${id}">
          <label class="form-check-label" for="${id}">${g.name} (${g.email})</label>
        </div>`
      );
    });
  }

  formEnlazar.onsubmit = async function(e) {
    e.preventDefault();
    msgEnlazar.classList.add('d-none');
    const idExp = expSel.value;
    const idsGuias = [...guiasList.querySelectorAll('input[type=checkbox]:checked')].map(i => Number(i.value));
    if (!idExp || !idsGuias.length) {
      msgEnlazar.className = 'alert alert-danger mt-3';
      msgEnlazar.textContent = 'Selecciona una expedición y al menos un guía.';
      msgEnlazar.classList.remove('d-none');
      return;
    }
    // Simulación de guardado (ajustar backend real después)
    msgEnlazar.className = 'alert alert-success mt-3';
    msgEnlazar.textContent = 'Guía(s) enlazado(s) correctamente (simulado).';
    msgEnlazar.classList.remove('d-none');
    formEnlazar.reset();
  };

  cargarDatos();

  // === Lógica para ver todas las reservas (admin) ===
  const tabla = document.getElementById('tablaReservas').querySelector('tbody');
  const msgReservas = document.getElementById('adminReservasMsg');
  const filtroEstado = document.getElementById('filtroEstado');
  const filtroExpedicion = document.getElementById('filtroExpedicion');
  let reservas = [], expedicionesReservas = [];

  async function cargarReservas() {
    msgReservas.classList.add('d-none');
    tabla.innerHTML = '<tr><td colspan="8">Cargando...</td></tr>';
    try {
      reservas = await (await fetch('/api/reservas')).json();
      expedicionesReservas = await (await fetch('/api/expediciones')).json();
      // Poblar filtro de expediciones
      filtroExpedicion.innerHTML = '<option value="">Todas las expediciones</option>';
      expedicionesReservas.forEach(e => {
        filtroExpedicion.insertAdjacentHTML('beforeend', `<option value="${e.nombre}">${e.nombre}</option>`);
      });
      renderTabla();
    } catch {
      tabla.innerHTML = '';
      msgReservas.className = 'alert alert-danger mt-3';
      msgReservas.textContent = 'Error al cargar reservas.';
      msgReservas.classList.remove('d-none');
    }
  }

  function renderTabla() {
    let filtradas = reservas;
    if (filtroEstado.value) filtradas = filtradas.filter(r => r.estado === filtroEstado.value);
    if (filtroExpedicion.value) filtradas = filtradas.filter(r => r.expNombre === filtroExpedicion.value);
    if (!filtradas.length) {
      tabla.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No hay reservas para mostrar.</td></tr>';
      return;
    }
    tabla.innerHTML = '';
    filtradas.forEach(r => {
      const estadoClass = r.estado === 'pagado' ? 'success' : r.estado === 'pendiente' ? 'warning' : 'danger';
      tabla.insertAdjacentHTML('beforeend', `
        <tr>
          <td>${r.id_reserva || '-'}</td>
          <td>${r.expNombre || '-'}</td>
          <td>${r.fecha || '-'}</td>
          <td>${r.hora || '-'}</td>
          <td>${r.participantes || '-'}</td>
          <td>${r.email || '-'}</td>
          <td><span class="badge bg-${estadoClass}">${r.estado}</span></td>
          <td><button class="btn btn-sm btn-outline-primary ver-detalle" data-id="${r.id_reserva}">Ver detalle</button></td>
        </tr>
      `);
    });
    // Acciones de ver detalle
    tabla.querySelectorAll('.ver-detalle').forEach(b => {
      b.onclick = () => mostrarDetalle(b.dataset.id);
    });
  }

  function mostrarDetalle(id) {
    const r = reservas.find(x => String(x.id_reserva) === String(id));
    if (!r) return;
    let html = `<div class='mb-2'><b>ID:</b> ${r.id_reserva}</div>
      <div class='mb-2'><b>Expedición:</b> ${r.expNombre}</div>
      <div class='mb-2'><b>Fecha:</b> ${r.fecha}</div>
      <div class='mb-2'><b>Hora:</b> ${r.hora || '-'}</div>
      <div class='mb-2'><b>Participantes:</b> ${r.participantes}</div>
      <div class='mb-2'><b>Usuario:</b> ${r.email}</div>
      <div class='mb-2'><b>Estado:</b> ${r.estado}</div>
      <div class='mb-2'><b>Equipos:</b> ${(r.equipos||[]).join(', ') || 'Ninguno'}</div>
      <div class='mb-2'><b>Total:</b> $${r.total||'-'}</div>`;
    if (r.motivos) {
      if (r.estado === 'pagado' && r.motivos.motivo_aceptacion) {
        html += `<div class='mb-2'><b>Motivo de aceptación:</b> ${r.motivos.motivo_aceptacion}</div>`;
      } else if (r.estado === 'rechazada' && r.motivos.motivo_rechazo) {
        html += `<div class='mb-2'><b>Motivo de rechazo:</b> ${r.motivos.motivo_rechazo}</div>`;
      } else if (r.estado === 'pendiente' && r.motivos.motivo_pendiente) {
        html += `<div class='mb-2'><b>Motivo de pendiente:</b> ${r.motivos.motivo_pendiente}</div>`;
      }
    }
    document.getElementById('modalReservaAdminBody').innerHTML = html;
    const modal = new bootstrap.Modal(document.getElementById('modalReservaAdmin'));
    modal.show();
  }

  filtroEstado.onchange = renderTabla;
  filtroExpedicion.onchange = renderTabla;

  // Cargar reservas al entrar a la sección
  document.getElementById('navReservas').addEventListener('click', cargarReservas);

  // === Gestión de expediciones (tabla, eliminar, editar) ===
  const tablaExp = document.getElementById('tablaExpediciones').querySelector('tbody');
  const msgExp = document.getElementById('expedicionesMsg');
  let expedicionesLista = [];

  async function cargarExpediciones() {
    msgExp.classList.add('d-none');
    tablaExp.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';
    try {
      const res = await fetch('/api/expediciones');
      expedicionesLista = await res.json();
      renderTablaExpediciones();
    } catch {
      tablaExp.innerHTML = '';
      msgExp.className = 'alert alert-danger mt-3';
      msgExp.textContent = 'Error al cargar expediciones.';
      msgExp.classList.remove('d-none');
    }
  }

  function renderTablaExpediciones() {
    if (!expedicionesLista.length) {
      tablaExp.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay expediciones registradas.</td></tr>';
      return;
    }
    tablaExp.innerHTML = '';
    expedicionesLista.forEach(exp => {
      const fechas = exp.fechas.map(f => `${f.fecha} ${f.hora}`).join('<br>');
      tablaExp.insertAdjacentHTML('beforeend', `
        <tr>
          <td>${exp.id}</td>
          <td>${exp.nombre}</td>
          <td><img src="${exp.imagen}" alt="img" style="max-width:60px;max-height:40px;"></td>
          <td>$${exp.precio}</td>
          <td>${exp.cupo}</td>
          <td style="font-size:0.95em">${fechas}</td>
          <td>
            <button class="btn btn-sm btn-warning me-1 btn-edit-exp" data-id="${exp.id}"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-danger btn-del-exp" data-id="${exp.id}"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `);
    });
    // Asignar eventos eliminar
    tablaExp.querySelectorAll('.btn-del-exp').forEach(btn => {
      btn.onclick = async function() {
        const id = btn.getAttribute('data-id');
        if (!confirm('¿Seguro que deseas eliminar esta expedición?')) return;
        try {
          const res = await fetch(`/api/expediciones/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error();
          msgExp.className = 'alert alert-success mt-3';
          msgExp.textContent = 'Expedición eliminada correctamente.';
          msgExp.classList.remove('d-none');
          cargarExpediciones();
          if (typeof cargarDatos === 'function') cargarDatos(); // refresca select en enlazar
        } catch {
          msgExp.className = 'alert alert-danger mt-3';
          msgExp.textContent = 'Error al eliminar la expedición.';
          msgExp.classList.remove('d-none');
        }
      };
    });
    // Asignar eventos editar (modal simple)
    tablaExp.querySelectorAll('.btn-edit-exp').forEach(btn => {
      btn.onclick = function() {
        const id = btn.getAttribute('data-id');
        const exp = expedicionesLista.find(e => String(e.id) === String(id));
        if (!exp) return;
        mostrarModalEditarExp(exp);
      };
    });
  }

  // Modal para editar expedición
  function mostrarModalEditarExp(exp) {
    let modal = document.getElementById('modalEditarExp');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modalEditarExp';
      modal.className = 'modal fade';
      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <form id="formEditExp">
              <div class="modal-header">
                <h5 class="modal-title">Editar expedición</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <input type="hidden" id="editExpId">
                <div class="mb-2"><label class="form-label">Nombre</label><input type="text" class="form-control" id="editExpNombre" required></div>
                <div class="mb-2"><label class="form-label">Imagen (URL)</label><input type="url" class="form-control" id="editExpImagen" required></div>
                <div class="mb-2"><label class="form-label">Precio</label><input type="number" class="form-control" id="editExpPrecio" min="1" required></div>
                <div class="mb-2"><label class="form-label">Cupo</label><input type="number" class="form-control" id="editExpCupo" min="1" required></div>
                <div class="mb-2"><label class="form-label">Fechas (formato: yyyy-mm-dd HH:MM, separadas por coma)</label><input type="text" class="form-control" id="editExpFechas" required></div>
                <div id="editExpMsg" class="alert mt-2 d-none"></div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary">Guardar cambios</button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              </div>
            </form>
          </div>
        </div>`;
      document.body.appendChild(modal);
    }
    // Rellenar datos
    document.getElementById('editExpId').value = exp.id;
    document.getElementById('editExpNombre').value = exp.nombre;
    document.getElementById('editExpImagen').value = exp.imagen;
    document.getElementById('editExpPrecio').value = exp.precio;
    document.getElementById('editExpCupo').value = exp.cupo;
    document.getElementById('editExpFechas').value = exp.fechas.map(f => `${f.fecha} ${f.hora}`).join(', ');
    document.getElementById('editExpMsg').classList.add('d-none');
    // Evento submit
    document.getElementById('formEditExp').onsubmit = async function(e) {
      e.preventDefault();
      const id = document.getElementById('editExpId').value;
      const nombre = document.getElementById('editExpNombre').value.trim();
      const imagen = document.getElementById('editExpImagen').value.trim();
      const precio = Number(document.getElementById('editExpPrecio').value);
      const cupo = Number(document.getElementById('editExpCupo').value);
      const fechasStr = document.getElementById('editExpFechas').value.trim();
      let fechas = [];
      try {
        fechas = fechasStr.split(',').map(f => {
          const [fecha, hora] = f.trim().split(' ');
          if (!fecha || !hora) throw new Error();
          return { fecha, hora };
        });
      } catch {
        document.getElementById('editExpMsg').className = 'alert alert-danger mt-2';
        document.getElementById('editExpMsg').textContent = 'Formato de fechas incorrecto.';
        document.getElementById('editExpMsg').classList.remove('d-none');
        return;
      }
      try {
        const res = await fetch(`/api/expediciones/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, imagen, precio, cupo, fechas })
        });
        if (!res.ok) throw new Error();
        document.getElementById('editExpMsg').className = 'alert alert-success mt-2';
        document.getElementById('editExpMsg').textContent = 'Expedición actualizada correctamente.';
        document.getElementById('editExpMsg').classList.remove('d-none');
        cargarExpediciones();
        if (typeof cargarDatos === 'function') cargarDatos();
        setTimeout(() => {
          const modalEl = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditarExp'));
          modalEl.hide();
        }, 900);
      } catch {
        document.getElementById('editExpMsg').className = 'alert alert-danger mt-2';
        document.getElementById('editExpMsg').textContent = 'Error al actualizar la expedición.';
        document.getElementById('editExpMsg').classList.remove('d-none');
      }
    };
    const modalEl = new bootstrap.Modal(document.getElementById('modalEditarExp'));
    modalEl.show();
  }

  // Cargar expediciones al mostrar la sección
  document.getElementById('navCrearExp').addEventListener('click', cargarExpediciones);
  // También al inicio si ya está visible
  if (!document.getElementById('adminCrearExp').classList.contains('d-none')) cargarExpediciones();

  // === Perfil admin ===
  const formPerfil = document.getElementById('formPerfilAdmin');
  const msgPerfil = document.getElementById('perfilMsg');
  function cargarPerfilAdmin() {
    const user = JSON.parse(localStorage.getItem('cc_user') || 'null');
    if (!user) return;
    document.getElementById('perfilNombre').value = user.name || '';
    document.getElementById('perfilEmail').value = user.email || '';
    document.getElementById('perfilNumero').value = user.numero || '';
    document.getElementById('perfilPassword').value = '';
    msgPerfil.classList.add('d-none');
  }
  if (formPerfil) {
    formPerfil.onsubmit = async function(e) {
      e.preventDefault();
      msgPerfil.classList.add('d-none');
      const nombre = document.getElementById('perfilNombre').value.trim();
      const email = document.getElementById('perfilEmail').value.trim();
      const numero = document.getElementById('perfilNumero').value.trim();
      const password = document.getElementById('perfilPassword').value;
      if (!nombre || !email) {
        msgPerfil.className = 'alert alert-danger mt-3';
        msgPerfil.textContent = 'Nombre y correo son obligatorios.';
        msgPerfil.classList.remove('d-none');
        return;
      }
      const user = JSON.parse(localStorage.getItem('cc_user') || 'null');
      if (!user) return;
      try {
        const res = await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nombre, email, numero, password: password || undefined })
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        localStorage.setItem('cc_user', JSON.stringify(data.user));
        msgPerfil.className = 'alert alert-success mt-3';
        msgPerfil.textContent = 'Perfil actualizado correctamente.';
        msgPerfil.classList.remove('d-none');
        cargarPerfilAdmin();
      } catch {
        msgPerfil.className = 'alert alert-danger mt-3';
        msgPerfil.textContent = 'Error al actualizar el perfil.';
        msgPerfil.classList.remove('d-none');
      }
    };
    // Cargar datos al mostrar la sección
    document.getElementById('navPerfil').addEventListener('click', cargarPerfilAdmin);
    // Si ya está visible al cargar
    if (!document.getElementById('adminPerfil').classList.contains('d-none')) cargarPerfilAdmin();
  }
});
