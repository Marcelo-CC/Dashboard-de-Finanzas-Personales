# Especificación: Administración de categorías

## Purpose

Categorías propias de ingresos y gastos, únicas por usuario sin distinguir mayúsculas.

Historias de usuario de origen: HU-FIN-05 (plantilla oficial del curso, equipo G0203).

## Requirements

### Requirement: HU-FIN-05 Administración de categorías
Como usuario titular registrado, quiero crear, editar y eliminar categorías de ingresos y de gastos. Para clasificar el 100 % de mis movimientos según mis propios hábitos y obtener reportes por categoría que reflejen mi realidad financiera.
El sistema DEBE (MUST) cumplir los siguientes escenarios de aceptación.

#### Scenario: E1 Camino feliz: Creación de una categoría de gasto
- **DADO QUE** el usuario titular se encuentra en el módulo "Categorías"
- **CUANDO** crea la categoría "Mascotas" de tipo "Gasto"
- **Y** presiona el botón "Guardar"
- **ENTONCES** el sistema guarda la categoría asociada a su usuario
- **Y** la muestra disponible en el formulario "Nuevo movimiento".

#### Scenario: E2 Flujo alternativo: Edición del nombre de una categoría en uso
- **DADO QUE** existe la categoría "Ocio" con 8 movimientos asociados
- **CUANDO** el usuario titular la renombra como "Entretenimiento"
- **ENTONCES** el sistema actualiza el nombre de la categoría
- **Y** los 8 movimientos asociados se muestran con la categoría "Entretenimiento" en el historial.

#### Scenario: E3 Manejo de errores: Nombre de categoría duplicado
- **DADO QUE** el usuario titular ya tiene la categoría de gasto "Transporte"
- **CUANDO** intenta crear otra categoría de gasto llamada "transporte"
- **ENTONCES** el sistema rechaza la creación sin distinguir mayúsculas de minúsculas
- **Y** muestra el mensaje "Ya existe una categoría con ese nombre".

#### Scenario: E4 Caso de borde: Eliminación de una categoría con movimientos
- **DADO QUE** la categoría "Vivienda" tiene 5 movimientos asociados
- **CUANDO** el usuario titular presiona "Eliminar" sobre dicha categoría
- **ENTONCES** el sistema muestra la alerta "Esta categoría tiene 5 movimientos. Selecciona una categoría de reemplazo antes de eliminarla"
- **Y** no elimina la categoría hasta que se elija la categoría de reemplazo.
