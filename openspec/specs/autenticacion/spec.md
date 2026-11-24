# Especificación: Autenticación y gestión de cuentas de usuario

## Purpose

Registro, inicio de sesión con JWT (1 hora), bloqueo por intentos fallidos y recuperación de contraseña mediante servicio de correo.

Historias de usuario de origen: HU-FIN-01, HU-FIN-02, HU-FIN-03 (plantilla oficial del curso, equipo G0203).

## Requirements

### Requirement: HU-FIN-01 Registro de cuenta de usuario
Como visitante no registrado de la plataforma, quiero crear una cuenta ingresando mi nombre, correo electrónico y una contraseña segura. Para acceder a un espacio financiero propio y aislado, completando el alta en menos de 2 minutos y sin intervención de un administrador.
El sistema DEBE (MUST) cumplir los siguientes escenarios de aceptación.

#### Scenario: E1 Camino feliz: Registro exitoso con datos válidos
- **DADO QUE** el visitante se encuentra en el formulario "Crear cuenta"
- **Y** el correo "ana.torres@gmail.com" no está registrado en la plataforma
- **CUANDO** ingresa el nombre "Ana Torres", el correo "ana.torres@gmail.com" y la contraseña "Finanzas#2026" con su confirmación
- **Y** presiona el botón "Registrarme"
- **ENTONCES** el sistema crea la cuenta con el rol "USUARIO" y un identificador de usuario (userId) único
- **Y** almacena la contraseña cifrada
- **Y** redirige al inicio de sesión mostrando la notificación "Cuenta creada correctamente".

#### Scenario: E2 Flujo alternativo: Primer ingreso con categorías predeterminadas
- **DADO QUE** el visitante completó su registro de forma exitosa
- **CUANDO** inicia sesión por primera vez en la plataforma
- **ENTONCES** el sistema le asigna automáticamente las categorías base "Sueldo", "Alimentación", "Transporte", "Vivienda" y "Ocio"
- **Y** muestra el dashboard con todos los indicadores en S/ 0.00.

#### Scenario: E3 Manejo de errores: Correo electrónico ya registrado
- **DADO QUE** ya existe una cuenta asociada al correo "ana.torres@gmail.com"
- **CUANDO** el visitante intenta registrarse nuevamente con ese mismo correo
- **ENTONCES** el sistema rechaza el registro
- **Y** conserva los datos ingresados excepto la contraseña
- **Y** muestra el mensaje "El correo electrónico ya se encuentra registrado".

#### Scenario: E4 Caso de borde: Contraseña por debajo del mínimo de seguridad
- **DADO QUE** el visitante está completando el formulario "Crear cuenta"
- **CUANDO** ingresa una contraseña de 7 caracteres "Fin#202"
- **ENTONCES** el sistema mantiene deshabilitado el botón "Registrarme"
- **Y** muestra la advertencia "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo".

### Requirement: HU-FIN-02 Inicio de sesión seguro
Como usuario titular registrado, quiero iniciar sesión con mi correo electrónico y contraseña. Para acceder de forma segura a mi información financiera mediante una sesión que expira automáticamente tras 1 hora de vigencia, reduciendo el riesgo de accesos no autorizados.
El sistema DEBE (MUST) cumplir los siguientes escenarios de aceptación.

#### Scenario: E1 Camino feliz: Inicio de sesión con credenciales válidas
- **DADO QUE** el usuario titular tiene una cuenta activa con el correo "ana.torres@gmail.com"
- **CUANDO** ingresa su correo y su contraseña correcta
- **Y** presiona el botón "Iniciar sesión"
- **ENTONCES** el sistema genera un token de sesión (JWT) válido por 1 hora
- **Y** redirige al dashboard mostrando el saludo "Bienvenida, Ana".

#### Scenario: E2 Flujo alternativo: Sesión vigente al recargar la página
- **DADO QUE** el usuario titular inició sesión hace 20 minutos
- **Y** su token de sesión sigue vigente
- **CUANDO** recarga la página del navegador
- **ENTONCES** el sistema mantiene la sesión activa
- **Y** vuelve a mostrar el dashboard sin solicitar nuevamente las credenciales.

#### Scenario: E3 Manejo de errores: Credenciales incorrectas
- **DADO QUE** el usuario titular se encuentra en la pantalla de inicio de sesión
- **CUANDO** ingresa su correo con una contraseña incorrecta
- **ENTONCES** el sistema deniega el acceso
- **Y** muestra el mensaje genérico "Correo o contraseña incorrectos" sin indicar cuál de los dos datos falló.

#### Scenario: E4 Caso de borde: Bloqueo tras intentos fallidos consecutivos
- **DADO QUE** el usuario titular acumula 4 intentos fallidos consecutivos de inicio de sesión
- **CUANDO** realiza el quinto intento con una contraseña incorrecta
- **ENTONCES** el sistema bloquea el acceso de esa cuenta durante 15 minutos
- **Y** muestra el mensaje "Cuenta bloqueada temporalmente. Intenta nuevamente en 15 minutos".

### Requirement: HU-FIN-03 Recuperación de contraseña por correo
Como usuario titular que olvidó su contraseña, quiero solicitar un enlace de restablecimiento de contraseña a mi correo electrónico. Para recuperar el acceso a mi cuenta en menos de 5 minutos sin perder mi historial financiero ni depender del soporte técnico.
El sistema DEBE (MUST) cumplir los siguientes escenarios de aceptación.

#### Scenario: E1 Camino feliz: Solicitud de enlace de restablecimiento
- **DADO QUE** el usuario titular está en la pantalla "¿Olvidaste tu contraseña?"
- **Y** su correo "ana.torres@gmail.com" está registrado
- **CUANDO** ingresa su correo
- **Y** presiona el botón "Enviar enlace"
- **ENTONCES** el sistema envía, mediante el servicio de correo, un enlace de restablecimiento de un solo uso válido por 30 minutos
- **Y** muestra el mensaje "Revisa tu bandeja de entrada".

#### Scenario: E2 Flujo alternativo: Restablecimiento completado con éxito
- **DADO QUE** el usuario titular abrió un enlace de restablecimiento vigente
- **CUANDO** ingresa y confirma la nueva contraseña "Ahorro#2027"
- **Y** presiona el botón "Guardar"
- **ENTONCES** el sistema actualiza la contraseña cifrada
- **Y** invalida el enlace utilizado
- **Y** redirige al inicio de sesión con el mensaje "Contraseña actualizada correctamente".

#### Scenario: E3 Manejo de errores: Confirmación de contraseña no coincide
- **DADO QUE** el usuario titular está en el formulario de nueva contraseña
- **CUANDO** ingresa "Ahorro#2027" como nueva contraseña
- **Y** escribe "Ahorro#2028" en el campo de confirmación
- **ENTONCES** el sistema impide guardar el cambio
- **Y** muestra el mensaje "Las contraseñas no coinciden".

#### Scenario: E4 Caso de borde: Enlace de restablecimiento expirado
- **DADO QUE** el usuario titular recibió un enlace de restablecimiento hace 31 minutos
- **CUANDO** intenta abrir dicho enlace
- **ENTONCES** el sistema rechaza el enlace
- **Y** muestra el mensaje "El enlace ha expirado. Solicita uno nuevo"
- **Y** ofrece el botón "Reenviar enlace".
