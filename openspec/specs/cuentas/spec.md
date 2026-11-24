# Especificación: Cuentas y medios de pago

## Purpose

Efectivo, cuentas bancarias, tarjetas de crédito y billeteras digitales con saldo calculado.

Historias de usuario de origen: HU-FIN-06 (plantilla oficial del curso, equipo G0203).

## Requirements

### Requirement: HU-FIN-06 Registro de cuentas y medios de pago
Como usuario titular registrado, quiero registrar mis cuentas o medios de pago (efectivo, cuenta bancaria, tarjeta de crédito o billetera digital) con su saldo inicial. Para saber en qué medio se encuentra mi dinero y consultar en menos de 5 segundos el saldo de cada cuenta y el total consolidado.
El sistema DEBE (MUST) cumplir los siguientes escenarios de aceptación.

#### Scenario: E1 Camino feliz: Registro de una billetera digital
- **DADO QUE** el usuario titular se encuentra en el módulo "Cuentas"
- **CUANDO** registra la cuenta "Yape" de tipo "Billetera digital" con un saldo inicial de S/ 150.00
- **ENTONCES** el sistema guarda la cuenta
- **Y** la lista con su saldo de S/ 150.00
- **Y** la habilita como opción en el formulario "Nuevo movimiento".

#### Scenario: E2 Flujo alternativo: Consulta del saldo total consolidado
- **DADO QUE** el usuario titular tiene la cuenta "Efectivo" con S/ 200.00
- **Y** la cuenta "BCP Ahorros" con S/ 1,800.00
- **CUANDO** ingresa al módulo "Cuentas"
- **ENTONCES** el sistema muestra el saldo de cada cuenta
- **Y** muestra el saldo total consolidado de S/ 2,000.00.

#### Scenario: E3 Manejo de errores: Campos obligatorios vacíos
- **DADO QUE** el usuario titular está registrando una nueva cuenta
- **CUANDO** deja vacío el campo "Nombre" o no selecciona el "Tipo"
- **Y** presiona el botón "Guardar"
- **ENTONCES** el sistema no guarda la cuenta
- **Y** muestra junto a cada campo faltante el mensaje "Este campo es obligatorio".

#### Scenario: E4 Caso de borde: Tarjeta de crédito con deuda inicial
- **DADO QUE** el usuario titular está registrando la tarjeta de crédito "Visa BBVA"
- **CUANDO** ingresa como saldo inicial una deuda de S/ -350.00
- **ENTONCES** el sistema acepta el saldo negativo únicamente para el tipo "Tarjeta de crédito"
- **Y** lo muestra en color rojo como deuda pendiente.
