# Especificación: Control de acceso (RBAC) y aislamiento multiinquilino

## Purpose

Roles ADMIN/USER con políticas centralizadas en servicios y aislamiento de datos por userId en la capa de repositorios.

Historias de usuario de origen: HU-FIN-13, HU-FIN-14 (plantilla oficial del curso, equipo G0203).

## Requirements

### Requirement: HU-FIN-13 Control de acceso basado en roles (RBAC)
Como administrador de la plataforma, quiero asignar y modificar el rol (ADMINISTRADOR o USUARIO) de las cuentas registradas. Para garantizar que solo los perfiles autorizados ejecuten operaciones críticas, con trazabilidad del 100 % de los cambios de rol.
El sistema DEBE (MUST) cumplir los siguientes escenarios de aceptación.

#### Scenario: E1 Camino feliz: Asignación del rol administrador
- **DADO QUE** el administrador inició sesión
- **Y** el usuario "luis.rojas@gmail.com" tiene el rol "USUARIO"
- **CUANDO** le asigna el rol "ADMINISTRADOR" desde el módulo "Gestión de usuarios"
- **ENTONCES** el sistema actualiza el rol del usuario
- **Y** registra la fecha y el autor del cambio
- **Y** muestra la notificación "Rol actualizado correctamente".

#### Scenario: E2 Flujo alternativo: Desactivación de una cuenta
- **DADO QUE** el administrador visualiza la lista de usuarios registrados
- **CUANDO** desactiva la cuenta "luis.rojas@gmail.com"
- **ENTONCES** el sistema impide nuevos inicios de sesión de esa cuenta
- **Y** conserva sus datos financieros sin eliminarlos
- **PERO** no los muestra al administrador.

#### Scenario: E3 Manejo de errores: Acceso de un usuario sin permisos
- **DADO QUE** un usuario con el rol "USUARIO" ha iniciado sesión
- **CUANDO** intenta acceder a la ruta "/admin/usuarios" o invocar el servicio de cambio de roles
- **ENTONCES** el sistema deniega la operación con el código "403 Prohibido"
- **Y** muestra el mensaje "No tienes permisos para realizar esta acción".

#### Scenario: E4 Caso de borde: Intento de retirar al último administrador
- **DADO QUE** existe un único usuario con el rol "ADMINISTRADOR" en la plataforma
- **CUANDO** ese administrador intenta cambiar su propio rol a "USUARIO"
- **ENTONCES** el sistema rechaza el cambio
- **Y** muestra el mensaje "Debe existir al menos un administrador activo en la plataforma".

### Requirement: HU-FIN-14 Aislamiento de datos por usuario (SaaS multiinquilino)
Como usuario titular registrado, quiero que mis movimientos, cuentas, categorías y presupuestos sean visibles y modificables únicamente por mí. Para confiar mis datos financieros reales a una plataforma SaaS compartida, con la garantía de que ningún otro usuario puede verlos ni modificarlos.
El sistema DEBE (MUST) cumplir los siguientes escenarios de aceptación.

#### Scenario: E1 Camino feliz: Consulta limitada a los datos propios
- **DADO QUE** los usuarios titulares "Ana" y "Luis" tienen movimientos registrados en la plataforma
- **CUANDO** Ana consulta su historial de movimientos
- **ENTONCES** el sistema muestra únicamente los movimientos asociados al identificador de usuario de Ana
- **PERO** no muestra ningún registro de Luis.

#### Scenario: E2 Flujo alternativo: Asignación automática del propietario
- **DADO QUE** Ana inició sesión en la plataforma
- **CUANDO** registra una nueva categoría, cuenta o movimiento
- **ENTONCES** el sistema asocia automáticamente el registro al identificador de usuario de Ana obtenido de su token de sesión.

#### Scenario: E3 Manejo de errores: Acceso a un registro de otro usuario
- **DADO QUE** Ana conoce el identificador de un movimiento que pertenece a Luis
- **CUANDO** intenta consultarlo, editarlo o eliminarlo invocando directamente la API con ese identificador
- **ENTONCES** el sistema responde "404 Recurso no encontrado"
- **Y** no revela ni modifica la información de Luis.

#### Scenario: E4 Caso de borde: Solicitud manipulada con el userId de otro usuario
- **DADO QUE** Ana envía una solicitud de registro de movimiento
- **Y** la solicitud incluye manualmente el userId de Luis
- **CUANDO** el sistema procesa la solicitud
- **ENTONCES** el sistema ignora el userId enviado
- **Y** registra el movimiento a nombre de Ana
- **Y** no altera ningún dato de Luis.
