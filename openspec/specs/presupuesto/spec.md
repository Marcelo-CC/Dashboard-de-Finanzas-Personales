# Especificación: Presupuesto mensual

## Purpose

Presupuesto por mes con alertas al 80 % y al superar el 100 %.

Historias de usuario de origen: HU-FIN-11 (plantilla oficial del curso, equipo G0203).

## Requirements

### Requirement: HU-FIN-11 Presupuesto mensual y seguimiento
Como usuario titular registrado, quiero definir un presupuesto mensual de gastos y hacer seguimiento a su cumplimiento. Para controlar mis gastos a tiempo, recibiendo alertas al 80 % y al 100 % del presupuesto, y evitar terminar el mes con balance negativo.
El sistema DEBE (MUST) cumplir los siguientes escenarios de aceptación.

#### Scenario: E1 Camino feliz: Definición del presupuesto mensual
- **DADO QUE** el usuario titular no tiene un presupuesto definido para diciembre de 2026
- **CUANDO** define un presupuesto de S/ 2,500.00 para ese mes
- **Y** presiona el botón "Guardar"
- **ENTONCES** el sistema guarda el presupuesto
- **Y** muestra en el dashboard una barra de progreso con el texto "S/ 0.00 de S/ 2,500.00 (0 %)".

#### Scenario: E2 Flujo alternativo: Alerta preventiva al superar el 80 %
- **DADO QUE** el usuario titular tiene un presupuesto de S/ 2,500.00 para noviembre de 2026
- **Y** tiene gastos acumulados de S/ 1,950.00 en ese mes
- **CUANDO** registra un nuevo gasto de S/ 60.00
- **ENTONCES** el sistema actualiza la barra de progreso a 80.4 % en color amarillo
- **Y** muestra la notificación "Has consumido el 80 % de tu presupuesto mensual".

#### Scenario: E3 Manejo de errores: Monto de presupuesto inválido
- **DADO QUE** el usuario titular está definiendo su presupuesto mensual
- **CUANDO** ingresa un monto de S/ 0.00 o un valor no numérico
- **Y** presiona el botón "Guardar"
- **ENTONCES** el sistema no guarda el presupuesto
- **Y** muestra el mensaje "El presupuesto debe ser un monto mayor a 0".

#### Scenario: E4 Caso de borde: Presupuesto excedido
- **DADO QUE** el usuario titular tiene un presupuesto de S/ 2,500.00
- **Y** tiene gastos acumulados de S/ 2,480.00 en el mes
- **CUANDO** registra un nuevo gasto de S/ 50.00
- **ENTONCES** el sistema registra el gasto
- **Y** muestra la barra de progreso al 101.2 % en color rojo
- **Y** presenta la alerta "Has superado tu presupuesto mensual en S/ 30.00".
