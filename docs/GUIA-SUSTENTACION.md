# Guía de sustentación — Evaluación final (G0203)

Esta guía prepara la demostración y la sustentación según la **Rúbrica de evaluación final de Ingeniería Web**
(versión del 24/11/2026: 5 criterios, 21 pesos). Léanla los 3 integrantes: el criterio 2 se evalúa con **preguntas a cada uno**.

> **Fecha del G0203:** martes 1 de diciembre de 2026, **de 14:45 a 15:00** (15 minutos en total).
> La demostración debe durar unos **9 minutos** para dejar tiempo a las preguntas.

| # | Criterio de la rúbrica | Peso | Qué mostrar / dónde está |
|---|---|---|---|
| 1 | Demostración funcional MERN (CRUD, validación cliente/servidor, códigos HTTP, notificaciones) | **6** | Guion de demo, parte A |
| 2 | Entendimiento de la arquitectura y del dominio (Controller–Service–Repository, reglas de negocio, SDD) | **6** | Secciones 2, 3 y 5 de esta guía |
| 3 | Seguridad: JWT, contraseñas cifradas, RBAC, aislamiento multiinquilino | **4** | Guion parte B + `npm run demo:seguridad` |
| 4 | Diseño del frontend y UX: componentes reutilizables, gestión del estado, diseño responsivo, retroalimentación visual, vistas interactivas | **3** | Guion parte C + sección 6 |
| 5 | Calidad de código: capas, SOLID, Clean Code, DRY, UUID públicos, fechas con zonas horarias, nomenclatura consistente | **2** | Sección 6 |

**Puntuación final** = (Σ peso × nivel) / 63 × 20. Con nivel 3 ("Sobresaliente") en todo: 63/63 → **20**.

---

## 1. Antes de presentar (checklist, 30 minutos antes)

- [ ] Node.js **22 LTS** instalado (`node -v`).
- [ ] En MongoDB Atlas → *Network Access*: la IP de la red del aula está permitida (o `0.0.0.0/0`).
- [ ] `backend/.env` con `MONGODB_URI` de Atlas y un `JWT_SECRET` largo.
- [ ] `cd backend && npm run seed -- --reset` → datos limpios (Ana con 6 meses de movimientos, Luis con 4).
- [ ] `npm run dev` (backend) y `npm run dev` (frontend) corriendo; abrir http://localhost:5173.
- [ ] `npm test` → **64 pruebas en verde** (captura de pantalla por si preguntan).
- [ ] `npm run demo:seguridad` → **15 verificaciones correctas**.
- [ ] Abrir en VS Code: `routes/index.js`, `controllers/transaction.controller.js`, `services/TransactionService.js`,
      `repositories/mongo/MongoTenantRepository.js`, `services/policies.js`, `openspec/specs/presupuesto/spec.md`.
- [ ] Plan B: si no hay internet para Atlas, `npm run demo` (datos en memoria). Decirlo honestamente: la persistencia real
      es MongoDB Atlas; el modo demo usa el mismo código de servicios con otro repositorio.

---

## 2. Guion de la demostración en vivo (≈ 9 minutos: 3 por integrante)

### Parte A — Flujo completo y CRUD (criterio 1) · *De la Cruz Cardenas*
1. **Registro** de un usuario nuevo con contraseña débil `Fin#202` → el botón *Registrarme* queda deshabilitado y aparece la regla
   (validación en el **cliente**). Completar con `Finanzas#2026` → toast "Cuenta creada correctamente".
2. Iniciar sesión como **Ana** (`ana.torres@gmail.com / Finanzas#2026`).
3. **Movimientos → Nuevo movimiento**: gasto S/ 45.50 "Almuerzo" → toast "Movimiento registrado" (POST **201**).
   Mostrar en **Atlas → Browse Collections → transactions** el documento nuevo con `_id` UUID y `userId`
   (**persistencia real**).
4. Monto `-20` → mensaje "El monto debe ser un número mayor a 0" (cliente). Explicar que el servidor también valida
   con **Validator.js** y responde **400** con `details` por campo (se prueba en `npm test`).
5. **Editar** el movimiento (PUT **200**, toast "Movimiento actualizado") y **eliminarlo** (SweetAlert2 de confirmación).
6. **Categorías**: crear "Mascotas" (**201**); intentar "transporte" → "Ya existe una categoría con ese nombre" (**409**).
   Eliminar una categoría con movimientos → pide categoría de reemplazo (regla de negocio).
7. **Cuentas**: saldo de cada cuenta y saldo consolidado; tarjeta de crédito con saldo negativo en rojo.

### Parte B — Seguridad (criterio 3) · *Castañeda Cano*
1. Terminal: `cd backend && npm run demo:seguridad`. Explicar cada bloque mientras se imprime:
   JWT de 1 h · 401 sin token o con token alterado · Ana solo ve lo suyo y Luis lo suyo · Ana pide el movimiento de Luis
   por ID → **404** · intenta editarlo/eliminarlo → **404** · `userId` falso en el cuerpo → se ignora · USER en
   `/admin/users` → **403** · el último ADMIN no puede degradarse → **409**.
2. En Atlas, colección `users`: el campo `passwordHash` empieza con `$2b$…` → **bcrypt** (nunca se guarda la contraseña).
3. En la app, entrar como **admin@finanzas.pe / Admin#2026** → menú *Usuarios y roles*: cambiar el rol de Luis,
   desactivar su cuenta (no puede iniciar sesión; sus datos se conservan). Como Ana, escribir `/admin/usuarios` en la URL
   → la interfaz la devuelve al dashboard (y la API respondería 403).
4. **Al final** (porque bloquea a Luis 15 minutos y el script de seguridad usa su cuenta): cinco intentos de login
   fallidos con Luis → "Cuenta bloqueada temporalmente. Intenta nuevamente en 15 minutos".

### Parte C — Frontend, UX y analítica (criterio 4 y demo del criterio 1) · *Huamani Rodriguez*
1. **Dashboard** de Ana: tarjetas de Ingresos, Gastos, Balance y % de presupuesto; cambiar el periodo a un mes anterior.
2. Gráficos (Chart.js): barras ingresos vs. gastos de 6 meses, líneas de balance mensual y acumulado, dona por categoría
   (pasar el cursor: monto y porcentaje).
3. **Presupuesto** (receta para que las alertas salgan sí o sí): en *Presupuesto* anotar lo **gastado** del mes (G).
   Guardar un presupuesto de **G × 1.3** (queda ≈ 77 %). Registrar un gasto de **G × 0.05** → cruza el 80 % → toast
   "Has consumido el 80 % de tu presupuesto mensual". Registrar otro gasto de **G × 0.4** → supera el 100 % →
   alerta "Has superado tu presupuesto mensual en S/ X". (Ej.: G = 1,400 → presupuesto 1,820 → gasto 70 → gasto 560.)
4. **Filtros en tiempo real** en Movimientos: tipo "Gasto" + categoría + rango de fechas → la tabla y el **total filtrado**
   se actualizan solos. Rango invertido → alerta y botón deshabilitado.
5. **Exportar PDF** y **Exportar Excel** con los filtros aplicados; abrir los archivos (`reporte-finanzas-AAAA-MM`).
6. Reducir la ventana o abrir en el celular → interfaz **responsiva** (menú lateral desplegable).
7. Señalar la **retroalimentación visual**: indicadores de carga ("Cargando…"), toasts de éxito/error, alertas de SweetAlert2,
   mensajes junto a cada campo y botones deshabilitados mientras los datos no son válidos.
8. En VS Code, mostrar en 30 segundos la **arquitectura de componentes**: `components/index.js` (barrel con los componentes
   reutilizables), `hooks/useAsyncData.js` (estado de carga/error/recarga reutilizado por varias páginas) y
   `context/AuthContext.jsx` (estado global de sesión con Context API).

---

## 3. Arquitectura: cómo viaja una petición (criterio 2)

Ejemplo: **registrar un gasto** (`POST /api/transactions`).

```
React (TransactionForm)                      ← valida en el cliente (monto > 0, campos obligatorios)
  └─ api/client.js  fetch + "Authorization: Bearer <JWT>"
        ↓ HTTP/JSON
Express  app.js → helmet, cors, express.json
  └─ routes/index.js         router.use(auth)  →  router.post('/transactions', t.create)
       ├─ middlewares/authenticate.js   1) express-jwt verifica firma y expiración
       │                                2) carga el usuario de la BD (rol vigente, cuenta activa) → req.user
  └─ controllers/transaction.controller.js   create → service.create(req.user, req.body) → 201
       (sin lógica de negocio: solo traduce HTTP ⇄ servicio)
  └─ services/TransactionService.js  create(actor, body)
       1) authorize(actor, FINANCE_OWN)            ← RBAC centralizado (services/policies.js)
       2) validateTransaction(body)                ← validators/finance.validators.js (Validator.js)
       3) #assertReferences: la categoría y la cuenta existen, son DEL MISMO USUARIO y el tipo coincide
       4) transactions.create(actor.id, data)      ← el dueño sale del token, nunca del cuerpo
       5) #result: saldo de la cuenta + alerta de presupuesto (BudgetService)
  └─ repositories/mongo/MongoTenantRepository.js
       scope(userId, filter) agrega userId a TODA consulta (y descarta cualquier userId recibido)
       └─ Mongoose → MongoDB Atlas (colección transactions, _id UUID v4)
Errores en cualquier capa → AppError → middlewares/errorHandler.js → JSON { message, details } con código HTTP
```

**¿Por qué tres capas?**
- *Controller*: sabe de HTTP (req/res/códigos), no de reglas.
- *Service*: sabe de reglas de negocio y permisos, no de HTTP ni de Mongo.
- *Repository*: sabe de MongoDB y del aislamiento por `userId`, no de reglas.
Así se puede cambiar la base de datos (las pruebas usan un repositorio en memoria) sin tocar servicios ni controladores.

**Inyección de dependencias (`src/container.js`)**: los servicios reciben sus repositorios por constructor.
Producción → repositorios Mongo; pruebas → repositorios en memoria. Es el principio **D** de SOLID.

---

## 4. Reglas de negocio y cálculos (criterio 2 — "control presupuestario / KPI")

| Regla | Dónde | Fórmula / comportamiento |
|---|---|---|
| Saldo de una cuenta | `AccountService` | saldo inicial + Σ ingresos − Σ gastos (agregación `$group` por cuenta y tipo; no se guarda duplicado) |
| Saldo consolidado | `AccountService.list` | Σ saldos de todas las cuentas |
| KPI del mes | `DashboardService.summary` | Ingresos = Σ ingresos del mes · Gastos = Σ gastos · **Balance = Ingresos − Gastos** (rojo y aviso si < 0) |
| % de presupuesto | `BudgetService.status` | **% = gastos del mes / presupuesto × 100** (1 decimal). Nivel: < 80 % *ok* (verde) · 80–100 % *warning* (amarillo) · > 100 % *exceeded* (rojo), exceso = gastos − presupuesto |
| Alertas | `BudgetService.alertAfterExpense` | Aviso cuando un gasto **cruza** el 80 %; alerta cada vez que se supera el 100 % |
| Distribución por categoría | `DashboardService.charts` | % categoría = gasto de la categoría / gasto total del mes × 100 |
| Balance acumulado | `DashboardService.charts` | suma progresiva de los balances mensuales de los 6 meses |
| Montos | `validators/common.js` | número > 0 con máximo 2 decimales; redondeo a 2 decimales (`utils/money.js`) |
| Fechas | `utils/dates.js` (Day.js en UTC) | el mes `AAAA-MM` va del día 1 00:00:00 al último día 23:59:59.999 UTC |
| Categorías | `CategoryService` | únicas por usuario + tipo sin distinguir mayúsculas; con movimientos → exigir reemplazo del mismo tipo |
| Cuentas | `AccountService` | saldo inicial negativo solo para tarjeta de crédito; no se elimina con movimientos |
| Login | `AuthService.login` | mensaje genérico; 5 intentos fallidos → bloqueo 15 min |
| Recuperación | `AuthService` | token aleatorio de 32 bytes, se guarda solo su SHA-256, 30 min, un solo uso |

Ejemplo verificable (está en las pruebas): presupuesto S/ 2,500, gastos S/ 1,950 + nuevo gasto S/ 60 = S/ 2,010 →
2,010 / 2,500 × 100 = **80.4 %** → alerta preventiva.

---

## 5. Desarrollo guiado por especificaciones (SDD) y trazabilidad

Cadena completa, con un ejemplo real:

1. **Historia de usuario** (plantilla oficial, `docs/G0203 - …xlsx`): *HU-FIN-11 E2 — Alerta preventiva al superar el 80 %*.
2. **Especificación OpenSpec**: `openspec/specs/presupuesto/spec.md` → *Requirement: HU-FIN-11* → *Scenario: E2* en Gherkin.
3. **Diseño y tareas**: `openspec/changes/archive/2026-11-23-mvp-dashboard-finanzas/` (`proposal.md`, `design.md`, `tasks.md`).
4. **Código**: `BudgetService.alertAfterExpense` (umbral `WARNING_THRESHOLD = 80`).
5. **Prueba automática con el mismo nombre**: `tests/hu09-12.dashboard.test.js` →
   "E2 Flujo alternativo: S/ 1,950 + S/ 60 = 80.4 % y alerta preventiva".

Las 14 historias × 4 escenarios = 56 escenarios Gherkin; las 64 pruebas cubren esos escenarios (más casos extra de
seguridad, esquemas y zonas horarias). Flujo de trabajo con OpenSpec + OpenCode: `/opsx:propose` → `/opsx:apply` → `/opsx:verify` → `/opsx:archive`.

---

## 6. Frontend y calidad de código (criterios 4 y 5)

**Frontend (criterio 4)**
- **SPA modular**: `pages/` (una vista por módulo) + `components/` reutilizables (KpiCard, BudgetBar, TransactionForm,
  AccountForm, CategoryList, gráficos, Modal, Field, EmptyState, ErrorState, Spinner…) exportados desde un archivo barril.
- **Gestión del estado**: global solo para la sesión (`AuthContext`, Context API); estado de servidor con el hook
  `useAsyncData` (datos, carga, error, recarga); estado local de formularios con `useState`.
- **Retroalimentación**: spinners de carga, React-Toastify, SweetAlert2, mensajes por campo, estados vacíos y de error con
  botón "Reintentar".
- **Responsivo**: Tailwind (rejillas adaptables, menú lateral colapsable, tablas con desplazamiento horizontal).

**Calidad de código (criterio 5)**

- **Capas estrictas**: ningún controlador tiene lógica de negocio; ningún servicio importa Mongoose ni los modelos: solo usa
  repositorios y las constantes de `domain/constants.js`.
- **SOLID**: S (un servicio por módulo), O/L (repositorio Mongo y en memoria intercambiables), I (contrato pequeño de
  repositorio), D (`container.js`).
- **DRY**: un solo `MongoTenantRepository` para categorías, cuentas, movimientos y presupuestos; políticas RBAC en un solo
  archivo; validadores reutilizables.
- **Clean Code / KISS / YAGNI**: nombres descriptivos, errores de dominio (`AppError`), sin funciones fuera del alcance.
- **UUID públicos**: `_id` UUID v4 en todas las colecciones (`models/plugins.js`).
- **Fechas y zonas horarias** con Day.js (`utc` + `timezone`): las fechas contables se guardan en UTC; "hoy" y "mes actual"
  se calculan en `APP_TIMEZONE` = America/Lima. Ejemplo probado: a las 23:30 del 30/11 en Lima (ya 01/12 en UTC) el mes
  actual sigue siendo noviembre (`tests/dates.test.js`).
- **Nomenclatura consistente**: código y API en inglés (`camelCase`, `PascalCase` para clases/componentes, recursos REST en
  plural), interfaz y mensajes en español; convenciones documentadas en el README.
- **Responsivo**: Tailwind, menú lateral colapsable, tablas con desplazamiento, gráficos adaptables.

---

## 7. Preguntas probables y respuestas cortas

1. **¿Qué pasa si alguien manda el `userId` de otro usuario?** — Se ignora: el servicio toma el dueño del token y
   `scope()` del repositorio sobrescribe cualquier `userId`. Lo demuestra `npm run demo:seguridad`.
2. **¿Por qué 404 y no 403 cuando Ana pide un dato de Luis?** — Para no revelar que el recurso existe (evita enumerar IDs).
3. **¿Dónde se valida el rol?** — En tres niveles: `requireRole` en las rutas de administración, `authorize()` en *cada*
   método de servicio y, para el aislamiento, el filtro `userId` en el repositorio.
4. **¿Qué contiene el JWT?** — `sub` (id del usuario), `role`, `name`, `iat`, `exp` (1 hora), firmado con HS256 y `JWT_SECRET`.
   El rol vigente se vuelve a leer de la BD en cada petición.
5. **¿Cómo se guardan las contraseñas?** — Con bcrypt (hash con sal). Ni siquiera el administrador puede verlas.
6. **¿Cómo se calcula el saldo?** — Saldo inicial + ingresos − gastos con una agregación de MongoDB; no se guarda el saldo
   para evitar inconsistencias.
7. **¿Cómo se calcula el porcentaje del presupuesto?** — Gastos del mes / presupuesto × 100; 80 % amarillo, > 100 % rojo.
8. **¿Por qué UUID y no el ObjectId?** — Requisito del proyecto: identificadores públicos no secuenciales, difíciles de adivinar.
9. **¿Cómo se prueba sin base de datos?** — Repositorios en memoria con el mismo contrato, inyectados en `container.js`.
10. **¿Qué es SDD y cómo lo aplicaron?** — Primero la especificación (HU + Gherkin + OpenSpec), luego el código y la prueba
    que verifica cada escenario; la trazabilidad se ve en la sección 5.
11. **¿Qué hace la recuperación de contraseña?** — Envía con Nodemailer un enlace con un token aleatorio válido 30 min y de un
    solo uso; en la BD solo se guarda su hash.
12. **¿Cómo exportan PDF y Excel?** — En el navegador con jsPDF (+ autotable) y SheetJS, con los mismos filtros aplicados;
    las librerías se cargan solo al exportar.
13. **¿Qué códigos HTTP usa la API?** — 200, 201, 400 (validación), 401 (sin sesión), 403 (sin permiso), 404, 409 (conflicto:
    duplicado, último admin, categoría con movimientos), 410 (enlace expirado), 423 (cuenta bloqueada).
14. **¿Qué usaron de IA y cómo lo controlaron?** — Asistencia para generar código a partir de las especificaciones; el control
    está en las 64 pruebas automáticas que verifican cada escenario de aceptación y en la revisión por capas.

---

## 8. Autoevaluación con la rúbrica

| Criterio | Peso | Nivel esperado | Evidencia | Riesgo |
|---|---|---|---|---|
| 1. Demo MERN | 6 | 3 | CRUD completo, validación cliente + servidor, códigos HTTP, toasts y SweetAlert2 | Conexión a Atlas el día de la demo (checklist 1) |
| 2. Arquitectura y dominio | 6 | 3 | Secciones 3–5, trazabilidad HU → spec → código → prueba | Depende de que **cada integrante** sepa explicarlo |
| 3. Seguridad | 4 | 3 | JWT + bcrypt + RBAC en rutas y servicios + aislamiento en repositorio; `npm run demo:seguridad` | — |
| 4. Frontend y UX | 3 | 3 | Componentes reutilizables (barrel), Context + hook de estado, carga/toasts/alertas, responsivo, gráficos interactivos | — |
| 5. Calidad | 2 | 3 | Capas estrictas, SOLID, DRY, UUID públicos, Day.js con zonas horarias, nomenclatura documentada | — |
