# Especificación: Exportación de reportes

## Purpose

Reportes de movimientos filtrados en PDF (jsPDF) y Excel (SheetJS).

Historias de usuario de origen: HU-FIN-12 (plantilla oficial del curso, equipo G0203).

## Requirements

### Requirement: HU-FIN-12 Exportación de reportes en PDF y Excel
Como usuario titular registrado, quiero exportar el reporte de mis movimientos filtrados en formato PDF y Excel. Para conservar un respaldo de mis finanzas y compartirlo con mi contador en un archivo generado en menos de 1 minuto.
El sistema DEBE (MUST) cumplir los siguientes escenarios de aceptación.

#### Scenario: E1 Camino feliz: Exportación del reporte mensual en PDF
- **DADO QUE** el usuario titular visualiza en el historial sus 25 movimientos de noviembre de 2026
- **CUANDO** presiona el botón "Exportar PDF"
- **ENTONCES** el sistema descarga el archivo "reporte-finanzas-2026-11.pdf"
- **Y** el archivo contiene su nombre, el periodo, los 25 movimientos y los totales de ingresos, gastos y balance.

#### Scenario: E2 Flujo alternativo: Exportación a Excel de movimientos filtrados
- **DADO QUE** el usuario titular aplicó el filtro de tipo "Gasto" y categoría "Transporte" para noviembre de 2026
- **CUANDO** presiona el botón "Exportar Excel"
- **ENTONCES** el sistema descarga el archivo "reporte-finanzas-2026-11.xlsx"
- **Y** el archivo contiene únicamente los movimientos filtrados, con una columna por cada campo del movimiento.

#### Scenario: E3 Manejo de errores: Exportación sin movimientos
- **DADO QUE** los filtros aplicados por el usuario titular no devuelven ningún movimiento
- **CUANDO** presiona "Exportar PDF" o "Exportar Excel"
- **ENTONCES** el sistema no genera ningún archivo
- **Y** muestra el mensaje "No hay movimientos para exportar con los filtros seleccionados".

#### Scenario: E4 Caso de borde: Exportación de un año completo
- **DADO QUE** el usuario titular tiene 1,500 movimientos registrados en el año 2026
- **CUANDO** exporta a Excel el rango del 01/01/2026 al 31/12/2026
- **ENTONCES** el sistema genera un único archivo con los 1,500 movimientos sin truncar registros
- **Y** los totales del archivo coinciden con los mostrados en el dashboard para ese periodo.
