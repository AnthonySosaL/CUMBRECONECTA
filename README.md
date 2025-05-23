# <img src="https://img.icons8.com/color/48/000000/mountain.png" width="36" style="vertical-align:middle;"> CUMBRECONECTA

<p align="center">
  <img src="https://img.shields.io/github/issues/AnthonySosaL/CUMBRECONECTA?color=6abf69" />
  <img src="https://img.shields.io/github/forks/AnthonySosaL/CUMBRECONECTA?color=bead7a" />
  <img src="https://img.shields.io/github/stars/AnthonySosaL/CUMBRECONECTA?color=6abf69" />
  <img src="https://img.shields.io/github/license/AnthonySosaL/CUMBRECONECTA?color=bead7a" />
</p>

---

<div align="center">
  <img src="https://img.icons8.com/color/96/000000/trekking.png" width="80"/>
  <h3 style="color:#6abf69;">Plataforma de gestión de expediciones, reservas y usuarios</h3>
  <p style="color:#bead7a;">Facilita la administración y experiencia de los participantes en la aventura</p>
</div>

---

## 🎨 Paleta de Colores

<table><tr>
<td width="120" align="center" bgcolor="#6abf69" style="color:#fff; font-weight:bold;">Verde</td>
<td width="120" align="center" bgcolor="#bead7a" style="color:#222; font-weight:bold;">Beige</td>
<td width="120" align="center" bgcolor="#f8f9fa" style="color:#222; font-weight:bold;">Fondo claro</td>
</tr></table>

---

## 🚀 Características principales

- Gestión de expediciones y reservas
- Panel de administración
- Autenticación de usuarios
- Interfaz intuitiva y responsiva
- Roles: <span style="color:#6abf69;">Usuario</span>, <span style="color:#bead7a;">Guía</span>, <span style="color:#6abf69;">Administrador</span>
- Notificaciones visuales de estado de reserva
- Modal de detalles y edición de reservas
- Sistema de motivos para cada cambio de estado
- Glosario visual de estados

---

## 🛠️ Instalación rápida

```bash
# 1. Clona el repositorio
$ git clone https://github.com/AnthonySosaL/CUMBRECONECTA.git
$ cd CUMBRECONECTA

# 2. Instala las dependencias
$ npm install

# 3. Inicia el servidor local
$ npm start
```

Abre tu navegador en [http://localhost:5000](http://localhost:5000)

---

## 📂 Estructura del Proyecto

```text
FRONT/
  ├── data/           # Archivos JSON de datos
  ├── public/         # Archivos estáticos (HTML, CSS, JS)
  ├── server.js       # Servidor principal (Express)
  ├── package.json    # Dependencias y scripts
  └── .gitignore      # Archivos y carpetas ignoradas por git
```

---

## 🧭 Rutas principales y roles

| Ruta                | Descripción                  | Rol           |
|---------------------|-----------------------------|---------------|
| `/`                 | Landing page / Home         | Todos         |
| `/login`            | Login                       | Todos         |
| `/user`             | Panel usuario               | Usuario       |
| `/mis_reservas`     | Reservas del usuario        | Usuario       |
| `/perfil`           | Perfil usuario              | Usuario       |
| `/perfilguia`       | Perfil guía                 | Guía          |
| `/reservas_asignadas`| Reservas asignadas a guía   | Guía          |
| `/admin`            | Panel administrador         | Admin         |

---

## 🏔️ Ejemplo de flujo de usuario

1. <span style="color:#6abf69;">Inicia sesión</span> o regístrate
2. <span style="color:#bead7a;">Explora expediciones</span> y selecciona una
3. <span style="color:#6abf69;">Reserva</span> tu lugar y realiza el pago
4. <span style="color:#bead7a;">Consulta tus reservas</span> y estado
5. <span style="color:#6abf69;">Contacta a tu guía</span> desde el panel

---

## 📸 Capturas de pantalla sugeridas

- Panel de usuario mostrando expediciones
- Modal de detalles de reserva
- Panel de guía con reservas asignadas
- Panel de administración para crear expediciones

Puedes agregar imágenes en la carpeta `public/` y referenciarlas aquí:

```md
![Panel usuario](public/screenshots/panel_usuario.png)
![Modal reserva](public/screenshots/modal_reserva.png)
```

---

## 🧩 Widgets y detalles visuales

- Badges de estado en reservas: <span style="background:#2ecc71;color:#fff;padding:2px 8px;border-radius:6px;">Pagado</span> <span style="background:#f1c40f;color:#222;padding:2px 8px;border-radius:6px;">Pendiente</span> <span style="background:#e74c3c;color:#fff;padding:2px 8px;border-radius:6px;">Rechazada</span>
- Modal de detalles con motivos de aceptación/rechazo
- Toasts de notificación de cambio de estado
- Glosario visual de estados en la sección de reservas

---

## 🧑‍💻 Tecnologías utilizadas

- Node.js + Express (backend y API REST)
- HTML5, CSS3 (paleta verde/beige), Bootstrap 5
- JavaScript moderno (ES6+)
- LocalStorage para sesión
- JSON como base de datos simple

---

## 📖 Documentación y casos de uso

- [Caso de uso y diagrama Entidad Relacion (PDF)](../pdfs/Caso%20de%20uso%20y%20diagrama%20Entidad%20Relacion_Corregido%20(1).pdf)
- [Diseño de sistema y requerimientos (PDF)](../pdfs/EdwinTapia_Dise%C3%B1oSistema%26Requerimeintos.pdf)

---

## 🗂️ Datos de ejemplo

- Usuarios, expediciones y reservas de ejemplo en la carpeta `data/`.
- Puedes modificar estos archivos para probar diferentes escenarios.

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor, abre un issue o pull request para sugerencias o mejoras.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center" style="color:#6abf69; font-weight:bold;">
  Hecho con <span style="color:#bead7a;">❤</span> por Anthony Sosa
</div>
