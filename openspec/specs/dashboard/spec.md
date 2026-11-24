# Especificación: Dashboard de indicadores y gráficos

## Purpose

Indicadores del mes y gráficos Chart.js de ingresos, gastos, balance y distribución por categoría.

Historias de usuario de origen: HU-FIN-09, HU-FIN-10 (plantilla oficial del curso, equipo G0203).

## Requirements

### Requirement: HU-FIN-09 Dashboard de indicadores financieros
Como usuario titular registrado, quiero visualizar en un dashboard mis indicadores financieros del mes: total de ingresos, total de gastos, balance y porcentaje del presupuesto consumido. Para conocer mi situación financiera en menos de 10 segundos y tomar decisiones de ahorro oportunas.
El sistema DEBE (MUST) cumplir los siguientes escenarios de aceptación.

#### Scenario: E1 Camino feliz: Indicadores del mes actual
- **DADO QUE** en noviembre de 2026 el usuario titular registró ingresos por S/ 3,500.00
- **Y** registró gastos por S/ 2,100.00
- **CUANDO** ingresa al dashboard
- **ENTONCES** el sistema muestra la tarjeta "Ingresos: S/ 3,500.00"
- **Y** la tarjeta "Gastos: S/ 2,100.00"
- **Y** la tarjeta "Balance: S/ 1,400.00".

#### Scenario: E2 Flujo alternativo: Cambio del periodo consultado
- **DADO QUE** el usuario titular visualiza el dashboard del mes actual
- **CUANDO** selecciona el periodo "Octubre 2026"
- **ENTONCES** el sistema recalcula todos los indicadores
- **Y** los muestra considerando únicamente los movimientos de octubre de 2026.

#### Scenario: E3 Manejo de errores: Sesión expirada al consultar indicadores
- **DADO QUE** el usuario titular tiene abierto el dashboard
- **Y** su token de sesión acaba de expirar
- **CUANDO** intenta actualizar los indicadores
- **ENTONCES** el sistema recibe la respuesta "401 No autorizado" y cierra la sesión
- **Y** redirige al inicio de sesión con el mensaje "Tu sesión ha expirado. Inicia sesión nuevamente".

#### Scenario: E4 Caso de borde: Balance negativo en el mes
- **DADO QUE** el usuario titular registró en el mes ingresos por S/ 1,000.00
- **Y** registró gastos por S/ 1,250.00
- **CUANDO** ingresa al dashboard
- **ENTONCES** el sistema muestra el balance "S/ -250.00" en color rojo
- **Y** muestra el aviso "Tus gastos superan tus ingresos este mes".

### Requirement: HU-FIN-10 Gráficos de ingresos, gastos, balance y categorías
Como usuario titular registrado, quiero ver gráficos interactivos de ingresos versus gastos, evolución del balance y distribución de gastos por categoría. Para identificar visualmente las 3 categorías en las que concentro la mayor parte de mis gastos y ajustar mis hábitos de consumo.
El sistema DEBE (MUST) cumplir los siguientes escenarios de aceptación.

#### Scenario: E1 Camino feliz: Visualización de los tres gráficos
- **DADO QUE** el usuario titular tiene movimientos registrados en los últimos 6 meses
- **CUANDO** ingresa a la sección "Gráficos" del dashboard
- **ENTONCES** el sistema muestra un gráfico de barras de ingresos versus gastos por mes
- **Y** un gráfico de líneas con la evolución del balance
- **Y** un gráfico circular con la distribución de gastos por categoría.

#### Scenario: E2 Flujo alternativo: Detalle interactivo de una categoría
- **DADO QUE** el usuario titular visualiza el gráfico circular de gastos de noviembre de 2026
- **Y** el total de gastos de ese mes es S/ 2,100.00
- **CUANDO** pasa el cursor sobre la porción "Alimentación"
- **ENTONCES** el sistema muestra un recuadro emergente con el monto "S/ 840.00"
- **Y** el porcentaje "40 %" del total de gastos del mes.

#### Scenario: E3 Manejo de errores: Falla al obtener los datos del gráfico
- **DADO QUE** el usuario titular ingresa a la sección "Gráficos"
- **CUANDO** la consulta de datos a la API devuelve un error
- **ENTONCES** el sistema muestra en el área de cada gráfico el mensaje "No fue posible cargar la información del gráfico"
- **Y** muestra el botón "Reintentar".

#### Scenario: E4 Caso de borde: Mes con gastos en una sola categoría
- **DADO QUE** el usuario titular registró todos sus gastos del mes en la categoría "Vivienda"
- **CUANDO** visualiza el gráfico de distribución por categorías
- **ENTONCES** el sistema muestra el gráfico circular completo con "Vivienda" al 100 %
- **PERO** no presenta porciones vacías de otras categorías.
