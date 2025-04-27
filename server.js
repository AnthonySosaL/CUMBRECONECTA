const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = 5000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use('/data', express.static(path.join(__dirname, 'data')));

// --- LOGIN ---
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/users.json')));
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  // Devuelve todos los campos excepto password
  const { password: _, ...userSafe } = user;
  res.json({ user: userSafe });
});

// --- EXPEDICIONES ---
app.get('/api/expediciones', (req, res) => {
  const expediciones = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/expediciones.json')));
  const reservas = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/reservas.json')));
  // Para cada expedición, agrega cupos_restantes a cada fecha/hora
  const expedicionesConCupos = expediciones.map(exp => {
    const fechasConCupos = exp.fechas.map(f => {
      // Suma de participantes ya reservados para esa fecha/hora (excepto rechazadas)
      const reservados = reservas.filter(r => String(r.id_expedicion) === String(exp.id) && r.fecha === f.fecha && (!r.hora || r.hora === f.hora) && r.estado !== 'rechazada').reduce((sum, r) => sum + Number(r.participantes || 0), 0);
      return {
        ...f,
        cupos_restantes: exp.cupo - reservados
      };
    });
    return {
      ...exp,
      fechas: fechasConCupos
    };
  });
  res.json(expedicionesConCupos);
});

// --- RESERVAS ---
app.get('/api/reservas', (req, res) => {
  const reservas = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/reservas.json')));
  res.json(reservas);
});

app.post('/api/reservas', (req, res) => {
  const reservasPath = path.join(__dirname, 'data/reservas.json');
  const expedicionesPath = path.join(__dirname, 'data/expediciones.json');
  const reservas = JSON.parse(fs.readFileSync(reservasPath));
  const expediciones = JSON.parse(fs.readFileSync(expedicionesPath));
  const { id_expedicion, fecha, participantes } = req.body;
  const exp = expediciones.find(e => e.id == id_expedicion);
  if (!exp) return res.status(400).json({ error: 'Expedición no encontrada' });
  const cupoMax = exp.cupo;
  // Suma de participantes ya reservados para esa fecha (excepto rechazadas)
  const reservados = reservas.filter(r => r.id_expedicion == id_expedicion && r.fecha === fecha && r.estado !== 'rechazada').reduce((sum, r) => sum + Number(r.participantes||0), 0);
  if (reservados + Number(participantes) > cupoMax) {
    return res.status(400).json({ error: 'No hay cupos suficientes para esta fecha' });
  }
  const nueva = {
    ...req.body,
    id_reserva: Date.now(),
    estado: 'pendiente',
    motivos: {
      motivo_aceptacion: '',
      motivo_rechazo: '',
      motivo_pendiente: ''
    }
  };
  reservas.push(nueva);
  fs.writeFileSync(reservasPath, JSON.stringify(reservas, null, 2));
  res.json({ id_reserva: nueva.id_reserva });
});

app.patch('/api/reservas/:id', (req, res) => {
  const reservasPath = path.join(__dirname, 'data/reservas.json');
  const reservas = JSON.parse(fs.readFileSync(reservasPath));
  const idx = reservas.findIndex(r => r.id_reserva == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Reserva no encontrada' });
  // Actualiza estado y motivos de forma dinámica
  const { estado, motivo_aceptacion, motivo_rechazo, motivo_pendiente } = req.body;
  if (estado) reservas[idx].estado = estado;
  if (!reservas[idx].motivos) reservas[idx].motivos = { motivo_aceptacion: '', motivo_rechazo: '', motivo_pendiente: '' };
  if (typeof motivo_aceptacion === 'string') reservas[idx].motivos.motivo_aceptacion = motivo_aceptacion;
  if (typeof motivo_rechazo === 'string') reservas[idx].motivos.motivo_rechazo = motivo_rechazo;
  if (typeof motivo_pendiente === 'string') reservas[idx].motivos.motivo_pendiente = motivo_pendiente;
  // Permite actualizar otros campos si es necesario
  Object.assign(reservas[idx], req.body);
  fs.writeFileSync(reservasPath, JSON.stringify(reservas, null, 2));
  res.json({ ok: true });
});

// --- EDITAR PERFIL USUARIO ---
app.patch('/api/users/:id', (req, res) => {
  const usersPath = path.join(__dirname, 'data/users.json');
  const users = JSON.parse(fs.readFileSync(usersPath));
  const idx = users.findIndex(u => u.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });

  // Solo actualiza los campos permitidos
  const { name, email, password, numero } = req.body;
  if (name) users[idx].name = name;
  if (email) users[idx].email = email;
  if (password) users[idx].password = password;
  if (numero) users[idx].numero = numero;

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  // Devuelve el usuario actualizado (sin password)
  const { password: _, ...userSafe } = users[idx];
  res.json({ user: userSafe });
});

// --- SPA fallback para rutas directas ---
app.use((req, res, next) => {
  const file = path.join(__dirname, 'public', req.path);
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return res.sendFile(file);
  // Agrega /perfil a las rutas amigables
  if (
    req.path === '/' ||
    req.path === '/user' ||
    req.path === '/login' ||
    req.path === '/mis_reservas' ||
    req.path === '/reserve' ||
    req.path === '/pay' ||
    req.path === '/perfil' ||
    req.path === '/perfilguia' || // <-- Agregado para guías
    req.path === '/reservas_asignadas' || // <-- Agregado para guías
    req.path === '/admin' // <-- Agregado para admin
  ) {
    return res.sendFile(path.join(__dirname, 'public', req.path.replace('/', '') + '.html'));
  }
  next();
});

// --- CREAR EXPEDICIÓN (ADMIN) ---
app.post('/api/expediciones', (req, res) => {
  console.log('Datos recibidos en /api/expediciones:', req.body); // <-- Imprime lo recibido del front
  const expedicionesPath = path.join(__dirname, 'data/expediciones.json');
  const expediciones = JSON.parse(fs.readFileSync(expedicionesPath));
  const { nombre, imagen, precio, cupo, fechas } = req.body;
  if (!nombre || !imagen || !precio || !cupo || !Array.isArray(fechas) || !fechas.length) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }
  // Validar fechas únicas
  const fechasUnicas = [];
  for (const f of fechas) {
    if (!f.fecha || !f.hora) return res.status(400).json({ error: 'Fecha y hora requeridas' });
    if (fechasUnicas.some(x => x.fecha === f.fecha && x.hora === f.hora)) {
      return res.status(400).json({ error: 'Fechas/horas duplicadas' });
    }
    fechasUnicas.push(f);
  }
  // Nuevo ID autoincremental
  const nuevoId = expediciones.length ? Math.max(...expediciones.map(e => Number(e.id))) + 1 : 1;
  const nuevaExp = {
    id: nuevoId,
    nombre,
    imagen,
    precio: Number(precio),
    cupo: Number(cupo),
    fechas: fechasUnicas
  };
  expediciones.push(nuevaExp);
  fs.writeFileSync(expedicionesPath, JSON.stringify(expediciones, null, 2));
  res.json({ ok: true, expedicion: nuevaExp });
});

// --- ELIMINAR EXPEDICIÓN (ADMIN) ---
app.delete('/api/expediciones/:id', (req, res) => {
  const expedicionesPath = path.join(__dirname, 'data/expediciones.json');
  let expediciones = JSON.parse(fs.readFileSync(expedicionesPath));
  const id = req.params.id;
  const idx = expediciones.findIndex(e => String(e.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Expedición no encontrada' });
  expediciones.splice(idx, 1);
  fs.writeFileSync(expedicionesPath, JSON.stringify(expediciones, null, 2));
  res.json({ ok: true });
});

// --- ACTUALIZAR EXPEDICIÓN (ADMIN) ---
app.patch('/api/expediciones/:id', (req, res) => {
  const expedicionesPath = path.join(__dirname, 'data/expediciones.json');
  let expediciones = JSON.parse(fs.readFileSync(expedicionesPath));
  const id = req.params.id;
  const idx = expediciones.findIndex(e => String(e.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'Expedición no encontrada' });
  const { nombre, imagen, precio, cupo, fechas } = req.body;
  if (!nombre || !imagen || !precio || !cupo || !Array.isArray(fechas) || !fechas.length) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }
  // Validar fechas únicas y formato
  const fechasUnicas = [];
  for (const f of fechas) {
    if (!f.fecha || !f.hora) return res.status(400).json({ error: 'Fecha y hora requeridas' });
    if (fechasUnicas.some(x => x.fecha === f.fecha && x.hora === f.hora)) {
      return res.status(400).json({ error: 'Fechas/horas duplicadas' });
    }
    fechasUnicas.push(f);
  }
  expediciones[idx] = {
    ...expediciones[idx],
    nombre,
    imagen,
    precio: Number(precio),
    cupo: Number(cupo),
    fechas: fechasUnicas
  };
  fs.writeFileSync(expedicionesPath, JSON.stringify(expediciones, null, 2));
  res.json({ ok: true, expedicion: expediciones[idx] });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});