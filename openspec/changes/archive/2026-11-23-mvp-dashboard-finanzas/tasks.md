# Tareas

## 1. Base del backend
- [x] 1.1 Configuración (`env.js`, conexión Mongoose), modelos con UUID y `userId`
- [x] 1.2 Repositorios Mongo con `scope(userId)` obligatorio + implementación en memoria para pruebas
- [x] 1.3 Manejo de errores uniforme (`AppError`, `errorHandler`) y validadores con validator.js

## 2. Seguridad (Integrante 1)
- [x] 2.1 HU-FIN-01 Registro con categorías predeterminadas
- [x] 2.2 HU-FIN-02 Login JWT 1 h, mensaje genérico, bloqueo 5 intentos / 15 min
- [x] 2.3 HU-FIN-03 Recuperación de contraseña con Nodemailer (enlace 30 min, un solo uso)
- [x] 2.4 HU-FIN-13 RBAC: `policies.js`, `requireRole`, gestión de roles, protección del último administrador
- [x] 2.5 HU-FIN-14 Aislamiento multiinquilino (404 ante recursos ajenos, `userId` del token)

## 3. Gestión financiera (Integrante 2)
- [x] 3.1 HU-FIN-04 Registro de ingresos/gastos con validación y confirmación de sobregiro
- [x] 3.2 HU-FIN-05 Categorías: crear, renombrar, eliminar con reemplazo, unicidad sin mayúsculas
- [x] 3.3 HU-FIN-06 Cuentas con saldo calculado y saldo consolidado
- [x] 3.4 HU-FIN-07 Historial paginado (10 por página) y edición
- [x] 3.5 HU-FIN-08 Filtros por fecha, categoría y tipo con total filtrado

## 4. Análisis (Integrante 3)
- [x] 4.1 HU-FIN-09 Indicadores del mes y periodo seleccionable
- [x] 4.2 HU-FIN-10 Gráficos Chart.js (barras, líneas, circular con monto y %)
- [x] 4.3 HU-FIN-11 Presupuesto mensual con alertas al 80 % y 100 %
- [x] 4.4 HU-FIN-12 Exportación PDF (jsPDF) y Excel (SheetJS)

## 5. Verificación
- [x] 5.1 64 pruebas automáticas (node:test + supertest) nombradas por HU y escenario
- [x] 5.2 Prueba de extremo a extremo en navegador de los flujos principales
- [x] 5.4 Script `npm run demo:seguridad` (JWT, RBAC y aislamiento verificados en vivo)
- [x] 5.5 Fechas con Day.js en backend y frontend; filtros en tiempo real
- [ ] 5.3 Prueba con el clúster de MongoDB Atlas del equipo (`npm run seed` + recorrido manual)
