# Dashboard de Finanzas Personales

![Node.js](https://img.shields.io/badge/Node.js-22_LTS-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Pruebas](https://img.shields.io/badge/pruebas-64_en_verde-brightgreen)
![Licencia](https://img.shields.io/badge/licencia-MIT-blue)

Aplicación web **SaaS multiinquilino** (stack **MERN**) para registrar, organizar, visualizar y analizar ingresos y gastos
personales: dashboard con indicadores y gráficos, presupuesto mensual con alertas, reportes en PDF y Excel, y control de
acceso basado en roles. Proyecto de Fin de Asignatura de **Ingeniería Web** (Universidad Continental), equipo **G0203**,
desarrollado con **Spec-Driven Development (OpenSpec)**.

![Dashboard](docs/capturas/dashboard.png)

## Tabla de contenidos

1. [Características](#características)
2. [Tecnologías](#tecnologías)
3. [Arquitectura](#arquitectura)
4. [Requisitos previos](#requisitos-previos)
5. [Instalación](#instalación)
6. [Configuración (variables de entorno)](#configuración-variables-de-entorno)
7. [Uso](#uso)
8. [Scripts disponibles](#scripts-disponibles)
9. [API REST](#api-rest)
10. [Pruebas](#pruebas)
11. [Seguridad](#seguridad)
12. [Desarrollo guiado por especificaciones (SDD)](#desarrollo-guiado-por-especificaciones-sdd)
13. [Convenciones del proyecto](#convenciones-del-proyecto)
14. [Equipo](#equipo)
15. [Contribución](#contribución)
16. [Licencia](#licencia)

---

## Características

| Módulo | Funcionalidad | Historia |
|---|---|---|
| Autenticación | Registro con categorías base, inicio de sesión JWT (1 h), bloqueo tras 5 intentos fallidos, recuperación de contraseña por correo | HU-FIN-01, 02, 03 |
| Movimientos | Registro de ingresos y gastos con validación, edición, eliminación, historial paginado (10 por página) | HU-FIN-04, 07 |
| Filtros | Por rango de fechas, categoría y tipo, aplicados en tiempo real, con total filtrado | HU-FIN-08 |
| Categorías | Crear, renombrar y eliminar (con reasignación de movimientos); únicas sin distinguir mayúsculas | HU-FIN-05 |
| Cuentas | Efectivo, banco, tarjeta de crédito y billetera digital; saldo calculado y saldo consolidado | HU-FIN-06 |
| Dashboard | KPI del mes (ingresos, gastos, balance, % de presupuesto) y periodo seleccionable | HU-FIN-09 |
| Gráficos | Barras ingresos vs. gastos (6 meses), líneas de balance mensual y acumulado, dona por categoría | HU-FIN-10 |
| Presupuesto | Presupuesto mensual con alertas al 80 % y al superar el 100 % | HU-FIN-11 |
| Reportes | Exportación de los movimientos filtrados a **PDF** y **Excel** | HU-FIN-12 |
| Administración | Gestión de roles (ADMIN / USER) y activación de cuentas, sin acceso a datos financieros ajenos | HU-FIN-13 |
| SaaS | Aislamiento total de los datos de cada usuario en la capa de repositorio | HU-FIN-14 |

Más capturas en [`docs/capturas/`](docs/capturas/): inicio de sesión, movimientos con filtros, administración y vista móvil.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Base de datos | MongoDB Atlas + Mongoose (identificadores **UUID v4**) |
| Backend | Node.js 22, Express 5 — arquitectura **Controller → Service → Repository** |
| Seguridad | JSON Web Tokens (`jsonwebtoken` + `express-jwt`), `bcryptjs`, `helmet`, CORS |
| Validación | Validator.js (servidor) y validación inmediata en formularios (cliente) |
| Fechas | Day.js con `utc` y `timezone` (backend y frontend) |
| Correo | Nodemailer |
| Frontend | React 19 + Vite, React Router, Context API, Tailwind CSS 4 |
| Visualización y UI | Chart.js (`react-chartjs-2`), SweetAlert2, React-Toastify, React Icons |
| Reportes | jsPDF + `jspdf-autotable` (PDF), SheetJS (Excel) |
| Pruebas | `node:test` + Supertest |
| SDD | OpenSpec + OpenCode, Visual Studio Code |

## Arquitectura

```
┌──────────────┐  HTTP/JSON + JWT  ┌──────────────────────────── API REST (Express) ─────────────────────────────┐
│  React SPA   │ ────────────────► │ routes → middlewares (express-jwt, requireRole) → controllers               │
│ (Vite, Ctx)  │ ◄──────────────── │        → services (reglas de negocio + políticas RBAC) → repositories ──┐   │
└──────────────┘                   └──────────────────────────────────────────────────────────────────────────┼───┘
                                                                     filtro userId obligatorio (multiinquilino) ▼
                                                                                                  MongoDB Atlas
```

- **Controllers**: traducen HTTP ⇄ servicio; no contienen lógica de negocio.
- **Services**: reglas de negocio y autorización (`services/policies.js`); no conocen Mongoose.
- **Repositories**: acceso a MongoDB; `scope(userId)` agrega el filtro del usuario a **toda** consulta.
- **`container.js`**: inyección de dependencias (los servicios reciben sus repositorios por constructor).

```
.
├── backend/
│   ├── src/
│   │   ├── config/          variables de entorno y conexión a MongoDB
│   │   ├── domain/          constantes del dominio (roles, tipos)
│   │   ├── models/          esquemas Mongoose: User, Category, Account, Transaction, Budget
│   │   ├── repositories/    mongo/ (producción) y memory/ (pruebas y modo demo), mismo contrato
│   │   ├── services/        lógica de negocio, policies.js (RBAC), mailer.js
│   │   ├── validators/      validación de entradas con Validator.js
│   │   ├── controllers/     adaptadores HTTP
│   │   ├── middlewares/     autenticación, roles y manejo de errores
│   │   ├── routes/          definición de endpoints
│   │   ├── utils/           AppError, fechas (Day.js), montos
│   │   ├── scripts/         seed, datos demo y demostración de seguridad
│   │   ├── container.js     composición de dependencias
│   │   ├── app.js           aplicación Express
│   │   └── server.js        punto de entrada
│   └── tests/               pruebas por historia de usuario y escenario
├── frontend/
│   └── src/
│       ├── api/             cliente Fetch y servicios por recurso
│       ├── components/      componentes reutilizables (barrel index.js)
│       ├── context/         AuthContext (estado global de sesión)
│       ├── hooks/           useAsyncData (carga, error y recarga)
│       ├── pages/           vistas por módulo
│       └── utils/           formato (Day.js), alertas, exportadores, contraseña
├── openspec/                especificaciones SDD, propuesta, diseño y tareas
└── docs/                    historias de usuario, guía de sustentación, capturas, ejemplos de API
```

## Requisitos previos

- [Node.js 22 LTS](https://nodejs.org) o superior (`node -v`)
- Una cuenta gratuita de [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Git

## Instalación

```bash
git clone https://github.com/Marcelo-CC/Dashboard-de-Finanzas-Personales.git
cd Dashboard-de-Finanzas-Personales
```

**1. Base de datos (MongoDB Atlas, una sola vez)**
1. Crear un clúster gratuito **M0**.
2. *Database Access* → crear un usuario con permiso *Read and write to any database*.
3. *Network Access* → agregar tu IP (o `0.0.0.0/0` para la demostración).
4. *Connect* → *Drivers* → copiar la cadena `mongodb+srv://…` y agregar el nombre de la base antes del `?`:
   `mongodb+srv://usuario:clave@cluster0.xxxxx.mongodb.net/dashboard_finanzas?retryWrites=true&w=majority`

**2. Backend**
```bash
cd backend
npm install
cp .env.example .env          # Windows (cmd): copy .env.example .env
# editar .env: MONGODB_URI y JWT_SECRET
npm run seed                  # datos de demostración
npm run dev                   # http://localhost:3000/api
```

**3. Frontend** (en otra terminal)
```bash
cd frontend
npm install
cp .env.example .env          # Windows (cmd): copy .env.example .env
npm run dev                   # http://localhost:5173
```

## Configuración (variables de entorno)

**`backend/.env`**

| Variable | Descripción | Ejemplo / valor por defecto |
|---|---|---|
| `PORT` | Puerto de la API | `3000` |
| `CLIENT_URL` | URL del frontend (CORS y enlace de recuperación) | `http://localhost:5173` |
| `APP_TIMEZONE` | Zona horaria del negocio ("hoy" y "mes actual") | `America/Lima` |
| `DATA_DRIVER` | `mongo` (MongoDB) o `memory` (demo sin base de datos) | `mongo` |
| `MONGODB_URI` | Cadena de conexión de MongoDB Atlas | `mongodb+srv://…/dashboard_finanzas` |
| `JWT_SECRET` | Clave para firmar los tokens (larga y aleatoria) | — |
| `JWT_EXPIRES_IN` | Vigencia del token | `1h` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Servidor de correo. Si `SMTP_HOST` está vacío, el enlace de recuperación se imprime en la consola | Gmail: `smtp.gmail.com`, `465`, `true` + contraseña de aplicación |
| `MAIL_FROM` | Remitente de los correos | `Dashboard de Finanzas <correo@gmail.com>` |
| `RESET_TOKEN_MINUTES` | Vigencia del enlace de recuperación | `30` |

**`frontend/.env`**

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base de la API | `http://localhost:3000/api` |

> Nunca subas los archivos `.env` al repositorio (están en `.gitignore`).

## Uso

Usuarios creados por `npm run seed`:

| Rol | Correo | Contraseña | Datos |
|---|---|---|---|
| ADMIN | `admin@finanzas.pe` | `Admin#2026` | Gestión de usuarios y roles |
| USER | `ana.torres@gmail.com` | `Finanzas#2026` | 6 meses de movimientos, 4 cuentas, presupuesto |
| USER | `luis.rojas@gmail.com` | `Finanzas#2026` | Pocos datos (para demostrar el aislamiento) |

- **Modo demo sin base de datos:** `cd backend && npm run demo` levanta la API con los mismos usuarios en memoria
  (los datos se pierden al reiniciar). Útil como plan de contingencia; la persistencia real es MongoDB.
- **Recuperación de contraseña:** sin SMTP configurado, el enlace aparece en la consola del backend.

## Scripts disponibles

| Ubicación | Comando | Descripción |
|---|---|---|
| backend | `npm run dev` | API con recarga automática |
| backend | `npm start` | API en modo producción |
| backend | `npm run seed` | Carga datos de demostración (`npm run seed -- --reset` vacía antes las colecciones) |
| backend | `npm run demo` | API con repositorios en memoria |
| backend | `npm test` | 64 pruebas automáticas |
| backend | `npm run demo:seguridad` | Demostración en vivo de JWT, RBAC y aislamiento (requiere la API corriendo) |
| frontend | `npm run dev` | Servidor de desarrollo de Vite |
| frontend | `npm run build` | Compilación de producción en `dist/` |
| frontend | `npm run preview` | Sirve la compilación de producción |

## API REST

Base: `http://localhost:3000/api`. Todas las rutas, salvo las de autenticación públicas y `/health`, requieren
`Authorization: Bearer <token>`. Las respuestas de error tienen la forma `{ "message": "...", "details": { "campo": "..." } }`.

| Método | Ruta | Descripción | Respuestas |
|---|---|---|---|
| POST | `/auth/register` | Registro (rol USER + categorías base) | 201, 400, 409 |
| POST | `/auth/login` | Inicio de sesión → `{ token, user }` | 200, 401, 403, 423 |
| POST | `/auth/forgot-password` | Envía el enlace de restablecimiento | 200 |
| GET | `/auth/reset-password/:token` | Verifica si el enlace sigue vigente | 200, 400, 410 |
| POST | `/auth/reset-password` | Guarda la nueva contraseña | 200, 400, 410 |
| GET | `/auth/me` | Usuario de la sesión | 200, 401 |
| GET · POST | `/categories` | Listar (`?type=income\|expense`) · crear | 200 · 201, 400, 409 |
| PATCH · DELETE | `/categories/:id` | Renombrar · eliminar (`?replacementId=` si tiene movimientos) | 200, 404, 409 |
| GET · POST | `/accounts` | Listar con saldos y total · crear | 200 · 201, 400 |
| PATCH · DELETE | `/accounts/:id` | Editar · eliminar | 200, 400, 404, 409 |
| GET | `/transactions` | Historial: `from`, `to`, `type`, `categoryId`, `page`, `pageSize` | 200, 400 |
| POST | `/transactions` | Registrar (devuelve saldo de la cuenta y alerta de presupuesto) | 201, 400 |
| GET · PUT · DELETE | `/transactions/:id` | Ver · editar · eliminar | 200, 400, 404 |
| PUT | `/budgets` | Crear o actualizar `{ month: "AAAA-MM", amount }` | 200, 400 |
| GET · DELETE | `/budgets/:month` | Estado del presupuesto · eliminar | 200, 400, 404 |
| GET | `/dashboard/summary?month=AAAA-MM` | Ingresos, gastos, balance y presupuesto | 200, 400 |
| GET | `/dashboard/charts?month=AAAA-MM&months=6` | Series mensuales y distribución por categoría | 200, 400 |
| GET | `/admin/users` | **ADMIN**: usuarios (sin datos financieros) | 200, 403 |
| PATCH | `/admin/users/:id/role` | **ADMIN**: cambiar rol | 200, 403, 404, 409 |
| PATCH | `/admin/users/:id/status` | **ADMIN**: activar o desactivar | 200, 400, 403, 409 |

Ejemplos listos para ejecutar en [`docs/api-demo.http`](docs/api-demo.http) (extensión *REST Client* de VS Code).

## Pruebas

```bash
cd backend
npm test
```

64 pruebas con `node:test` y Supertest. Cada una lleva el nombre de la historia y del escenario Gherkin que verifica
(por ejemplo, *HU-FIN-11 · E2 Flujo alternativo: S/ 1,950 + S/ 60 = 80.4 % y alerta preventiva*). Las pruebas usan
repositorios en memoria con el mismo contrato que los de MongoDB, así que no requieren base de datos.

## Seguridad

- **Autenticación sin estado** con JWT (HS256, 1 hora) validado por `express-jwt`; en cada petición se vuelven a leer el
  rol y el estado del usuario desde la base de datos.
- **Contraseñas** cifradas con bcrypt; bloqueo de 15 minutos tras 5 intentos fallidos; mensaje genérico ante credenciales
  incorrectas.
- **RBAC en tres niveles**: `requireRole` en rutas de administración, `authorize()` en cada operación de servicio y
  aislamiento por `userId` en el repositorio.
- **Multiinquilino**: un recurso de otro usuario responde **404**; cualquier `userId` enviado por el cliente se ignora.
- **Recuperación de contraseña**: token aleatorio de un solo uso, válido 30 minutos; solo se guarda su hash SHA-256.
- Cabeceras de seguridad con `helmet` y CORS restringido a `CLIENT_URL`.

Demostración en vivo: con la API corriendo, `cd backend && npm run demo:seguridad`.

## Desarrollo guiado por especificaciones (SDD)

1. **Historias de usuario** con criterios de aceptación Gherkin:
   [`docs/G0203 - Dashboard de Finanzas Personales - HU y criterios de aceptación.xlsx`](docs/) (14 historias, 56 escenarios).
2. **Especificaciones OpenSpec** por capacidad: [`openspec/specs/`](openspec/specs/).
3. **Propuesta, diseño y tareas**: [`openspec/changes/archive/`](openspec/changes/archive/).
4. **Código** organizado por módulo y **pruebas** nombradas por historia y escenario (trazabilidad completa).

Flujo con OpenSpec + OpenCode: `/opsx:propose` → `/opsx:apply` → `/opsx:verify` → `/opsx:archive`.
La guía para la sustentación está en [`docs/GUIA-SUSTENTACION.md`](docs/GUIA-SUSTENTACION.md).

## Convenciones del proyecto

- **Nomenclatura**: código, rutas de la API y nombres de archivo en inglés (`camelCase` para variables y funciones,
  `PascalCase` para clases y componentes React, `kebab-case`/plural para recursos REST); textos de la interfaz y mensajes
  al usuario en español; rutas de la interfaz en español (`/movimientos`, `/presupuesto`).
- **Identificadores**: UUID v4 públicos en todas las colecciones; nunca se exponen ObjectId internos.
- **Fechas**: las fechas contables (`AAAA-MM-DD`) se guardan en UTC; "hoy" y "mes actual" se calculan en `APP_TIMEZONE`
  (America/Lima) con Day.js; los periodos usan el formato `AAAA-MM`.
- **Montos**: soles (S/), máximo 2 decimales.
- **Ramas**: `feature/`, `fix/`, `hotfix/`, `refactor/`, `test/`, `docs/`, `chore/`, `ci/`, `release/`, en minúsculas,
  con guiones y el ID de la historia (por ejemplo, `feature/hu-fin-04-registro-movimientos`).
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/es/) (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`).

## Equipo

**G0203** — Ingeniería Web, Universidad Continental (2026).

| Integrante | Responsabilidad | Historias |
|---|---|---|
| Castañeda Cano, Marcelo Giovanni | Seguridad: autenticación, RBAC y aislamiento SaaS | HU-FIN-01, 02, 03, 13, 14 |
| De la Cruz Cardenas, Antony Marcelo | Movimientos, categorías, cuentas, historial y filtros | HU-FIN-04 a 08 |
| Huamani Rodriguez, Jean Piero | Dashboard, gráficos, presupuesto y reportes | HU-FIN-09 a 12 |

## Contribución

1. Crear una rama desde `main` con el prefijo correspondiente: `git checkout -b feature/hu-fin-xx-descripcion`.
2. Actualizar o crear la especificación en `openspec/` antes del código.
3. Implementar respetando las capas y agregar la prueba del escenario.
4. Verificar con `npm test` (backend) y `npm run build` (frontend).
5. Abrir un *pull request* hacia `main` describiendo la historia y los escenarios cubiertos.

## Licencia

Distribuido bajo la licencia **MIT**. Ver [`LICENSE`](LICENSE). Proyecto con fines académicos.
