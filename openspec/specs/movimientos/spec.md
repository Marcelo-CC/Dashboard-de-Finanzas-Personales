# Especificación: Registro, historial y filtrado de movimientos

## Purpose

Ingresos y gastos con validación de datos, historial paginado (10 por página) y filtros por fechas, categoría y tipo.

Historias de usuario de origen: HU-FIN-04, HU-FIN-07, HU-FIN-08 (plantilla oficial del curso, equipo G0203).

## Requirements

### Requirement: HU-FIN-04 Registro de ingresos y gastos
Como usuario titular registrado, quiero registrar un ingreso o un gasto indicando monto, fecha, categoría, cuenta y una descripción opcional. Para conocer en todo momento el saldo real de cada una de mis cuentas, registrando cada movimiento en menos de 30 segundos.
El sistema DEBE (MUST) cumplir los siguientes escenarios de aceptación.

#### Scenario: E1 Camino feliz: Registro exitoso de un gasto
- **DADO QUE** el usuario titular tiene la categoría de gasto "Alimentación"
- **Y** la cuenta "Efectivo" con un saldo de S/ 500.00
- **CUANDO** registra un gasto de S/ 45.50 con fecha 20/11/2026, categoría "Alimentación", cuenta "Efectivo" y descripción "Almuerzo"
- **ENTONCES** el sistema guarda el movimiento asociado a su usuario
- **Y** actualiza el saldo de la cuenta "Efectivo" a S/ 454.50
- **Y** muestra la notificación "Movimiento registrado".

#### Scenario: E2 Flujo alternativo: Registro de un ingreso
- **DADO QUE** el usuario titular tiene la categoría de ingreso "Sueldo"
- **Y** la cuenta "BCP Ahorros" con un saldo de S/ 1,200.00
- **CUANDO** registra un ingreso de S/ 3,000.00 con fecha 15/11/2026 en la categoría "Sueldo" y la cuenta "BCP Ahorros"
- **ENTONCES** el sistema guarda el ingreso
- **Y** actualiza el saldo de "BCP Ahorros" a S/ 4,200.00
- **Y** suma S/ 3,000.00 al total de ingresos de noviembre de 2026 en el dashboard.

#### Scenario: E3 Manejo de errores: Monto inválido
- **DADO QUE** el usuario titular está en el formulario "Nuevo movimiento"
- **CUANDO** ingresa como monto "0", "-20" o "abc"
- **Y** presiona el botón "Guardar"
- **ENTONCES** el sistema no registra el movimiento
- **Y** resalta el campo "Monto"
- **Y** muestra el mensaje "El monto debe ser un número mayor a 0".

#### Scenario: E4 Caso de borde: Gasto que supera el saldo de la cuenta
- **DADO QUE** la cuenta "Efectivo" del usuario titular tiene un saldo de S/ 30.00
- **CUANDO** intenta registrar un gasto de S/ 45.50 con esa cuenta
- **ENTONCES** el sistema muestra la alerta de confirmación "El gasto supera el saldo disponible de la cuenta. ¿Deseas continuar?"
- **Y** solo registra el gasto si el usuario presiona "Confirmar".

### Requirement: HU-FIN-07 Consulta del historial de movimientos
Como usuario titular registrado, quiero consultar el historial de mis movimientos ordenado del más reciente al más antiguo. Para revisar en qué gasté o de dónde recibí dinero y corregir los registros erróneos dentro de las 24 horas en que los detecto.
El sistema DEBE (MUST) cumplir los siguientes escenarios de aceptación.

#### Scenario: E1 Camino feliz: Visualización paginada del historial
- **DADO QUE** el usuario titular tiene 35 movimientos registrados
- **CUANDO** ingresa al módulo "Historial"
- **ENTONCES** el sistema muestra los 10 movimientos más recientes con fecha, tipo, categoría, cuenta, descripción y monto
- **Y** muestra la paginación "Página 1 de 4".

#### Scenario: E2 Flujo alternativo: Corrección de un movimiento desde el historial
- **DADO QUE** el usuario titular visualiza en el historial un gasto de S/ 45.50 en la categoría "Alimentación"
- **Y** dicho gasto fue pagado con la cuenta "Efectivo"
- **CUANDO** edita el movimiento y corrige el monto a S/ 54.50
- **ENTONCES** el sistema actualiza el movimiento
- **Y** descuenta S/ 9.00 adicionales del saldo de "Efectivo"
- **Y** muestra la notificación "Movimiento actualizado".

#### Scenario: E3 Manejo de errores: Falla de conexión con la API
- **DADO QUE** el usuario titular ingresa al módulo "Historial"
- **CUANDO** el servidor de la API no responde dentro de 10 segundos
- **ENTONCES** el sistema muestra el mensaje "No se pudo cargar el historial. Intenta nuevamente" junto al botón "Reintentar"
- **PERO** no muestra datos incompletos.

#### Scenario: E4 Caso de borde: Usuario sin movimientos registrados
- **DADO QUE** el usuario titular aún no ha registrado ningún movimiento
- **CUANDO** ingresa al módulo "Historial"
- **ENTONCES** el sistema muestra el mensaje "Aún no tienes movimientos registrados"
- **Y** muestra el botón "Registrar mi primer movimiento".

### Requirement: HU-FIN-08 Filtrado de movimientos
Como usuario titular registrado, quiero filtrar mis movimientos por rango de fechas, categoría y tipo de movimiento. Para analizar un periodo o rubro específico de mi economía en menos de 3 clics, sin revisar todo el historial.
El sistema DEBE (MUST) cumplir los siguientes escenarios de aceptación.

#### Scenario: E1 Camino feliz: Filtro combinado por fecha, categoría y tipo
- **DADO QUE** el usuario titular tiene movimientos registrados entre setiembre y noviembre de 2026
- **CUANDO** selecciona el rango del 01/11/2026 al 30/11/2026, la categoría "Alimentación" y el tipo "Gasto"
- **Y** presiona el botón "Aplicar filtros"
- **ENTONCES** el sistema muestra únicamente los gastos de "Alimentación" de noviembre de 2026
- **Y** muestra el total filtrado al pie del listado.

#### Scenario: E2 Flujo alternativo: Limpieza de filtros aplicados
- **DADO QUE** el usuario titular tiene filtros aplicados en el historial
- **CUANDO** presiona el botón "Limpiar filtros"
- **ENTONCES** el sistema restablece todos los filtros a sus valores predeterminados
- **Y** vuelve a mostrar el historial completo.

#### Scenario: E3 Manejo de errores: Rango de fechas invertido
- **DADO QUE** el usuario titular está configurando el filtro por rango de fechas
- **CUANDO** selecciona como fecha inicial el 30/11/2026 y como fecha final el 01/11/2026
- **ENTONCES** el sistema muestra la alerta "La fecha inicial no puede ser posterior a la fecha final"
- **Y** deshabilita el botón "Aplicar filtros".

#### Scenario: E4 Caso de borde: Filtro sin resultados
- **DADO QUE** el usuario titular no tiene gastos en la categoría "Mascotas" durante octubre de 2026
- **CUANDO** aplica el filtro de la categoría "Mascotas" para el rango del 01/10/2026 al 31/10/2026
- **ENTONCES** el sistema muestra el mensaje "No se encontraron movimientos con los filtros seleccionados"
- **Y** muestra un total filtrado de S/ 0.00.
