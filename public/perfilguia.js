/* perfilguia.js – lógica de edición de perfil (solo para guías) */
const user = JSON.parse(localStorage.getItem('cc_user') || 'null');

/* -------- Cargar datos -------- */
function cargarPerfil() {
  const nombre = document.getElementById('perfilNombre');
  const email = document.getElementById('perfilEmail');
  const rol = document.getElementById('perfilRol');
  const cedula = document.getElementById('perfilCedula');
  const numero = document.getElementById('perfilNumero');
  // Avatar/ícono
  const avatar = document.getElementById('perfilAvatar');
  const icon = document.getElementById('perfilIcon');
  if (user?.foto) {
    avatar.src = user.foto;
    avatar.classList.remove('d-none');
    icon.classList.add('d-none');
  } else {
    avatar.classList.add('d-none');
    icon.classList.remove('d-none');
  }
  if (nombre) nombre.textContent = user?.name || '';
  if (email) email.textContent = user?.email || '';
  if (rol) rol.textContent = 'Guía Experto';
  if (cedula) cedula.textContent = user?.cedula || '-';
  if (numero) numero.textContent = user?.numero || '-';
}

document.addEventListener('DOMContentLoaded', () => {
  // Validación robusta de usuario
  if (!user || !user.role || user.role !== 'guia') {
    window.location.href = '/login';
    return;
  }
  cargarPerfil();
  if (!document.getElementById('editarPerfilBtn')) return;

  document.getElementById('editarPerfilBtn').onclick = () => {
    document.getElementById('perfilDatos').classList.add('d-none');
    document.getElementById('perfilForm').classList.remove('d-none');
    document.getElementById('inputNombre').value  = user?.name   || '';
    document.getElementById('inputEmail').value   = user?.email  || '';
    document.getElementById('inputCedula').value  = user?.cedula || '';
    document.getElementById('inputNumero').value  = user?.numero || '';
  };

  document.getElementById('cancelarEditarBtn').onclick = () => {
    document.getElementById('perfilForm').classList.add('d-none');
    document.getElementById('perfilDatos').classList.remove('d-none');
  };

  document.getElementById('perfilForm').onsubmit = async e => {
    e.preventDefault();
    const payload = {
      name : document.getElementById('inputNombre').value.trim(),
      email: document.getElementById('inputEmail').value.trim(),
      numero: document.getElementById('inputNumero').value.trim()
    };
    const pwd = document.getElementById('inputPassword').value;
    if (pwd) payload.password = pwd;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      const { user: updated } = await res.json();
      localStorage.setItem('cc_user', JSON.stringify({ ...user, ...updated }));
      Object.assign(user, updated);
      cargarPerfil();
      document.getElementById('perfilForm').classList.add('d-none');
      document.getElementById('perfilDatos').classList.remove('d-none');
    } catch {
      alert('Error al guardar cambios');
    }
  };
});
