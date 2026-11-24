# Propuesta: MVP del Dashboard de Finanzas Personales

## Por qué
El enunciado del proyecto exige una aplicación web cliente-servidor completamente funcional para registrar y analizar
finanzas personales, preparada para operar como SaaS multiinquilino con control de acceso basado en roles.
Las 14 historias de usuario (HU-FIN-01 a HU-FIN-14) del equipo G0203 definen el alcance.

## Qué cambia
- Nueva API REST (Node.js + Express + MongoDB/Mongoose) con arquitectura Controller–Service–Repository.
- Nuevo frontend SPA (React + Vite) con dashboard, gráficos, movimientos, categorías, cuentas, presupuesto y administración.
- Autenticación JWT, recuperación de contraseña por correo y RBAC (ADMIN / USER).
- Aislamiento de datos por `userId` aplicado obligatoriamente en la capa de repositorios.
- Exportación de reportes a PDF y Excel.

## Capacidades afectadas
`autenticacion`, `movimientos`, `categorias`, `cuentas`, `dashboard`, `presupuesto`, `reportes`, `control-acceso` (todas nuevas).

## Fuera de alcance (YAGNI)
Transferencias entre cuentas, multimoneda, núcleos familiares compartidos (el modelo ya incluye `userId` para escalar),
aplicación móvil nativa.
