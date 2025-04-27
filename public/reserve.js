(async function () {
  // Obtener datos de usuario y expedición
  const user = JSON.parse(localStorage.getItem('cc_user') || 'null');
  if (!user) { window.location.href = '/login'; return; }

  const idExp = new URLSearchParams(location.search).get('exp');
  let precioUnit = 0, expNombre = '', fechas = [], expFechas = [];
  try {
    const expediciones = await (await fetch('/api/expediciones')).json();
    const exp = expediciones.find(e => String(e.id) === String(idExp));
    if (!exp) throw new Error('Expedición no encontrada');
    expNombre  = exp.nombre;
    precioUnit = exp.precio;
    fechas     = exp.fechas;
    expFechas  = exp.fechas; // Guardar fechas con cupos_restantes
    document.getElementById('expNombre').textContent = exp.nombre;
    document.getElementById('expPrecio').textContent = `Precio por persona: $${exp.precio}`;
    document.querySelector('.hero-expedicion').style.backgroundImage = `url('${exp.imagen}')`;
    // Mostrar fechas disponibles con cupos
    const fechaSelect = document.getElementById('fecha');
    fechaSelect.innerHTML = '';
    fechas.forEach(f => {
      fechaSelect.insertAdjacentHTML('beforeend', `<option value="${f.fecha}|${f.hora}">${f.fecha} ${f.hora} (Cupos: ${f.cupos_restantes})</option>`);
    });
  } catch (err) {
    alert('Expedición no encontrada');
    window.location.href = '/user';
    return;
  }

  // Calcular total
  const inpPart = document.getElementById('participantes');
  const lblTot  = document.getElementById('total');
  inpPart.oninput = () => {
    const val = Number(inpPart.value) || 0;
    lblTot.textContent = `$${(val * precioUnit).toFixed(2)}`;
  };
  inpPart.oninput();

  // Botón para ver datos seleccionados y reservar
  document.getElementById('btnLogDatos').onclick = function() {
    const equipos = [...document.querySelectorAll('input[type=checkbox]:checked')].map(i => i.value);
    const fechaInput = document.getElementById('fecha').value;
    const inpPart = document.getElementById('participantes').value;
    let fechaSel = '', horaSel = '';
    if (fechaInput) {
      [fechaSel, horaSel] = fechaInput.split('|');
    }
    // Buscar la opción seleccionada en expFechas
    const f = expFechas.find(f => f.fecha === fechaSel && f.hora === horaSel);
    const cuposRest = f ? f.cupos_restantes : 0;
    const puedeReservar = cuposRest >= Number(inpPart);
    const datos = {
      id_expedicion: idExp,
      expNombre: expNombre,
      fecha: fechaSel,
      hora: horaSel,
      participantes: inpPart,
      equipos,
      email: user.email
    };
    let msg = `Datos seleccionados: ${JSON.stringify(datos, null, 2)}<br>`;
    let el = document.getElementById('verDatosMsg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'verDatosMsg';
      el.className = 'alert alert-info mt-3';
      document.getElementById('formReserva').appendChild(el);
    }
    if (!puedeReservar) {
      msg += '<span class="text-danger">No se puede reservar: no hay cupos suficientes.</span>';
      el.innerHTML = msg;
      return;
    }
    msg += '<span class="text-success">Reserva posible. Redirigiendo a pago...</span>';
    el.innerHTML = msg;
    // Guardar datos en localStorage para la pasarela
    localStorage.setItem('cc_reserva_demo', JSON.stringify({ ...datos, total: (Number(inpPart) * precioUnit).toFixed(2) }));
    // Redirigir a la pasarela de pago
    window.location.href = `/pay?monto=${(Number(inpPart) * precioUnit).toFixed(2)}`;
  };
})();
