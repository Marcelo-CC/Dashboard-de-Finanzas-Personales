# Diseño técnico

## Arquitectura
```
React (Vite)  ──HTTP/JSON + JWT──►  Express 5
                                      ├─ routes/        (endpoints REST)
                                      ├─ middlewares/   (express-jwt, requireRole, errorHandler)
                                      ├─ controllers/   (HTTP ⇄ servicio, sin lógica de negocio)
                                      ├─ services/      (reglas de negocio + policies.js RBAC)
                                      ├─ validators/    (validator.js)
                                      └─ repositories/  (MongoDB/Mongoose; filtro userId obligatorio)
                                                   └──► MongoDB Atlas
```

## Decisiones
| Tema | Decisión | Motivo |
|---|---|---|
| Persistencia | MongoDB Atlas + Mongoose, `_id` UUID v4 | Requisito del enunciado (MERN) y de UUID |
| Multiinquilino | `userId` en cada colección + `scope()` en el repositorio que sobrescribe cualquier `userId` recibido | Aislamiento garantizado en un solo punto (DRY) |
| Autorización | `policies.js` con permisos por rol, invocado por cada método de servicio; `requireRole` como barrera temprana en rutas | Políticas centralizadas en la capa de servicios |
| Sesión | JWT HS256, 1 hora, validado con `express-jwt`; el rol y el estado se releen de la BD en cada solicitud | Un cambio de rol o desactivación aplica de inmediato |
| Contraseñas | bcrypt; bloqueo de 15 min tras 5 intentos fallidos | HU-FIN-02 E4 |
| Recuperación | Token aleatorio de 32 bytes, se guarda solo su SHA-256, expira en 30 min, un solo uso; respuesta idéntica exista o no el correo | HU-FIN-03, evita enumeración de usuarios |
| Saldos | Calculados (saldo inicial + ingresos − gastos) con agregación `$group` | Sin desincronización por datos duplicados |
| Pruebas | Repositorios en memoria con el mismo contrato (inyección de dependencias) + supertest | Pruebas rápidas sin base de datos; principio D de SOLID |
| Exportación | En el cliente con jsPDF + autotable y SheetJS, cargados de forma diferida | Requisito del enunciado; no recarga el servidor |
| Alertas | SweetAlert2 para confirmaciones; React-Toastify para notificaciones | Recomendación del enunciado |

## Modelo de datos
- **User**: name, email (único), passwordHash, role (ADMIN/USER), active, failedLoginAttempts, lockUntil, resetTokenHash, resetTokenExpires, roleChangedAt, roleChangedBy.
- **Category**: userId, name, nameKey (minúsculas, índice único userId+type+nameKey), type (income/expense).
- **Account**: userId, name, type (cash/bank/credit_card/wallet), initialBalance, currency (PEN).
- **Transaction**: userId, type, amount (≥ 0.01), date, categoryId, accountId, description.
- **Budget**: userId, month (AAAA-MM, único por usuario), amount.
