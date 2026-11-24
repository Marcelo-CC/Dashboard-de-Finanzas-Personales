# Contexto del proyecto — Dashboard de Finanzas Personales

## Propósito
Aplicación web SaaS que permite a cada usuario registrar, organizar, visualizar y analizar sus ingresos y gastos,
controlar su presupuesto mensual y exportar reportes, con datos totalmente aislados por usuario.

## Equipo G0203
| Integrante | Módulo | Historias |
|---|---|---|
| CASTAÑEDA CANO, Marcelo Giovanni | Seguridad: autenticación, RBAC, aislamiento SaaS | HU-FIN-01, 02, 03, 13, 14 |
| DE LA CRUZ CARDENAS, Antony Marcelo | Movimientos, categorías, cuentas, historial y filtros | HU-FIN-04 a 08 |
| HUAMANI RODRIGUEZ, Jean Piero | Dashboard, gráficos, presupuesto y reportes | HU-FIN-09 a 12 |

## Convenciones
- Ramas: `feature/`, `fix/`, `hotfix/`, `refactor/`, `test/`, `docs/`, `chore/`, `ci/`, `release/`, en minúsculas,
  con guiones e ID de la historia: `feature/hu-fin-04-registro-movimientos`.
- Commits: Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`...).
- Montos con 2 decimales; fechas de movimientos en UTC (día contable); periodos `AAAA-MM`.
- Identificadores UUID v4 en todas las colecciones.

## Especificaciones vigentes (`openspec/specs/`)
`autenticacion`, `movimientos`, `categorias`, `cuentas`, `dashboard`, `presupuesto`, `reportes`, `control-acceso`.
