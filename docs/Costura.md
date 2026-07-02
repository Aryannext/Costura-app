Costura – app

Centro Tecnológico de la Amazonia

Instructor

Oscar Eduardo Yanguas Arguello

Aprendiz

Cristian Cantillo Mejía

Fecha

Tabla de contenido

Introducción ………………………………………………………………………………………… 3

Introducción

**Contexto**

El proceso actual se realiza de forma manual y depende principalmente de la memoria de las personas encargadas. Esto ocasiona errores como olvidos en las entregas, falta de comunicación con los clientes y dificultades para llevar un control adecuado de los pagos. Como consecuencia, se presentan retrasos, confusiones en la información financiera y riesgo de pérdidas económicas debido a prendas entregadas o terminadas sin haber sido cobradas correctamente.

**Necesidad del Negocio** 

La dueña necesita una herramienta que le ayude a llevar el control de las prendas, los clientes y los pagos de forma organizada. El sistema debe evitar olvidos, registrar toda la información importante y permitir que los clientes reciban avisos cuando sus prendas estén listas o exista alguna novedad. De esta manera, se reducirán los errores, se mejorará la atención al cliente y se tendrá un mejor control del dinero recibido y pendiente de cobro.

**Objetivos
Objetivo General**

Desarrollar un sistema web para apoyar la gestión de un taller de confección y arreglo de prendas, permitiendo administrar clientes, órdenes de trabajo, prendas, pagos y comunicaciones con los clientes, con el fin de mejorar la organización del negocio, reducir errores operativos y mantener un control adecuado de las entregas y cobros.

**Objetivos Específicos**
- Registrar y administrar la información de los clientes.
- Gestionar órdenes de trabajo asociadas a uno o varios arreglos de prendas.
- Registrar la información de tallada de las prendas, incluyendo observaciones y evidencia fotográfica.
- Controlar el estado de avance de cada prenda y de cada orden de trabajo.
- Llevar un registro de pagos, abonos y saldos pendientes.
- Notificar automáticamente a los clientes cuando sus prendas estén listas para ser reclamadas.
- Facilitar el seguimiento de órdenes vencidas o sin reclamar.
- Consultar información relevante para la toma de decisiones del negocio, como ingresos registrados y valores pendientes por cobrar.
- Mantener un historial de actividades y movimientos realizados sobre cada orden de trabajo.

**Visión y Alcance**

**Visión: **

Contar con una herramienta digital que permita gestionar de manera organizada las prendas, los clientes y los pagos del negocio de confección, mejorando el control de la información, reduciendo errores y agilizando la comunicación con los clientes.

**Alcance:**

El sistema permitirá registrar clientes, administrar prendas, controlar pagos, consultar el estado de los trabajos y enviar notificaciones automáticas a los clientes. La solución estará disponible a través de un navegador web y funcionará dentro de la red local del negocio.

**Actores del Sistema**

Modista / dueña

Persona encargada de registrar las prendas, actualizar el estado de los trabajos, gestionar los pagos y consultar la información almacenada en el sistema.

Cliente

Persona que entrega una prenda para realizar un arreglo o modificación y recibe notificaciones sobre el estado de su prenda.

Sistema

Componente encargado de almacenar la información, generar alertas, organizar las prendas por prioridad y enviar notificaciones automáticas a los clientes.

**Requisitos Funcionales**

**Gestión de Clientes**
- RF-01. El sistema debe permitir a la modista / dueña registrar un nuevo cliente ingresando su nombre y número de teléfono.
- RF-02. El sistema debe permitir a la modista / dueña consultar la información de un cliente registrado.
- RF-03. El sistema debe permitir a la modista / dueña actualizar la información de un cliente registrado.
- RF-04. El sistema debe permitir a la modista/dueña consultar el historial de órdenes de trabajo asociadas a un cliente.

**Gestión de Ordenes de Trabajo**
- RF-05. El sistema debe permitir a la modista / dueña crear una nueva orden de trabajo para un cliente registrado.
- RF-06. El sistema debe permitir a la modista / dueña asignar una fecha estimada de entrega a una orden de trabajo.
- RF-07. El sistema debe permitir a la modista / dueña consultar la información general de una orden de trabajo.
- RF-08. El sistema debe permitir a la modista / dueña visualizar todas las órdenes de trabajo pendientes.
- RF-09. El sistema debe permitir a la modista/dueña visualizar las órdenes de trabajo ordenadas por fecha de entrega.
- RF-10. El sistema debe permitir a la modista/dueña consultar las órdenes de trabajo vencidas.
- RF-11. El sistema debe permitir a la modista/dueña cancelar una orden de trabajo cuando el cliente decida retirar sus prendas antes de la finalización del servicio.
- RF-12. El sistema debe impedir la cancelación de órdenes de trabajo que ya se encuentren en estado “Entregada”, con el fin de preservar la trazabilidad histórica del servicio prestado.
- RF-13. El sistema debe permitir a la modista/dueña reabrir una orden de trabajo previamente entregada cuando sea necesario corregir errores de registro o realizar ajustes excepcionales posteriores a la entrega.
- RF-14. El sistema debe registrar en el historial de actividades toda reapertura realizada sobre una orden de trabajo.
- RF-15. El sistema debe permitir a la modista/dueña registrar la entrega individual de una prenda perteneciente a una orden de trabajo.
- RF-16. El sistema debe permitir consultar las prendas pendientes y entregadas dentro de una misma orden de trabajo.

**Gestión de Prendas**
- RF-17. El sistema debe permitir a la modista / dueña registrar una prenda dentro de una orden de trabajo.
- RF-18. El sistema debe permitir a la modista / dueña registrar la descripción del arreglo solicitado para una prenda.
- RF-19. El sistema debe permitir a la modista / dueña asignar un valor económico a una prenda.
- RF-20. El sistema debe permitir a la modista / dueña consultar el estado actual de una prenda.
- RF-21. El sistema debe permitir a la modista / dueña actualizar el estado de una prenda.
- RF-22. El sistema debe permitir a la modista / dueña visualizar todas las prendas asociadas a una orden de trabajo.
- RF-23. El sistema debe permitir calcular automáticamente el valor total de una orden de trabajo a partir de las prendas registradas.
- RF-24. El sistema debe actualizar automáticamente el estado de una orden de trabajo a "Lista para entregar" cuando todas las prendas asociadas se encuentren en estado "Terminada".
- RF-25. El sistema debe permitir a la modista/dueña registrar observaciones adicionales sobre una prenda.
- RF-26. El sistema debe permitir a la modista/dueña consultar las observaciones registradas para una prenda.
- RF-27. El sistema debe permitir a la modista/dueña capturar una fotografía de una prenda durante su registro.
- RF-28. El sistema debe permitir a la modista/dueña almacenar una o varias fotografías asociadas a una prenda.
- RF-29. El sistema debe permitir a la modista/dueña consultar las fotografías registradas para una prenda.
- RF-30. El sistema debe permitir a la modista/dueña visualizar las fotografías de una prenda dentro de su información detallada.
- RF-31. El sistema debe permitir a la modista/dueña modificar la información registrada de una prenda para corregir errores o actualizar los datos del servicio solicitado.
- RF-32. El sistema debe permitir eliminar fotografías registradas por error.

**Gestión de pagos**
- RF-33. El sistema debe permitir a la modista / dueña registrar abonos realizados por un cliente.
- RF-34. El sistema debe permitir a la modista / dueña registrar el método de pago utilizado en un abono.
- RF-35. El sistema debe permitir a la modista / dueña consultar el historial de pagos de una orden de trabajo.
- RF-36. El sistema debe permitir calcular automáticamente el saldo pendiente de una orden de trabajo.
- RF-37. El sistema debe permitir a la modista / dueña consultar las órdenes de trabajo con saldo pendiente.
- RF-38. El sistema debe permitir actualizar automáticamente el estado de pago de una orden de trabajo cuando el saldo pendiente sea igual a cero.

**Notificaciones**
- RF-39. El sistema debe permitir enviar una notificación automática al cliente cuando una orden de trabajo esté lista para ser entregada.
- RF-40. El sistema debe permitir enviar recordatorios automáticos a los clientes que tengan órdenes de trabajo pendientes de reclamar.
- RF-41. El sistema debe permitir consultar el historial de notificaciones enviadas a un cliente.
- RF-42. El sistema debe permitir a la modista/dueña enviar al cliente un resumen de la orden de trabajo mediante Telegram, incluyendo el detalle de las prendas, valores registrados, pagos realizados y saldo pendiente.

**Control y Seguimiento**
- RF-43. El sistema debe permitir a la modista / dueña consultar las órdenes de trabajo próximas a vencer.
- RF-44. El sistema debe permitir a la modista / dueña consultar el total de ingresos registrados durante un periodo determinado.
- RF-45. El sistema debe permitir a la modista / dueña consultar el total de dinero pendiente por cobrar.
- RF-46. El sistema debe permitir consultar el historial de actividades realizadas sobre una orden de trabajo.
- RF-47. El sistema debe permitir identificar las órdenes de trabajo que permanezcan sin reclamar durante más de 30 días.
- RF-48. El sistema debe registrar automáticamente la fecha y hora cuando una orden de trabajo cambie al estado "Entregada".
- RF-49. El sistema debe permitir a la modista/dueña buscar órdenes de trabajo utilizando el nombre del cliente

**Requisitos No Funcionales**

**Rendimiento**
- RNF-01. El sistema debe mostrar la información de una orden de trabajo en menos de 2 segundos cuando existan hasta 500 órdenes registradas.
- RNF-02. El sistema debe registrar una nueva orden de trabajo en menos de 3 segundos cuando todos los campos obligatorios hayan sido diligenciados.
- RNF-03. El sistema debe calcular el saldo pendiente de una orden de trabajo en menos de 1 segundo después de registrar un pago.

**Usabilidad**
- RNF-04. La interfaz debe permitir completar el registro de una orden de trabajo utilizando máximo tres pantallas consecutivas.
- RNF-05. El sistema debe mostrar mensajes de confirmación después de cada operación exitosa de registro, actualización o eliminación.
- RNF-06. La interfaz debe visualizar correctamente todos los elementos en pantallas móviles con resoluciones desde 360 píxeles de ancho.

**Seguridad**
- RNF-07. El sistema debe requerir autenticación mediante usuario y contraseña antes de permitir el acceso a la información registrada.
- RNF-08. El sistema debe almacenar las contraseñas utilizando un algoritmo de cifrado seguro antes de guardarlas en la base de datos.
- RNF-09. El sistema debe cerrar automáticamente la sesión después de 15 minutos de inactividad.

**Integridad de Datos**
- RNF-10. El sistema debe impedir el registro de una orden de trabajo sin un cliente asociado.
- RNF-11. El sistema debe impedir el registro de una prenda sin una orden de trabajo asociada.
- RNF-12. El sistema debe impedir el registro de pagos con valores iguales o inferiores a cero.

**Disponibilidad**
- RNF-13. El sistema debe estar disponible durante el 95% del tiempo en que el computador servidor se encuentre encendido.
- RNF-14. El sistema debe permitir el acceso simultáneo desde al menos dos dispositivos conectados a la misma red local.

**Compatibilidad**
- RNF-15. El sistema debe funcionar correctamente en las versiones actuales de Google Chrome, Mozilla Firefox y Microsoft Edge.
- RNF-16. El sistema debe adaptarse automáticamente a dispositivos móviles, tabletas y computadores sin pérdida de funcionalidad.

**Respaldo de Información**
- RNF-17. El sistema debe permitir generar una copia de seguridad de la base de datos en un archivo descargable.
- RNF-18. El sistema debe permitir restaurar la información a partir de una copia de seguridad previamente generada.

**Mantenibilidad**
- RNF-19. El sistema debe registrar los errores de ejecución en un archivo de eventos para facilitar su diagnóstico y corrección.
- RNF-20. El sistema debe mantener separadas las capas de presentación, lógica de negocio y acceso a datos para facilitar futuras modificaciones.
- RNF-21. El sistema debe permitir almacenar imágenes en formato JPG, JPEG o PNG.
- RNF-22. El sistema debe permitir cargar imágenes con un tamaño máximo de 10 MB por archivo.
- RNF-23. El sistema debe mostrar una fotografía almacenada en menos de 3 segundos cuando sea consultada por la modista/dueña.

**Épicas del Proyecto**

**Épica 1: Gestión de Clientes**

Como modista/dueña,

Quiero administrar la información de mis clientes,

Para mantener actualizados sus datos de contacto y consultar fácilmente el historial de trabajos realizados.

**Requisitos relacionados:**

RF-01 al RF-04.

**Épica 2: Gestión de Órdenes de Trabajo**

Como modista/dueña,

Quiero crear y administrar órdenes de trabajo,

Para organizar las prendas recibidas, controlar las fechas de entrega y realizar seguimiento al estado de cada encargo.

**Requisitos relacionados:**

RF-05 al RF-16.

RF-49.

**Épica 3: Gestión de Prendas**

Como modista/dueña,

Quiero registrar y controlar las prendas asociadas a una orden de trabajo,

Para conocer los arreglos solicitados, registrar observaciones, almacenar evidencia fotográfica, controlar el valor de cada prenda y realizar seguimiento al avance de los trabajos.

**Requisitos relacionados:**

RF-17 al RF-32.

**Épica 4: Gestión de Pagos**

Como modista/dueña,

Quiero registrar y consultar los pagos realizados por mis clientes,

Para llevar un control adecuado de los ingresos, los abonos y los saldos pendientes de cobro.

**Requisitos relacionados:**

RF-33 al RF-38.

**Épica 5: Notificaciones y Comunicación con Clientes**

Como modista/dueña,

Quiero que el sistema envíe notificaciones automáticas a mis clientes,

Para informar oportunamente cuando sus prendas estén listas y recordarles la recolección de trabajos pendientes.

**Requisitos relacionados:**

RF-39 al RF-42.

**Épica 6: Control y Seguimiento del Negocio**

Como modista/dueña,

Quiero consultar información sobre entregas, ingresos, actividades, dinero pendiente de cobro y trabajos sin reclamar,

Para tomar decisiones informadas y mantener un mejor control de mi negocio.

**Requisitos relacionados:**

RF-43 al RF-48.

**Historias de usuario por épicas**

**Épica 1: Gestión de Clientes**

**HU-01 Registrar Cliente: **Como modista/dueña,

Quiero registrar un nuevo cliente con su nombre y número de teléfono,

Para mantener organizada la información de las personas que solicitan arreglos de prendas.

**Criterios de Aceptación**

CA-01. El sistema debe permitir ingresar el nombre del cliente.

CA-02. El sistema debe permitir ingresar el número del cliente.

CA-03. El sistema debe validar que los campos obligatorios estén completos antes de guardar la información.

CA-04. El sistema debe mostrar un mensaje de confirmación cuando el cliente sea registrado correctamente.

CA-05. El sistema debe almacenar la información del cliente para futuras consultas.

**HU-02 Consultar Cliente:** Como modista/dueña,

Quiero consultar la información de un cliente registrado, 

Para acceder rápidamente a sus datos cuando necesite gestionar una orden de trabajo.

**Criterios de Aceptación**

CA-01. El sistema debe permitir buscar un cliente por nombre o número de teléfono.

CA-02. El sistema debe mostrar la información del cliente cuando exista un registro asociado.

CA-03. El sistema debe informar cuando no existan resultados para la búsqueda realizada.

CA-04. El sistema debe mostrar la información sin permitir modificaciones durante la consulta.

**HU-03 Actualizar Cliente: **Como modista/dueña,

Quiero modificar la información de un cliente registrado,

Para mantener sus datos actualizado cuando exista algún cambio.

**Criterios de Aceptación**

CA-01. El sistema debe permitir editar la información de un cliente registrado.

CA-02. El sistema debe validar que los datos obligatorios continúen diligenciados antes de guardar los cambios.

CA-03. El sistema debe guardar la información actualizada correctamente.

CA-04. El sistema debe mostrar un mensaje de confirmación cuando la actualización se realice exitosamente.

**HU-04 Consultar Historial de Órdenes de Trabajo: **Como modista/dueña,

Quiero consultar el historial de órdenes de trabajo asociadas a un cliente,

Para conocer los trabajos realizados anteriormente y facilitar el seguimiento de futuras solicitudes.

**Criterios de Aceptación**

CA-01. El sistema debe mostrar las órdenes de trabajo asociadas a un cliente seleccionado.

CA-02. El sistema debe mostrar la fecha de registro de cada orden de trabajo.

CA-03. El sistema debe mostrar el estado actual de cada orden de trabajo.

CA-04. El sistema debe permitir acceder al detalle de una orden de trabajo desde el historial.

CA-05. El sistema debe informar cuando el cliente no tenga órdenes de trabajo registradas.

**Épica 2: Gestión de Órdenes de trabajo**

**HU-05 Crear Orden de Trabajo: **Como modista/dueña,

Quiero crear una nueva orden de trabajo para un cliente registrado,

Para organizar las prendas recibidas y realizar seguimiento a los arreglos solicitados.

**Criterios de Aceptación**

CA-01. El sistema debe permitir seleccionar un cliente previamente registrado.

CA-02. El sistema debe generar una nueva orden de trabajo asociada al cliente seleccionado.

CA-03. El sistema debe asignar un identificador único a cada orden de trabajo.

CA-04. El sistema debe registrar la fecha de creación de la orden de trabajo.

CA-05. El sistema debe mostrar un mensaje de confirmación cuando la orden sea creada correctamente.

**HU-06 Asignar Fecha de Entrega: **Como modista/dueña,

Quiero asignar una fecha estimada de entrega a una orden de trabajo,

Para informar al cliente cuándo podrá reclamar sus prendas.

**Criterios de Aceptación**

CA-01. El sistema debe permitir seleccionar una fecha estimada de entrega.

CA-02. El sistema debe asociar la fecha seleccionada a la orden de trabajo.

CA-03. El sistema debe guardar la fecha de entrega asignada.

CA-04. El sistema debe mostrar la fecha de entrega dentro de la información de la orden.

**HU-07. Registrar entrega de prendas: **Como modista/dueña,

Quiero registrar la entrega de una o varias prendas terminadas pertenecientes a una orden de trabajo,

Para llevar un control preciso de las prendas entregadas y de las que aún permanecen pendientes dentro de la misma orden.

**Criterios de Aceptación**

CA-01. El sistema debe permitir seleccionar una orden de trabajo existente.

CA-02. El sistema debe mostrar las prendas asociadas a la orden junto con su estado actual.

CA-03. Solo las prendas con estado "Terminada" podrán marcarse como "Entregada".

CA-04. El sistema debe permitir registrar la entrega de una o varias prendas de manera independiente.

CA-05. Al registrar una entrega, el estado de la prenda debe cambiar automáticamente a "Entregada".

CA-06. El sistema debe registrar la actividad en el historial de la orden.

CA-07. Si aún existen prendas pendientes o en proceso, la orden conservará su estado actual.

CA-08. La orden solo cambiará al estado "Entregada" cuando todas las prendas asociadas hayan sido entregadas.

CA-09. El sistema debe mostrar claramente cuáles prendas ya fueron entregadas y cuáles permanecen pendientes.

**HU-08 Cancelar Orden de Trabajo: **Como modista/dueña,

Quiero cancelar una orden de trabajo cuando el cliente decida retirar sus prendas antes de finalizar el servicio,

Para mantener actualizada la información del sistema y evitar continuar registrando actividades sobre una orden que ya no será ejecutada.

**Criterios de Aceptación**

CA-01. El sistema debe permitir cancelar órdenes que se encuentren activas.

CA-02. El sistema debe solicitar confirmación antes de realizar la cancelación.

CA-03. Al cancelar una orden, el estado debe cambiar a "Cancelada".

CA-04. El sistema no debe permitir cancelar órdenes que se encuentren en estado "Entregada".

CA-05. La cancelación debe quedar registrada en el historial de actividades.

**HU-09 Reabrir Orden de Trabajo: **Como modista/dueña,

Quiero reabrir una orden de trabajo previamente entregada,

Para corregir errores de registro o realizar ajustes excepcionales posteriores a la entrega.

**Criterios de Aceptación**

CA-01. El sistema debe permitir reabrir únicamente órdenes que se encuentren en estado "Entregada".

CA-02. Al reabrir una orden, el sistema debe cambiar automáticamente su estado a "En Proceso".

CA-03. La reapertura debe registrarse en el historial de actividades.

CA-04. El sistema debe conservar toda la información histórica de la orden.

**HU-10 Buscar Órdenes por Cliente: **Como modista/dueña,

Quiero buscar órdenes de trabajo utilizando el nombre de un cliente,

Para localizar rápidamente los trabajos asociados a dicho cliente.

**Criterios de Aceptación**

CA-01. El sistema debe permitir ingresar el nombre del cliente como criterio de búsqueda.

CA-02. El sistema debe mostrar todas las órdenes asociadas al cliente consultado.

CA-03. El sistema debe permitir acceder al detalle de cada orden encontrada.

CA-04. Si no existen órdenes asociadas, el sistema debe informar dicha situación.

**HU-11 Consultar Prendas Entregadas y Pendientes:** Como modista/dueña,

Quiero consultar las prendas entregadas y pendientes dentro de una orden de trabajo,

Para conocer el estado actual de cada prenda y facilitar el control de entregas parciales.

Criterios de Aceptación

CA-01. El sistema debe mostrar todas las prendas asociadas a una orden de trabajo.

CA-02. El sistema debe indicar el estado actual de cada prenda.

CA-03. El sistema debe permitir identificar claramente cuáles prendas han sido entregadas.

CA-04. El sistema debe permitir identificar claramente cuáles prendas permanecen pendientes de entrega.

CA-05. La información visualizada debe actualizarse automáticamente después de registrar una entrega.

CA-06. El sistema debe permitir acceder al detalle de cada prenda listada.

**HU-12 Consultar Información de una Orden de Trabajo: **Como modista/dueña,

Quiero consultar la información general de una orden de trabajo,

Para conocer los detalles del servicio solicitado por el cliente.

**Criterios de Aceptación**

CA-01. El sistema debe permitir consultar una orden de trabajo registrada.

CA-02. El sistema debe mostrar la información del cliente asociado.

CA-03. El sistema debe mostrar la fecha de creación de la orden.

CA-04. El sistema debe mostrar la fecha estimada de entrega.

CA-05. El sistema debe mostrar el estado actual de la orden.

**HU-13 Consultar Órdenes Pendientes: **Como modista/dueña,

Quiero visualizar las órdenes de trabajo pendientes,

Para identificar los trabajos que aún requieren atención.

**Criterios de Aceptación**

CA-01. El sistema debe mostrar únicamente las órdenes pendientes.

CA-02. El sistema debe mostrar el cliente asociado a cada orden.

CA-03. El sistema debe mostrar la fecha estimada de entrega.

CA-04. El sistema debe permitir acceder al detalle de cada orden.

**HU-14 Visualizar Órdenes por Fecha de Entrega: **Como modista/dueña,

Quiero visualizar las órdenes organizadas por fecha de entrega,

Para priorizar los trabajos que deben completarse primero.

**Criterios de Aceptación**

CA-01. El sistema debe ordenar las órdenes según su fecha de entrega.

CA-02. El sistema debe mostrar primero las órdenes con fecha más próxima.

CA-03. El sistema debe actualizar automáticamente el orden cuando existan nuevas órdenes.

CA-04. El sistema debe permitir consultar el detalle de cualquier orden mostrada.

**HU-15 Consultar Órdenes Vencidas:** Como modista/dueña,

Quiero identificar las órdenes cuya fecha de entrega ya fue superada,

Para dar prioridad a los trabajos atrasados.

**Criterios de Aceptación**

CA-01. El sistema debe identificar las órdenes cuya fecha de entrega sea anterior a la fecha actual.

CA-02. El sistema debe mostrar las órdenes vencidas en un listado independiente.

CA-03. El sistema debe mostrar el número de días de retraso de cada orden.

CA-04. El sistema debe permitir acceder al detalle de las órdenes vencidas.

**Épica 3: Gestión de Prendas**

**Gestión Operativa**

**HU-16 Registrar Prenda:** Como modista/dueña,

Quiero registrar una prenda dentro de una orden de trabajo,

Para llevar un control de los arreglos solicitados por cada cliente.

**Criterios de Aceptación**

CA-01. El sistema debe permitir asociar la prenda a una orden de trabajo existente.

CA-02. El sistema debe permitir registrar el tipo de prenda.

CA-03. El sistema debe guardar la información registrada.

CA-04. El sistema debe mostrar un mensaje de confirmación cuando la prenda sea registrada correctamente.

**HU-17 Registrar Descripción del Arreglo:** Como modista/dueña,

Quiero registrar la descripción del arreglo solicitado de una prenda,

Para conocer el trabajo que debe realizarse.

**Criterios de Aceptación**

CA-01. El sistema debe permitir ingresar una descripción del arreglo solicitado.

CA-02. El sistema debe asociar la descripción a la prenda correspondiente.

CA-03. El sistema debe guardar la información registrada.

CA-04. El sistema debe permitir consultar posteriormente la descripción registrada.

**HU-18 Asignar Valor Económico:** Como modista/dueña,

Quiero asignar un valor económico a una prenda,

Para calcular el costo total de una orden de trabajo.

**Criterios de Aceptación**

CA-01. El sistema debe permitir registrar un valor económico para la prenda.

CA-02. El sistema debe validar que el valor ingresado sea mayor a cero.

CA-03. El sistema debe guardar el valor registrado.

CA-04. El sistema debe utilizar el valor para calcular el total de la orden de trabajo.

**HU-19 Consultar Estado de una Prenda:** Como modista/dueña,

Quiero consultar el estado actual de una prenda,

Para conocer el avance del trabajo realizado.

**Criterios de Aceptación**

CA-01. El sistema debe mostrar el estado actual de la prenda.

CA-02. El sistema debe mostrar la fecha de la última actualización del estado.

CA-03. El sistema debe permitir consultar esta información desde la orden de trabajo.

**HU-20 Actualizar Estado de una Prenda:** Como modista/dueña,

Quiero actualizar el estado de una prenda,

Para reflejar el avance real del trabajo realizado.

**Criterios de Aceptación**

CA-01. El sistema debe permitir seleccionar un nuevo estado para la prenda.

CA-02. El sistema debe permitir utilizar únicamente los estados definidos por el negocio.

CA-03. El sistema debe guardar el nuevo estado seleccionado.

CA-04. El sistema debe actualizar la fecha de modificación de la prenda.

**HU-21 Visualizar Prendas Asociadas a una Orden:** Como modista/dueña,

Quiero visualizar todas las prendas asociadas a una orden de trabajo,

Para conocer los elementos incluidos en el servicio solicitado.

**Criterios de Aceptación**

CA-01. El sistema debe mostrar todas las prendas asociadas a una orden seleccionada.

CA-02. El sistema debe mostrar el estado de cada prenda.

CA-03. El sistema debe mostrar el valor registrado para cada prenda.

CA-04. El sistema debe permitir acceder al detalle de cada prenda.

**HU-22 Calcular Valor Total de una Orden:** Como modista/dueña,

Quiero que el sistema calcule automáticamente el valor total de una orden de trabajo,

Para conocer el costo total del servicio prestado.

**Criterios de Aceptación**

CA-01. El sistema debe sumar automáticamente los valores de las prendas asociadas a la orden.

CA-02. El sistema debe actualizar el total cuando se agregue una nueva prenda.

CA-03. El sistema debe actualizar el total cuando se modifique el valor de una prenda.

CA-04. El sistema debe mostrar el valor total de la orden.

**HU-23 Actualizar Estado de Orden Automáticamente:** Como modista/dueña,

Quiero que el sistema marque automáticamente una orden como "Lista para entregar" cuando todas sus prendas estén terminadas,

Para identificar fácilmente los trabajos listos para ser entregados al cliente.

**Criterios de Aceptación**

CA-01. El sistema debe verificar el estado de todas las prendas asociadas a una orden de trabajo.

CA-02. Cuando todas las prendas se encuentren en estado “Terminada”, el sistema debe actualizar automáticamente el estado de la orden a “Lista para entregar”.

CA-03. Si existe al menos una prenda en estado diferente de “Terminada”, la orden no debe cambiar de estado.

CA-04. La actualización debe realizarse automáticamente al modificar el estado de una prenda.

CA-05. El sistema debe registrar el cambio de estado en el historial de actividades de la orden.

**Observaciones y Evidencia Fotográfica**

**HU-24 Registrar Observaciones: **Como modista/dueña, 

Quiero registrar observaciones adicionales sobre una prenda,

Para conservar información importante relacionada con el trabajo solicitado por el cliente.

**Criterios de Aceptación **

CA-01. El sistema debe permitir ingresar observaciones para una prenda registrada.

CA-02. El sistema debe asociar las observaciones a la prenda correspondiente.

CA-03. El sistema debe guardar las observaciones registradas.

CA-04. El sistema debe permitir modificar las observaciones antes de finalizar el registro.

**HU-25 Consultar Observaciones: **Como modista/dueña,

Quiero consultar las observaciones registradas para una prenda,

Para recordar detalles importantes del trabajo solicitado.

**Criterios de Aceptación**

CA-01. El sistema debe mostrar las observaciones asociadas a la prenda.

CA-02. El sistema debe permitir consultar las observaciones desde el detalle de la prenda.

CA-03. El sistema debe informar cuando la prenda no tenga observaciones registradas.

**HU-26 Capturar Fotografía de una Prenda:** Como modista/dueña, 

Quiero capturar una fotografía de una prenda durante el registro,

Para conservar evidencia de su estado al momento de ser recibida.

**Criterios de Aceptación**

CA-01. El sistema debe permitir tomar una fotografía utilizando la cámara del dispositivo.

CA-02. El sistema debe asociar la fotografía a la prenda correspondiente.

CA-03. El sistema debe mostrar una vista previa de la fotografía capturada.

CA-04. El sistema debe permitir confirmar o repetir la captura antes de guardarla.

**HU-27 Almacenar Fotografías de una Prenda:** Como modista/dueña,

Quiero almacenar una o varias fotografías asociadas a una prenda,

Para conservar evidencia visual del trabajo recibido.

**Criterios de Aceptación**

CA-01. El sistema debe guardar las fotografías asociadas a la prenda.

CA-02. El sistema debe permitir registrar más de una fotografía por prenda.

CA-03. El sistema debe conservar las fotografías mientras la prenda permanezca registrada.

CA-04. El sistema debe confirmar el almacenamiento exitoso de las fotografías.

**HU-28 Consultar Fotografías de una Prenda:** Como modista/dueña,

Quiero consultar las fotografías registradas de una prenda, 

Para verificar su estado y características cuando sea necesario.

**Criterios de Aceptación**

CA-01. El sistema debe mostrar las fotografías asociadas a la prenda seleccionada.

CA-02. El sistema debe permitir consultar las fotografías desde el detalle de la prenda.

CA-03. El sistema debe informar cuando la prenda no tenga fotografías registradas.

**HU-29 Visualizar Fotografías de una Prenda:** Como modista/dueña,

Quiero visualizar las fotografías de una prenda en tamaño ampliado,

Para observar con mayor detalle el estado de la prenda registrada.

**Criterios de Aceptación**

CA-01. El sistema debe permitir ampliar una fotografía seleccionada.

CA-02. El sistema debe mantener una calidad adecuada durante la visualización.

CA-03. El sistema debe permitir navegar entre las fotografías asociadas a una misma prenda.

CA-04. El sistema debe permitir cerrar la visualización ampliada y regresar al detalle de la prenda.

**HU-30 Modificar Información de una Prenda:** Como modista/dueña,

Quiero modificar la información registrada de una prenda,

Para corregir errores o actualizar los datos del servicio solicitado.

**Criterios de Aceptación**

CA-01. El sistema debe permitir editar la información de una prenda registrada.

CA-02. El sistema debe permitir modificar la descripción del arreglo solicitado.

CA-03. El sistema debe permitir modificar el valor económico registrado.

CA-04. El sistema debe guardar correctamente los cambios realizados.

CA-05. El sistema debe mostrar un mensaje de confirmación cuando la actualización se realice exitosamente.

**HU-31 Eliminar Fotografía de una Prenda:** Como modista/dueña,

Quiero eliminar fotografías registradas por error,

Para mantener actualizada la evidencia fotográfica asociada a la prenda.

**Criterios de Aceptación**

CA-01. El sistema debe permitir seleccionar una fotografía asociada a una prenda.

CA-02. El sistema debe solicitar confirmación antes de eliminar la fotografía.

CA-03. El sistema debe eliminar únicamente la fotografía seleccionada.

CA-04. El sistema debe mantener las demás fotografías asociadas a la prenda.

CA-05. El sistema debe mostrar un mensaje de confirmación cuando la eliminación se realice correctamente.

**Épica 4: Gestión de Pagos**

**HU-32 Registrar Abono: **Como modista/dueña,

Quiero registrar los abonos realizados por un cliente,

Para llevar un control de los pagos efectuados sobre una orden de trabajo.

**Criterios de Aceptación**

CA-01. El sistema debe permitir registrar el valor del abono realizado.

CA-02. El sistema debe asociar el abono a una orden de trabajo existente.

CA-03. El sistema debe registrar la fecha del abono.

CA-04. El sistema debe guardar correctamente la información registrada.

CA-05. El sistema debe mostrar un mensaje de confirmación cuando el abono sea registrado exitosamente.

**HU-33 Registrar Método de Pago:** Como modista/dueña,

Quiero registrar el método de pago utilizado por el cliente,

Para conservar un historial de cómo fueron realizados los pagos.

**Criterios de Aceptación**

CA-01. El sistema debe permitir seleccionar un método de pago al registrar un abono.

CA-02. El sistema debe asociar el método de pago al abono registrado.

CA-03. El sistema debe guardar la información seleccionada.

CA-04. El sistema debe mostrar el método de pago dentro del historial de pagos.

**HU-34 Consultar Historial de Pagos:** Como modista/dueña,

Quiero consultar historial de pagos de una orden de trabajo, 

Para conocer los abonos realizados por el cliente.

**Criterios de Aceptación**

CA-01. El sistema debe mostrar todos los pagos asociados a la orden de trabajo seleccionada.

CA-02. El sistema debe mostrar la fecha de cada pago registrado.

CA-03. El sistema debe mostrar el valor de cada pago.

CA-04. El sistema debe mostrar el método de pago utilizado.

CA-05. El sistema debe informar cuando no existan pagos realizados.

**HU-35 Calcular Saldo Pendiente:** Como modista/dueña,

Quiero que el sistema calcule automáticamente el saldo pendiente de una orden de trabajo,

Para conocer cuánto dinero falta por cobrar.

**Criterios de Aceptación**

CA-01. El sistema debe calcular el saldo pendiente restando los abonos realizados al valor total de la orden.

CA-02. El sistema debe actualizar automáticamente el saldo después de registrar un nuevo pago.

CA-03. El sistema debe mostrar el saldo pendiente dentro de la información de la orden.

CA-04. El sistema debe mostrar saldo cero cuando la orden haya sido pagada completamente.

**HU-36 Consultar Órdenes con Saldo Pendiente:** Como modista/dueña,

Quiero consultar las órdenes de trabajo que tengan pagos pendientes, 

Para identificar los clientes que aún tienen saldos por cancelar.

**Criterios de Aceptación**

CA-01. El sistema debe mostrar únicamente las órdenes con saldo pendiente.

CA-02. El sistema debe mostrar el cliente asociado a cada orden.

CA-03. El sistema debe mostrar el valor pendiente de pago.

CA-04. El sistema debe permitir acceder al detalle de la orden seleccionada.

**HU-37 Actualizar Estado de Pago Automáticamente:** Como modista/dueña.

Quiero que el sistema actualice automáticamente el estado de pago de una orden de trabajo,

Para identificar fácilmente cuándo una orden ha sido cancelada en su totalidad.

**Criterios de Aceptación**

CA-01. El sistema debe cambiar el estado de pago a “Pagada” cuando el saldo pendiente sea igual a cero.

CA-02. El sistema debe mantener el estado de pago como “Pendiente” cuando exista algún saldo por cobrar.

CA-03. El sistema debe realizar la actualización automáticamente después de registrar un pago.

CA-04. El sistema debe mostrar el estado actualizado dentro de la información de la orden.

**Épica 5: Notificaciones y Comunicación con Clientes**

**HU-38 Notificar Orden Lista para Entrega:** Como modista/dueña,

Quiero que el sistema envíe una notificación automática al cliente cuando su orden de trabajo esté lista para ser entregada,

Para informarle oportunamente que puede reclamar sus prendas.

**Criterios de Aceptación**

CA-01. El sistema debe generar una notificación cuando una orden de trabajo cambie al estado “Lista para entregar”.

CA-02. El sistema debe enviar la notificación al medio de comunicación configurado por el cliente.

CA-03. El sistema debe incluir información que permita identificar la orden de trabajo.

CA-04. El sistema debe registrar el envío de la notificación.

**HU-39 Compartir Resumen de Orden de Trabajo:** Como modista/dueña,

Quiero enviar al cliente un resumen de la orden de trabajo mediante Telegram,

Para facilitar la consulta de las prendas registradas, los pagos realizados y el saldo pendiente.

**Criterios de Aceptación**

CA-01. El sistema debe permitir seleccionar una orden de trabajo registrada.

CA-02. El sistema debe generar un resumen con la información de la orden.

CA-03. El resumen debe incluir las prendas registradas y sus valores.

CA-04. El resumen debe incluir los pagos realizados y el saldo pendiente.

CA-05. El sistema debe permitir compartir el resumen mediante Telegram.

CA-06. El sistema debe registrar la fecha y hora en que se realizó el envío.

**HU-40 Enviar Recordatorios de Órdenes Pendientes: **Como modista/dueña,

Quiero que el sistema envíe recordatorios automáticos a los clientes que tengan órdenes pendientes por reclamar,

Para reducir la acumulación de prendas entregadas y no retiradas.

**Criterios de Aceptación**

CA-01. El sistema debe identificar las órdenes que permanezcan en estado “Lista para entregar”.

CA-02. El sistema debe generar recordatorios para los clientes asociados a dichas órdenes.

CA-03. El sistema debe registrar cada recordatorio enviado.

CA-04. El sistema debe evitar enviar múltiples recordatorios en un mismo día para una misma orden.

**HU-41 Consultar Historial de Notificaciones:** Como modista/dueña,

Quiero consultar el historial de notificaciones enviadas a un cliente,

Para verificar las comunicaciones realizadas por el sistema.

**Criterios de Aceptación**

CA-01. El sistema debe mostrar las notificaciones enviadas al cliente seleccionado.

CA-02. El sistema debe mostrar la fecha y hora de cada notificación.

CA-03. El sistema debe indicar el tipo de notificación enviada.

CA-04. El sistema debe informar cuando no existan notificaciones registradas.

Épica 6: Control y Seguimiento del Negocio

**HU-42 Consultar Órdenes Próximas a Vencer:** Como modista/dueña,

Quiero consultar las órdenes de trabajo próximas a vencer,

Para priorizar los trabajos que deben ser terminados en los próximos días.

**Criterios de Aceptación**

CA-01. El sistema debe identificar las órdenes con fechas de entrega cercanas.

CA-02. El sistema debe mostrar las órdenes ordenadas por fecha de entrega.

CA-03. El sistema debe mostrar el cliente asociado a cada orden.

CA-04. El sistema debe permitir acceder al detalle de la orden seleccionada.

**HU-43 Consultar Ingresos Registrados: **Como modista/dueña,

Quiero consultar los ingresos registrados durante un periodo determinado,

Para conocer el dinero recibido por los trabajos realizados.

**Criterios de Aceptación**

CA-01. El sistema debe permitir seleccionar un periodo de consulta.

CA-02. El sistema debe calcular el total de pagos registrados durante el periodo seleccionado.

CA-03. El sistema debe mostrar el resultado de la consulta.

CA-04. El sistema debe permitir realizar nuevas consultas utilizando diferentes periodos.

**HU-44 Consultar Dinero Pendiente por Cobrar:** Como modista/dueña,

Quiero consultar el dinero pendiente por cobrar,

Para identificar los valores que aún no han sido cancelados por los clientes.

**Criterios de Aceptación**

CA-01. El sistema debe calcular el total de los saldos pendientes de todas las órdenes activas.

CA-02. El sistema debe mostrar el valor total pendiente por cobrar.

CA-03. El sistema debe actualizar automáticamente el resultado cuando se registren nuevos pagos.

CA-04. El sistema debe permitir consultar el detalle de las órdenes asociadas.

**HU-45 Consultar Historial de Actividades:** Como modista/dueña,

Quiero consultar el historial de actividades realizadas sobre una orden de trabajo,

Para conocer los cambios y acciones registradas durante su gestión.

**Criterios de Aceptación**

CA-01. El sistema debe registrar las actividades realizadas sobre una orden de trabajo.

CA-02. El sistema debe mostrar las actividades registradas en orden cronológico.

CA-03. El sistema debe mostrar la fecha y hora de cada actividad.

CA-04. El sistema debe permitir consultar el historial desde el detalle de la orden.

**HU-46 Identificar Órdenes sin Reclamar:** Como modista/dueña,

Quiero identificar las órdenes que permanezcan sin reclamar durante más de 30 días,

Para realizar seguimiento a los clientes y evitar acumulación de prendas.

**Criterios de Aceptación**

CA-01. El sistema debe identificar las órdenes que superen 30 días en estado “Lista para entregar”.

CA-02. El sistema debe mostrar las órdenes en un listado específico.

CA-03. El sistema debe mostrar el cliente asociado a cada orden.

CA-04. El sistema debe mostrar la cantidad de días transcurridos sin ser reclamadas.

**HU-47 Registrar Fecha y Hora de Entrega:** Como modista/dueña,

Quiero que el sistema registre automáticamente la fecha y hora de entrega de una orden de trabajo,

Para mantener historial preciso de las entregas realizadas.

**Criterios de Aceptación**

CA-01. El sistema debe registrar automáticamente la fecha y hora cuando una orden cambie al estado “Entregada”.

CA-02. El sistema no debe requerir ingreso manual de la fecha de entrega.

CA-03. El sistema debe almacenar la información registrada en el historial de la orden.

CA-04. El sistema debe permitir consultar posteriormente la fecha y hora de entrega.

**Reglas de Negocio**

**Gestión de Clientes**

RN-01. Un cliente debe tener mínimo un nombre y un número de teléfono para poder ser registrado.

RN-02. El número de teléfono no será un dato único dentro del sistema y podrá estar asociado a más de un cliente.

**Gestión de órdenes de Trabajo**

RN-03. Una orden de trabajo debe estar asociada a un único cliente.

RN-04. Una orden de trabajo podrá ser creada sin prendas registradas; sin embargo, deberá contener al menos una prenda antes de ser considerada activa para su gestión.

RN-05. La fecha estimada de entrega no puede ser anterior a la fecha de creación de la orden.

RN-06. Una orden de trabajo solo podrá cambiar al estado "Lista para entregar" cuando todas las prendas asociadas se encuentren en estado "Terminada"; dicho cambio deberá realizarse automáticamente por el sistema.

RN-07. Las prendas de una misma orden de trabajo podrán ser entregadas de manera parcial cuando el cliente decida reclamar únicamente las prendas que se encuentren terminadas.

RN-08. La entrega de una prenda debe registrarse de manera individual cambiando su estado a "Entregada".

RN-09. Una orden de trabajo solo podrá cambiar al estado "Entregada" cuando todas las prendas asociadas a la orden hayan sido entregadas al cliente.

RN-10. Una orden de trabajo que tenga prendas entregadas y prendas pendientes deberá conservar su estado actual hasta que todas las prendas sean entregadas.

RN-11. Una orden de trabajo entregada no puede ser cancelada.

RN-12. Una orden de trabajo cancelado no puede recibir nuevas prendas.

RN-13. Una orden de trabajo cancelado no puede recibir nuevos pagos.

RN-14. La cancelación de una orden no debe eliminar los pagos previamente registrados.

RN-15. Una orden de trabajo entregada puede ser reabierta únicamente por la modista/dueña.

RN-16. Al reabrir una orden entregada, el sistema debe cambiar su estado a "En Proceso".

RN-17. Mientras exista al menos una prenda en estado "Pendiente" o "En proceso", la orden deberá permanecer en estado "En proceso".

**Gestión de Prendas**

RN-18. Toda prenda debe estar asociada a una orden de trabajo.

RN-19. Una prenda debe tener una descripción del arreglo solicitado.

RN-20. El valor económico de una prenda debe ser mayor a cero.

RN-21. Una prenda solo puede tener un estado activo a la vez.

RN-22. Una fotografía registrada debe quedar asociada a una única prenda.

RN-23. Una prenda puede tener una o varias fotografías registradas.

RN-24. Toda prenda registrada en una orden de trabajo debe tener un tipo de prenda definido.

**Gestión de Pagos**

RN-25. Todo pago debe estar asociado a una orden de trabajo.

RN-26. El valor de un abono debe ser mayor que cero.

RN-27. El valor acumulado de los abonos no puede superar el valor total de la orden.

RN-28. Una orden se considera pagada cuando su saldo pendiente es igual a cero.

RN-29. El saldo pendiente de una orden no puede ser negativo.

RN-30. Una orden entregada podrá seguir recibiendo pagos mientras tenga saldo pendiente.

**Notificaciones**

RN-31. El sistema debe enviar la notificación de entrega únicamente cuando la orden cambie al estado “Lista para entregar”.

RN-32. El historial de notificaciones debe conservar la fecha y hora de cada envío.

RN-33. No se debe enviar más de un recordatorio automático para la misma orden durante un mismo día.

RN-34. El resumen enviado por Telegram debe generarse utilizando la información actual de la orden de trabajo al momento del envío.

**Control y Seguimiento**

RN-35. Toda modificación realizada sobre una orden debe registrarse en el historial de actividades.

RN-36. La fecha y hora de entrega debe registrarse automáticamente cuando una orden cambie al estado “Entregada”.

RN-37. Una orden será considerada “Sin reclamar” cuando permanezca más de 30 días en estado “Lista para entregar”.

RN-38. Una orden se considerará próxima a vencer cuando su fecha estimada de entrega se encuentre dentro del período de anticipación configurado por el negocio.

**Gestión de Observaciones**

RN-39. Las observaciones registradas para una prenda deben permanecer disponibles mientras la prenda exista en el sistema.

**Gestión de Fotografías**

RN-40. La eliminación de una fotografía no debe eliminar la información de la prenda asociada.

**Modelo de datos**

**Entidades del Sistema**

**Cliente**

Representa la persona Que solicita servicios de confección o arreglo de prendas.

Información principal:
- Identificador del cliente.
- Nombre.
- Número de teléfono.
- Fecha de registro.

**Orden de Trabajo**

Representa el servicio solicitado por un cliente y agrupa una o varias prendas para su gestión y seguimiento.

Información principal:
- Identificador de la orden.
- Cliente asociado.
- Fecha de registro.
- Fecha estimada de entrega.
- Estado de la orden.
- Valor total.
- Saldo pendiente.
- Fecha real de entrega.

**Prenda**

Representa cada artículo recibido para realizar un arreglo o modificación.

Información principal:
- Identificador de la prenda.
- Orden de trabajo asociada.
- Tipo de prenda.
- Descripción del arreglo solicitado.
- Valor del servicio.
- Estado de la prenda.
- Observaciones.

**Fotografía**

Representa la evidencia visual registrada al momento de recibir una prenda.

Información principal:
- Identificador de la fotografía.
- Prenda asociada.
- Ruta o ubicación de la imagen.
- Fecha de registro.

**Pago**

Representa los abonos o pagos realizados por un cliente sobre una orden de trabajo.

Información principal:
- Identificador del pago.
- Orden de trabajo asociada.
- Fecha del pago.
- Valor pagado.
- Método de pago.

**Notificación**

Representa los mensajes enviados automáticamente a los clientes.

Información principal:
- Identificador de la notificación.
- Orden de trabajo asociada.
- Fecha de envío.
- Tipo de notificación.
- Estado del envío.

**Historial de Actividades**

Representa los eventos y acciones realizadas sobre una orden de trabajo para mantener trazabilidad.

Información principal:
- Identificador de la actividad.
- Orden de trabajo asociada.
- Fecha y hora.
- Descripción de la actividad.

**Relaciones entre Entidades**
- cliente 1:N orden_trabajo.
- Orden_trabajo 1:N prenda.
- Orden_trabajo 1:N pago.
- Orden_trabajo 1:N notificación.
- Orden_trabajo 1:N historial_actividades.
- Prenda 1:N fotografía.

Diagrama Conceptual de Datos

<img src="data:image/png;base64,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IiIS4mEaERERERERERGRkFratKz880UB3N5Qj4sXL5qXyyiloJRCsVg0uyrYto3bb78dXV1dZlcZ6ZjSOgCwLEtUBwBLly7Fe++9F1ofd27/R6hW47oubNuOrNPS6TRGRkYwNDRkdpWxbdv7uPkweu6o/cTZd01NDebMmYO+vj6zq4zk/qBUh9JH74aJs0ZmMvieM5PR+2Ymmclq4uybmQzHTIabLZlMJBKYN28eBgcHQ+s0ZjL4njOT0fuWZBIx18hMBt9zZjJ638wkM1lNnH0zk+GmOpOBh2mXei6bl4mIiIiIiIiIiG5p/DFPIiIiIiIiIiIiIR6mERERERERERERCfEwjYiIiIiIiIiISIi/M42IiGaFeXPnIJVMmpeJiOgmMzo2hmvDI+ZlIiKiGYPvTCMiolmBB2lERLMDX8+JiGim42EaERERERERERGREA/TiIiIiIiIiIiIhHiYRkREs8Lo2Jh5iYiIbkJ8PSciopmOH0BAREREREREREQkxHemERERERERERERCfEwjYiIiIiIiIiISIiHaURERERERERERELq137t1yp+ZxoRERERERERERFVqvoBBERERERERERERFSJP+ZJREREREREREQkxMM0IiIiIiIiIiIiIR6mERERERERERERCfEwjYiIiIiIiIiISIiHaUREREREREREREI8TCMiIiIiIiIiIhL6/wGny+TnWf3KXQAAAABJRU5ErkJggg==" />

CASOS DE PRUEBA

ÉPICA 1: GESTIÓN DE CLIENTES

HU-01 Registrar Cliente

Caso de Prueba CP-01

Nombre: Registrar cliente con datos válidos.

Precondición:

La modista se encuentra en la pantalla de registro de clientes.

Pasos:

1. Ingresar el nombre "María Gómez".

2. Ingresar el número de teléfono "3101234567".

3. Presionar el botón Guardar.

Resultado Esperado:

• El sistema registra el cliente correctamente.

• El sistema muestra un mensaje de confirmación.

• La información queda almacenada para futuras consultas.

Caso de Prueba CP-02

Nombre: Intentar registrar un cliente sin nombre.

Precondición:

La modista se encuentra en la pantalla de registro de clientes.

Pasos:

1. Dejar vacío el campo nombre.

2. Ingresar el número de teléfono "3101234567".

3. Presionar el botón Guardar.

Resultado Esperado:

• El sistema no registra el cliente.

• El sistema informa que el nombre es obligatorio.

Caso de Prueba CP-03

Nombre: Intentar registrar un cliente sin número de teléfono.

Precondición:

La modista se encuentra en la pantalla de registro de clientes.

Pasos:

1. Ingresar el nombre "María Gómez".

2. Dejar vacío el campo teléfono.

3. Presionar el botón Guardar.

Resultado Esperado:

• El sistema no registra el cliente.

• El sistema informa que el número de teléfono es obligatorio.

Caso de Prueba CP-04

Nombre: Registrar dos clientes con el mismo número de teléfono.

Precondición:

Existe un cliente registrado con el número "3101234567".

Pasos:

1. Registrar un nuevo cliente con nombre diferente.

2. Ingresar el número de teléfono "3101234567".

3. Presionar Guardar.

Resultado Esperado:

• El sistema permite registrar el cliente.

• Ambos clientes quedan almacenados correctamente.

• No se genera error por número duplicado.

HU-02 Consultar Cliente

Caso de Prueba CP-05

Nombre: Consultar cliente existente por nombre.

Precondición:

Existe un cliente registrado.

Pasos:

1. Ingresar el nombre del cliente en la búsqueda.

2. Ejecutar la consulta.

Resultado Esperado:

• El sistema muestra la información del cliente encontrado.

Caso de Prueba CP-06

Nombre: Consultar cliente existente por número de teléfono.

Precondición:

Existe un cliente registrado.

Pasos:

1. Ingresar el número de teléfono del cliente.

2. Ejecutar la consulta.

Resultado Esperado:

• El sistema muestra la información asociada al cliente.

Caso de Prueba CP-07

Nombre: Consultar cliente inexistente.

Precondición:

No existe un cliente asociado al criterio de búsqueda.

Pasos:

1. Ingresar un nombre o teléfono no registrado.

2. Ejecutar la consulta.

Resultado Esperado:

• El sistema informa que no existen resultados.

HU-03 Actualizar Cliente

Caso de Prueba CP-08

Nombre: Actualizar información de un cliente.

Precondición:

Existe un cliente registrado.

Pasos:

1. Consultar el cliente.

2. Seleccionar la opción Editar.

3. Modificar el número de teléfono.

4. Guardar los cambios.

Resultado Esperado:

• El sistema actualiza la información correctamente.

• El sistema muestra un mensaje de confirmación.

Caso de Prueba CP-09

Nombre: Intentar actualizar un cliente eliminando un dato obligatorio.

Precondición:

Existe un cliente registrado.

Pasos:

1. Consultar el cliente.

2. Seleccionar Editar.

3. Eliminar el nombre del cliente.

4. Guardar los cambios.

Resultado Esperado:

• El sistema no permite guardar los cambios.

• El sistema informa que el nombre es obligatorio.

HU-04 Consultar Historial de Órdenes de Trabajo

Caso de Prueba CP-10

Nombre: Consultar historial de órdenes de un cliente con registros.

Precondición:

El cliente posee una o más órdenes de trabajo registradas.

Pasos:

1. Consultar un cliente.

2. Seleccionar la opción Historial de Órdenes.

Resultado Esperado:

• El sistema muestra las órdenes asociadas al cliente.

• El sistema muestra la fecha de registro.

• El sistema muestra el estado de cada orden.

Caso de Prueba CP-11

Nombre: Consultar historial de órdenes de un cliente sin registros.

Precondición:

El cliente no posee órdenes registradas.

Pasos:

1. Consultar un cliente.

2. Seleccionar Historial de Órdenes.

Resultado Esperado:

• El sistema informa que el cliente no posee órdenes registradas.

Caso de Prueba CP-12

Nombre: Consultar detalle de una orden desde el historial.

Precondición:

El cliente posee órdenes registradas.

Pasos:

1. Consultar historial de órdenes.

2. Seleccionar una orden específica.

Resultado Esperado:

• El sistema muestra el detalle completo de la orden seleccionada.

**ÉPICA 2: GESTIÓN DE ÓRDENES DE TRABAJO**

HU-05 Crear Orden de Trabajo

Caso de Prueba CP-13

Nombre: Crear orden de trabajo para un cliente registrado.

Precondición:

Existe un cliente registrado en el sistema.

Pasos:

1. Seleccionar un cliente.

2. Crear una nueva orden de trabajo.

3. Guardar la orden.

Resultado Esperado:

• El sistema crea la orden correctamente.

• La orden queda asociada al cliente seleccionado.

• El sistema genera un identificador único.

• Se registra la fecha de creación.

Caso de Prueba CP-14

Nombre: Intentar crear una orden sin seleccionar un cliente.

Precondición:

La modista se encuentra en la pantalla de creación de órdenes.

Pasos:

1. Crear una nueva orden.

2. No seleccionar cliente.

3. Guardar.

Resultado Esperado:

• El sistema no permite crear la orden.

• El sistema informa que debe seleccionarse un cliente.

HU-06 Asignar Fecha de Entrega

Caso de Prueba CP-15

Nombre: Asignar fecha de entrega válida.

Precondición:

Existe una orden de trabajo.

Pasos:

1. Seleccionar una fecha igual o posterior a la fecha de creación.

2. Guardar cambios.

Resultado Esperado:

• El sistema registra correctamente la fecha de entrega.

Caso de Prueba CP-16

Nombre: Asignar fecha de entrega inválida.

Precondición:

Existe una orden de trabajo.

Pasos:

1. Seleccionar una fecha anterior a la fecha de creación.

2. Guardar cambios.

Resultado Esperado:

• El sistema no permite guardar.

• El sistema informa que la fecha es inválida.

HU-07 Registrar Entrega de Prendas

Caso de Prueba CP-17

Nombre: Registrar entrega parcial de prendas.

Precondición:

Existe una orden con varias prendas.

Al menos una prenda se encuentra en estado "Terminada".

Pasos:

1. Consultar la orden.

2. Seleccionar una prenda terminada.

3. Registrar la entrega.

Resultado Esperado:

• La prenda cambia a estado "Entregada".

• La actividad queda registrada en el historial.

• La orden conserva su estado actual si existen prendas pendientes.

Caso de Prueba CP-18

Nombre: Intentar entregar una prenda no terminada.

Precondición:

Existe una orden con una prenda en estado "En Proceso".

Pasos:

1. Seleccionar la prenda.

2. Intentar registrarla como entregada.

Resultado Esperado:

• El sistema rechaza la operación.

• Se muestra un mensaje informativo.

• El estado de la prenda permanece sin cambios.

Caso de Prueba CP-19

Nombre: Entregar todas las prendas de una orden.

Precondición:

Todas las prendas de la orden se encuentran terminadas.

Pasos:

1. Registrar la entrega de todas las prendas.

2. Guardar cambios.

Resultado Esperado:

• Todas las prendas quedan en estado "Entregada".

• La orden cambia automáticamente a estado "Entregada".

• El sistema registra fecha y hora de entrega.

HU-08 Cancelar Orden de Trabajo

Caso de Prueba CP-20

Nombre: Cancelar una orden activa.

Precondición:

Existe una orden activa.

Pasos:

1. Abrir la orden.

2. Seleccionar Cancelar Orden.

3. Confirmar la operación.

Resultado Esperado:

• La orden cambia a estado "Cancelada".

• La actividad queda registrada en el historial.

Caso de Prueba CP-21

Nombre: Intentar cancelar una orden entregada.

Precondición:

Existe una orden en estado "Entregada".

Pasos:

1. Abrir la orden.

2. Intentar cancelarla.

Resultado Esperado:

• El sistema no permite la cancelación.

• Se muestra un mensaje informativo.

HU-09 Reabrir Orden de Trabajo

Caso de Prueba CP-22

Nombre: Reabrir una orden entregada.

Precondición:

Existe una orden en estado "Entregada".

Pasos:

1. Abrir la orden.

2. Seleccionar Reabrir Orden.

3. Confirmar.

Resultado Esperado:

• La orden cambia a estado "En Proceso".

• La reapertura queda registrada en el historial.

Caso de Prueba CP-23

Nombre: Intentar reabrir una orden no entregada.

Precondición:

Existe una orden en estado "En Proceso".

Pasos:

1. Intentar ejecutar la opción Reabrir Orden.

Resultado Esperado:

• El sistema no permite la operación.

• Se muestra un mensaje informativo.

HU-10 Buscar Órdenes por Cliente

Caso de Prueba CP-24

Nombre: Buscar órdenes de un cliente existente.

Precondición:

El cliente posee órdenes registradas.

Pasos:

1. Ingresar el nombre del cliente.

2. Ejecutar la búsqueda.

Resultado Esperado:

• El sistema muestra todas las órdenes asociadas.

Caso de Prueba CP-25

Nombre: Buscar órdenes de un cliente sin registros.

Precondición:

El cliente no posee órdenes registradas.

Pasos:

1. Buscar el cliente.

Resultado Esperado:

• El sistema informa que no existen órdenes asociadas.

HU-11 Consultar Prendas Entregadas y Pendientes

Caso de Prueba CP-26

Nombre: Consultar estado de prendas de una orden.

Precondición:

Existe una orden con prendas registradas.

Pasos:

1. Consultar la orden.

2. Abrir listado de prendas.

Resultado Esperado:

• El sistema muestra todas las prendas.

• Se identifica claramente cuáles están entregadas y cuáles pendientes.

Caso de Prueba CP-27

Nombre: Verificar actualización después de una entrega.

Precondición:

Existe una orden con prendas pendientes.

Pasos:

1. Registrar entrega de una prenda.

2. Consultar nuevamente el listado.

Resultado Esperado:

• El sistema actualiza la información automáticamente.

HU-12 Consultar Información de una Orden de Trabajo

Caso de Prueba CP-28

Nombre: Consultar una orden existente.

Precondición:

Existe una orden registrada.

Pasos:

1. Buscar la orden.

2. Abrir su detalle.

Resultado Esperado:

• El sistema muestra el cliente asociado.

• El sistema muestra fecha de creación.

• El sistema muestra fecha estimada de entrega.

• El sistema muestra estado actual.

HU-13 Consultar Órdenes Pendientes

Caso de Prueba CP-29

Nombre: Consultar órdenes pendientes.

Precondición:

Existen órdenes pendientes.

Pasos:

1. Acceder al listado de órdenes pendientes.

Resultado Esperado:

• El sistema muestra únicamente órdenes pendientes.

• Se visualiza cliente y fecha estimada de entrega.

Caso de Prueba CP-30

Nombre: No mostrar órdenes canceladas o entregadas.

Precondición:

Existen órdenes en distintos estados.

Pasos:

1. Consultar órdenes pendientes.

Resultado Esperado:

• El sistema excluye órdenes entregadas.

• El sistema excluye órdenes canceladas.

HU-14 Visualizar Órdenes por Fecha de Entrega

Caso de Prueba CP-31

Nombre: Visualizar órdenes ordenadas por fecha de entrega.

Precondición:

Existen varias órdenes registradas.

Pasos:

1. Acceder al listado de órdenes.

Resultado Esperado:

• Las órdenes aparecen ordenadas por fecha de entrega.

• Las fechas más próximas aparecen primero.

HU-15 Consultar Órdenes Vencidas

Caso de Prueba CP-32

Nombre: Consultar órdenes vencidas.

Precondición:

Existen órdenes cuya fecha de entrega ya fue superada.

Pasos:

1. Acceder a la opción Órdenes Vencidas.

Resultado Esperado:

• El sistema muestra únicamente las órdenes vencidas.

• Se visualiza la cantidad de días de retraso.

Caso de Prueba CP-33

Nombre: Consultar órdenes cuando no existen vencidas.

Precondición:

No existen órdenes vencidas.

Pasos:

1. Acceder a la opción Órdenes Vencidas.

Resultado Esperado:

• El sistema informa que no existen órdenes vencidas.

**ÉPICA 3: GESTIÓN DE PRENDAS**

HU-16 Registrar Prenda

Caso de Prueba CP-34

Nombre: Registrar una prenda correctamente.

Precondición:

Existe una orden de trabajo activa.

Pasos:

1. Abrir una orden de trabajo.

2. Seleccionar Agregar Prenda.

3. Registrar el tipo de prenda.

4. Guardar.

Resultado Esperado:

• La prenda queda registrada correctamente.

• La prenda queda asociada a la orden seleccionada.

Caso de Prueba CP-35

Nombre: Intentar registrar una prenda sin orden de trabajo.

Precondición:

No existe una orden seleccionada.

Pasos:

1. Intentar registrar una prenda.

Resultado Esperado:

• El sistema no permite el registro.

• El sistema informa que la prenda debe estar asociada a una orden.

HU-17 Registrar Descripción del Arreglo

Caso de Prueba CP-36

Nombre: Registrar descripción del arreglo.

Precondición:

Se está registrando una prenda.

Pasos:

1. Ingresar la descripción del arreglo.

2. Guardar.

Resultado Esperado:

• La descripción queda almacenada correctamente.

Caso de Prueba CP-37

Nombre: Intentar registrar una prenda sin descripción.

Precondición:

Se está registrando una prenda.

Pasos:

1. Dejar vacío el campo descripción.

2. Guardar.

Resultado Esperado:

• El sistema no permite guardar la prenda.

• El sistema informa que la descripción es obligatoria.

HU-18 Asignar Valor Económico

Caso de Prueba CP-38

Nombre: Registrar valor económico válido.

Precondición:

Se está registrando una prenda.

Pasos:

1. Ingresar un valor mayor a cero.

2. Guardar.

Resultado Esperado:

• El valor queda almacenado correctamente.

Caso de Prueba CP-39

Nombre: Registrar valor igual a cero.

Precondición:

Se está registrando una prenda.

Pasos:

1. Ingresar valor 0.

2. Guardar.

Resultado Esperado:

• El sistema no permite guardar.

• El sistema informa que el valor debe ser mayor que cero.

HU-19 Consultar Estado de una Prenda

Caso de Prueba CP-40

Nombre: Consultar estado actual de una prenda.

Precondición:

Existe una prenda registrada.

Pasos:

1. Abrir el detalle de la prenda.

Resultado Esperado:

• El sistema muestra el estado actual.

• El sistema muestra la fecha de última actualización.

HU-20 Actualizar Estado de una Prenda

Caso de Prueba CP-41

Nombre: Actualizar estado de una prenda.

Precondición:

Existe una prenda registrada.

Pasos:

1. Seleccionar la prenda.

2. Cambiar el estado.

3. Guardar.

Resultado Esperado:

• El sistema actualiza el estado correctamente.

• El sistema registra la fecha de modificación.

Caso de Prueba CP-42

Nombre: Seleccionar un estado no permitido.

Precondición:

Existe una prenda registrada.

Pasos:

1. Intentar asignar un estado no definido por el sistema.

Resultado Esperado:

• El sistema rechaza la operación.

• El estado de la prenda permanece sin cambios.

HU-21 Visualizar Prendas Asociadas a una Orden

Caso de Prueba CP-43

Nombre: Consultar prendas asociadas a una orden.

Precondición:

La orden posee prendas registradas.

Pasos:

1. Abrir la orden.

2. Consultar listado de prendas.

Resultado Esperado:

• El sistema muestra todas las prendas asociadas.

• Se visualiza el estado y valor de cada una.

HU-22 Calcular Valor Total de una Orden

Caso de Prueba CP-44

Nombre: Calcular valor total con múltiples prendas.

Precondición:

Existe una orden con varias prendas.

Pasos:

1. Registrar una prenda por $10.000.

2. Registrar una prenda por $15.000.

3. Consultar el total de la orden.

Resultado Esperado:

• El sistema muestra un total de $25.000.

Caso de Prueba CP-45

Nombre: Actualizar total después de modificar una prenda.

Precondición:

Existe una orden con prendas registradas.

Pasos:

1. Modificar el valor de una prenda.

2. Consultar el total.

Resultado Esperado:

• El sistema recalcula automáticamente el valor total.

HU-23 Actualizar Estado de Orden Automáticamente

Caso de Prueba CP-46

Nombre: Cambiar orden a Lista para entregar.

Precondición:

Existe una orden con una única prenda pendiente.

Pasos:

1. Cambiar el estado de la última prenda a Terminada.

Resultado Esperado:

• La orden cambia automáticamente a "Lista para entregar".

• El cambio queda registrado en el historial.

Caso de Prueba CP-47

Nombre: Mantener orden en proceso.

Precondición:

Existe al menos una prenda en estado Pendiente o En Proceso.

Pasos:

1. Consultar el estado de la orden.

Resultado Esperado:

• La orden permanece en estado "En Proceso".

HU-24 Registrar Observaciones

Caso de Prueba CP-48

Nombre: Registrar observaciones para una prenda.

Precondición:

Existe una prenda registrada.

Pasos:

1. Ingresar observaciones.

2. Guardar.

Resultado Esperado:

• Las observaciones quedan asociadas a la prenda.

HU-25 Consultar Observaciones

Caso de Prueba CP-49

Nombre: Consultar observaciones registradas.

Precondición:

La prenda posee observaciones registradas.

Pasos:

1. Abrir el detalle de la prenda.

Resultado Esperado:

• El sistema muestra las observaciones almacenadas.

Caso de Prueba CP-50

Nombre: Consultar observaciones inexistentes.

Precondición:

La prenda no posee observaciones.

Pasos:

1. Abrir el detalle de la prenda.

Resultado Esperado:

• El sistema informa que no existen observaciones registradas.

HU-26 Capturar Fotografía de una Prenda

Caso de Prueba CP-51

Nombre: Capturar fotografía correctamente.

Precondición:

Se está registrando una prenda.

Pasos:

1. Activar la cámara.

2. Tomar una fotografía.

3. Confirmar la captura.

Resultado Esperado:

• El sistema muestra una vista previa.

• La fotografía queda lista para ser almacenada.

Caso de Prueba CP-52

Nombre: Repetir captura de fotografía.

Precondición:

Se está registrando una prenda.

Pasos:

1. Capturar una fotografía.

2. Seleccionar Repetir captura.

Resultado Esperado:

• El sistema descarta la fotografía anterior.

• Permite realizar una nueva captura.

HU-27 Almacenar Fotografías de una Prenda

Caso de Prueba CP-53

Nombre: Almacenar una fotografía correctamente.

Precondición:

Existe una prenda registrada.

Se ha capturado una fotografía válida.

Pasos:

Asociar la fotografía a la prenda.

Guardar el registro.

Resultado Esperado:

• La fotografía queda almacenada correctamente.

• La fotografía queda asociada a la prenda.

• El sistema muestra mensaje de confirmación.

Caso de Prueba CP-54

Nombre: Almacenar múltiples fotografías.

Precondición:

Existe una prenda registrada.

Pasos:

Capturar o seleccionar varias fotografías.

Asociarlas a la prenda.

Guardar.

Resultado Esperado:

• Todas las fotografías quedan almacenadas.

• Todas las fotografías quedan asociadas a la misma prenda.

HU-28 Consultar Fotografías de una Prenda

Caso de Prueba CP-55

Nombre: Consultar fotografías registradas.

Precondición:

La prenda posee fotografías almacenadas.

Pasos:

Abrir el detalle de la prenda.

Consultar la sección de fotografías.

Resultado Esperado:

• El sistema muestra todas las fotografías asociadas.

Caso de Prueba CP-56

Nombre: Consultar fotografías de una prenda sin imágenes.

Precondición:

La prenda no posee fotografías registradas.

Pasos:

Abrir el detalle de la prenda.

Consultar la sección de fotografías.

Resultado Esperado:

• El sistema informa que no existen fotografías registradas.

HU-29 Visualizar Fotografías de una Prenda

Caso de Prueba CP-57

Nombre: Ampliar fotografía registrada.

Precondición:

La prenda posee fotografías almacenadas.

Pasos:

Abrir la galería de fotografías.

Seleccionar una fotografía.

Resultado Esperado:

• La fotografía se visualiza en tamaño ampliado.

• La imagen conserva una calidad adecuada.

Caso de Prueba CP-58

Nombre: Navegar entre fotografías de una misma prenda.

Precondición:

La prenda posee varias fotografías registradas.

Pasos:

Abrir una fotografía.

Utilizar las opciones de navegación.

Resultado Esperado:

• El sistema permite visualizar las demás fotografías asociadas.

Caso de Prueba CP-59

Nombre: Cerrar visualización ampliada.

Precondición:

Existe una fotografía abierta en modo ampliado.

Pasos:

Seleccionar la opción Cerrar.

Resultado Esperado:

• El sistema regresa al detalle de la prenda.

HU-30 Modificar Información de una Prenda

Caso de Prueba CP-60

Nombre: Modificar descripción de una prenda.

Precondición:

Existe una prenda registrada.

Pasos:

Editar la descripción del arreglo.

Guardar cambios.

Resultado Esperado:

• La descripción queda actualizada correctamente.

• El sistema muestra mensaje de confirmación.

Caso de Prueba CP-61

Nombre: Modificar valor económico de una prenda.

Precondición:

Existe una prenda registrada.

Pasos:

Editar el valor económico.

Guardar cambios.

Resultado Esperado:

• El nuevo valor queda almacenado.

• El total de la orden se recalcula automáticamente.

Caso de Prueba CP-62

Nombre: Modificar información con datos inválidos.

Precondición:

Existe una prenda registrada.

Pasos:

Editar el valor económico.

Ingresar un valor igual a cero.

Guardar cambios.

Resultado Esperado:

• El sistema rechaza la actualización.

• Se informa que el valor debe ser mayor que cero.

HU-31 Eliminar Fotografía de una Prenda

Caso de Prueba CP-63

Nombre: Eliminar fotografía registrada.

Precondición:

La prenda posee al menos una fotografía.

Pasos:

Seleccionar una fotografía.

Elegir la opción Eliminar.

Confirmar la operación.

Resultado Esperado:

• El sistema elimina únicamente la fotografía seleccionada.

• El sistema muestra mensaje de confirmación.

Caso de Prueba CP-64

Nombre: Cancelar eliminación de fotografía.

Precondición:

La prenda posee fotografías registradas.

Pasos:

Seleccionar una fotografía.

Elegir la opción Eliminar.

Cancelar la operación.

Resultado Esperado:

• La fotografía permanece registrada.

• No se realiza ningún cambio.

Caso de Prueba CP-65

Nombre: Verificar conservación de fotografías restantes.

Precondición:

La prenda posee varias fotografías registradas.

Pasos:

Eliminar una fotografía.

Consultar nuevamente la galería.

Resultado Esperado:

• Solo desaparece la fotografía eliminada.

• Las demás fotografías permanecen disponibles.

**ÉPICA 4: GESTIÓN DE PAGOS**

HU-32 Registrar Abono

Caso de Prueba CP-66

Nombre: Registrar un abono correctamente.

Precondición:

Existe una orden de trabajo con saldo pendiente.

Pasos:

1. Abrir la orden de trabajo.

2. Seleccionar Registrar Abono.

3. Ingresar un valor válido.

4. Guardar.

Resultado Esperado:

• El abono queda registrado correctamente.

• El sistema almacena la fecha del abono.

• El sistema muestra mensaje de confirmación.

Caso de Prueba CP-67

Nombre: Registrar un abono con valor cero.

Precondición:

Existe una orden con saldo pendiente.

Pasos:

1. Seleccionar Registrar Abono.

2. Ingresar valor 0.

3. Guardar.

Resultado Esperado:

• El sistema no permite registrar el abono.

• El sistema informa que el valor debe ser mayor a cero.

Caso de Prueba CP-68

Nombre: Registrar un abono superior al saldo pendiente.

Precondición:

La orden tiene saldo pendiente de $20.000.

Pasos:

1. Registrar un abono por $25.000.

2. Guardar.

Resultado Esperado:

• El sistema rechaza la operación.

• El sistema informa que el valor supera el saldo pendiente.

HU-33 Registrar Método de Pago

Caso de Prueba CP-69

Nombre: Registrar pago en efectivo.

Precondición:

Existe una orden con saldo pendiente.

Pasos:

1. Registrar un abono.

2. Seleccionar Efectivo como método de pago.

3. Guardar.

Resultado Esperado:

• El método de pago queda asociado al abono.

• La información queda almacenada correctamente.

Caso de Prueba CP-70

Nombre: Registrar pago mediante transferencia.

Precondición:

Existe una orden con saldo pendiente.

Pasos:

1. Registrar un abono.

2. Seleccionar Transferencia como método de pago.

3. Guardar.

Resultado Esperado:

• El sistema registra correctamente el método utilizado.

HU-34 Consultar Historial de Pagos

Caso de Prueba CP-71

Nombre: Consultar historial de pagos existente.

Precondición:

La orden posee pagos registrados.

Pasos:

1. Abrir la orden de trabajo.

2. Consultar historial de pagos.

Resultado Esperado:

• El sistema muestra todos los pagos asociados.

• Se visualiza fecha, valor y método de pago.

Caso de Prueba CP-72

Nombre: Consultar historial sin pagos registrados.

Precondición:

La orden no posee pagos registrados.

Pasos:

1. Consultar historial de pagos.

Resultado Esperado:

• El sistema informa que no existen pagos registrados.

HU-35 Calcular Saldo Pendiente

Caso de Prueba CP-73

Nombre: Calcular saldo después de un abono.

Precondición:

La orden tiene valor total de $50.000.

Pasos:

1. Registrar un abono de $20.000.

2. Consultar saldo pendiente.

Resultado Esperado:

• El sistema muestra saldo pendiente de $30.000.

Caso de Prueba CP-74

Nombre: Calcular saldo después de varios abonos.

Precondición:

La orden tiene valor total de $50.000.

Pasos:

1. Registrar un abono de $15.000.

2. Registrar un segundo abono de $10.000.

3. Consultar saldo pendiente.

Resultado Esperado:

• El sistema muestra saldo pendiente de $25.000.

HU-36 Consultar Órdenes con Saldo Pendiente

Caso de Prueba CP-75

Nombre: Consultar órdenes con pagos pendientes.

Precondición:

Existen órdenes con saldo pendiente.

Pasos:

1. Acceder al listado de órdenes con saldo pendiente.

Resultado Esperado:

• El sistema muestra únicamente las órdenes con deuda pendiente.

• Se visualiza el cliente asociado y el valor pendiente.

Caso de Prueba CP-76

Nombre: Consultar cuando no existen órdenes con saldo pendiente.

Precondición:

Todas las órdenes registradas se encuentran pagadas.

Pasos:

1. Consultar órdenes con saldo pendiente.

Resultado Esperado:

• El sistema informa que no existen órdenes pendientes de pago.

HU-37 Actualizar Estado de Pago Automáticamente

Caso de Prueba CP-77

Nombre: Marcar orden como pagada automáticamente.

Precondición:

Existe una orden con saldo pendiente

Pasos:

1. Registrar el pago restante.

2. Guardar.

Resultado Esperado:

• El saldo pendiente queda en cero.

• El estado de pago cambia automáticamente a "Pagada".

Caso de Prueba CP-78

Nombre: Mantener estado pendiente con saldo restante.

Precondición:

Existe una orden con saldo pendiente.

Pasos:

1. Registrar un abono parcial.

2. Consultar información de la orden.

Resultado Esperado:

• El saldo pendiente continúa siendo mayor a cero.

• El estado de pago permanece como "Pendiente".

**ÉPICA 5: NOTIFICACIONES Y COMUNICACIÓN CON CLIENTES**

HU-38 Notificar Orden Lista para Entrega

Caso de Prueba CP-79

Nombre: Enviar notificación cuando una orden quede lista para entregar.

Precondición:

Existe una orden de trabajo.

Todas las prendas asociadas se encuentran en estado "Terminada".

El cliente tiene un medio de contacto registrado.

Pasos:

Actualizar el estado de la última prenda pendiente a "Terminada".

Esperar la actualización automática de la orden.

Resultado Esperado:

La orden cambia automáticamente a estado "Lista para entregar".

El sistema genera una notificación para el cliente.

La notificación queda registrada en el historial.

Caso de Prueba CP-80

Nombre: Verificar contenido de la notificación enviada.

Precondición:

Existe una notificación de orden lista para entregar.

Pasos:

Consultar el historial de notificaciones.

Resultado Esperado:

La notificación contiene información que identifica la orden.

La notificación informa que las prendas están listas para ser reclamadas.

HU-39 Compartir Resumen de Orden de Trabajo

Caso de Prueba CP-81

Nombre: Compartir resumen de una orden por Telegram.

Precondición:

Existe una orden de trabajo registrada.

Pasos:

Seleccionar la orden.

Seleccionar la opción "Compartir Resumen".

Elegir Telegram como medio de envío.

Confirmar el envío.

Resultado Esperado:

El sistema genera el resumen de la orden.

El resumen es enviado mediante Telegram.

Se registra la fecha y hora del envío.

Caso de Prueba CP-82

Nombre: Verificar información incluida en el resumen.

Precondición:

Existe un resumen generado para una orden.

Pasos:

Consultar el resumen enviado.

Resultado Esperado:

El resumen incluye las prendas registradas.

El resumen incluye los valores de las prendas.

El resumen incluye los pagos realizados.

El resumen incluye el saldo pendiente.

HU-40 Enviar Recordatorios de Órdenes Pendientes

Caso de Prueba CP-83

Nombre: Enviar recordatorio a una orden pendiente de reclamar.

Precondición:

Existe una orden en estado "Lista para entregar".

Pasos:

Ejecutar el proceso de recordatorios automáticos.

Resultado Esperado:

El sistema genera un recordatorio para el cliente.

El envío queda registrado en el historial.

Caso de Prueba CP-84

Nombre: Evitar múltiples recordatorios el mismo día.

Precondición:

Ya existe un recordatorio enviado para la orden durante el día actual.

Pasos:

Ejecutar nuevamente el proceso de recordatorios.

Resultado Esperado:

El sistema no envía un nuevo recordatorio.

No se genera un registro duplicado.

HU-41 Consultar Historial de Notificaciones

Caso de Prueba CP-85

Nombre: Consultar historial de notificaciones existente.

Precondición:

Existen notificaciones registradas para un cliente.

Pasos:

Seleccionar un cliente.

Consultar historial de notificaciones.

Resultado Esperado:

El sistema muestra las notificaciones enviadas.

Se visualiza la fecha y hora de cada notificación.

Se visualiza el tipo de notificación.

Caso de Prueba CP-86

Nombre: Consultar historial sin notificaciones registradas.

Precondición:

El cliente no posee notificaciones registradas.

Pasos:

Consultar historial de notificaciones.

Resultado Esperado:

El sistema informa que no existen notificaciones registradas.

**ÉPICA 6: CONTROL Y SEGUIMIENTO DEL NEGOCIO**

HU-42 Consultar Órdenes Próximas a Vencer

Caso de Prueba CP-87

Nombre: Consultar órdenes próximas a vencer.

Precondición:

Existen órdenes con fecha de entrega dentro del período definido por el negocio.

Pasos:

Acceder a la opción "Órdenes Próximas a Vencer".

Resultado Esperado:

El sistema muestra únicamente las órdenes próximas a vencer.

Las órdenes aparecen ordenadas por fecha de entrega.

Se visualiza el cliente asociado a cada orden.

Caso de Prueba CP-88

Nombre: Excluir órdenes fuera del rango de vencimiento.

Precondición:

Existen órdenes con fechas de entrega lejanas.

Pasos:

Consultar órdenes próximas a vencer.

Resultado Esperado:

El sistema no muestra las órdenes que estén fuera del período configurado.

HU-43 Consultar Ingresos Registrados

Caso de Prueba CP-89

Nombre: Consultar ingresos de un período con pagos registrados.

Precondición:

Existen pagos registrados durante el período consultado.

Pasos:

Seleccionar fecha inicial.

Seleccionar fecha final.

Ejecutar la consulta.

Resultado Esperado:

El sistema calcula los ingresos del período.

El sistema muestra el total de ingresos registrados.

Caso de Prueba CP-90

Nombre: Consultar período sin ingresos registrados.

Precondición:

No existen pagos registrados en el período consultado.

Pasos:

Seleccionar el período.

Ejecutar la consulta.

Resultado Esperado:

El sistema muestra un total de cero o informa que no existen ingresos registrados.

HU-44 Consultar Dinero Pendiente por Cobrar

Caso de Prueba CP-91

Nombre: Consultar dinero pendiente por cobrar.

Precondición:

Existen órdenes con saldo pendiente.

Pasos:

Acceder a la consulta de dinero pendiente por cobrar.

Resultado Esperado:

El sistema calcula el total de saldos pendientes.

El sistema muestra el valor total pendiente por cobrar.

Caso de Prueba CP-92

Nombre: Consultar cuando no existen saldos pendientes.

Precondición:

Todas las órdenes se encuentran completamente pagadas.

Pasos:

Consultar dinero pendiente por cobrar.

Resultado Esperado:

El sistema muestra valor cero.

No aparecen órdenes pendientes asociadas.

HU-45 Consultar Historial de Actividades

Caso de Prueba CP-93

Nombre: Consultar historial de actividades de una orden.

Precondición:

La orden posee actividades registradas.

Pasos:

Abrir la orden de trabajo.

Consultar el historial de actividades.

Resultado Esperado:

El sistema muestra todas las actividades registradas.

Las actividades aparecen ordenadas cronológicamente.

Se visualiza la fecha y hora de cada actividad.

Caso de Prueba CP-94

Nombre: Verificar registro de una modificación realizada.

Precondición:

Se realizó una modificación sobre la orden.

Pasos:

Consultar el historial de actividades.

Resultado Esperado:

La modificación aparece registrada.

Se visualiza la fecha y hora correspondiente.

HU-46 Identificar Órdenes sin Reclamar

Caso de Prueba CP-95

Nombre: Identificar órdenes sin reclamar.

Precondición:

Existen órdenes con más de 30 días en estado "Lista para entregar".

Pasos:

Acceder a la consulta de órdenes sin reclamar.

Resultado Esperado:

El sistema muestra únicamente las órdenes que superan los 30 días.

Se visualiza el cliente asociado.

Se muestra la cantidad de días transcurridos.

Caso de Prueba CP-96

Nombre: Excluir órdenes con menos de 30 días.

Precondición:

Existen órdenes en estado "Lista para entregar" con menos de 30 días.

Pasos:

Consultar órdenes sin reclamar.

Resultado Esperado:

El sistema no muestra las órdenes que aún no cumplen los 30 días.

HU-47 Registrar Fecha y Hora de Entrega

Caso de Prueba CP-97

Nombre: Registrar automáticamente fecha y hora de entrega.

Precondición:

Existe una orden lista para entregar.

Todas las prendas asociadas han sido entregadas.

Pasos:

Completar la entrega de la última prenda pendiente.

Resultado Esperado:

La orden cambia automáticamente a estado "Entregada".

El sistema registra la fecha y hora de entrega.

La información queda almacenada en el historial de la orden.

Caso de Prueba CP-98

Nombre: Consultar fecha y hora de entrega registrada.

Precondición:

Existe una orden en estado "Entregada".

Pasos:

Consultar el detalle de la orden.

Resultado Esperado:

El sistema muestra la fecha y hora de entrega registradas.

La información coincide con el momento en que la orden fue entregada.