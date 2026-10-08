# Especificación de Requisitos - Costura App (Fase 2)

> **Renumeración (9 de septiembre de 2026).** Esta especificación usaba RF-50 y
> RNF-24 a RNF-27, que ya estaban ocupados por `MEJORAS_ADICIONALES_FASE1.md`
> con otro significado. Para que la matriz de trazabilidad sea unívoca, los
> requisitos de Fase 2 se desplazaron: **RF-50…RF-60 pasan a RF-61…RF-71** y
> **RNF-24…RNF-27 pasan a RNF-28…RNF-31**. El contenido no cambió.
>
> Dos de ellos ya están implementados: **RF-68** (notificación local de entregas)
> y **RF-70** (buscador global). Ver [TRAZABILIDAD.md](../04-calidad/TRAZABILIDAD.md).

Este documento contiene la formalización de los nuevos requisitos para la expansión del sistema Atelier Manager, asegurando la trazabilidad con la Fase 1 documentada en `Costura.md`.

## Nuevas Épicas del Proyecto

**Épica 7: Módulo de Bodega / Papelería**
Como modista/dueña, quiero gestionar las prendas abandonadas por más de 30 días, para incautarlas y ponerlas a la venta, recuperando la inversión.

> **Requiere revalidación antes de implementarse (ANA-H05, 7 oct 2026).** Treinta días sin reclamar no vuelven abandonada una prenda ni dan derecho a venderla: la Ley 1480 art. 18 exige requerir a la clienta y seguir el procedimiento reglamentado. RF-61 a RF-63 quedan fuera de la entrega actual (D-07).

**Épica 8: Exportación e Impresión**
Como modista/dueña, quiero exportar la información financiera y generar tickets físicos, para compartir con contabilidad y entregar recibos en papel a los clientes.

**Épica 9: Notificaciones Locales**
Como modista/dueña, quiero que mi dispositivo me alerte de tareas pendientes, para no depender de revisar la aplicación manualmente.

**Épica 10: Rendimiento y Búsqueda Global**
Como modista/dueña, quiero buscar información rápidamente en todo el sistema y que la aplicación cargue rápido, para mantener la agilidad del negocio a medida que crecen los datos.

---

## Nuevos Requisitos Funcionales (RF)

### Gestión de Bodega / Papelería
* **RF-61.** El sistema debe permitir trasladar una orden de trabajo (con más de 30 días en estado "Lista para entregar") al estado "Archivada/Bodega".
* **RF-62.** El sistema debe permitir registrar la venta de una prenda que se encuentre en estado "Archivada/Bodega".
* **RF-63.** El sistema debe registrar el ingreso económico de la venta de prendas en bodega y diferenciarlo de los ingresos por arreglos normales.

### Exportación e Impresión
* **RF-64.** El sistema debe permitir exportar los reportes de ingresos y cuentas por cobrar en formato Excel (.xlsx).
* **RF-65.** El sistema debe permitir exportar los reportes de ingresos y cuentas por cobrar en formato PDF.
* **RF-66.** El sistema debe permitir la conexión con impresoras térmicas portátiles mediante Bluetooth.
* **RF-67.** El sistema debe imprimir un ticket con el detalle de la orden de trabajo, abonos y saldo mediante la impresora térmica configurada.

### Notificaciones Locales
* **RF-68.** El sistema debe generar notificaciones locales en el dispositivo móvil indicando el número de órdenes próximas a vencer.
* **RF-69.** El sistema debe permitir configurar la hora en la que se generarán las notificaciones locales diarias.

### Búsqueda Global y Ajustes
* **RF-70.** El sistema debe contar con un buscador global que permita localizar órdenes, prendas o clientes desde una única barra de búsqueda utilizando texto o números.
* **RF-71.** El sistema debe permitir cambiar la interfaz gráfica entre Modo Claro y Modo Oscuro.

---

## Nuevos Requisitos No Funcionales (RNF)

* **RNF-28 (Rendimiento):** El sistema debe implementar paginación (virtual scrolling) en las listas de órdenes y prendas para soportar más de 5,000 registros sin exceder 2 segundos de tiempo de carga en la vista.
* **RNF-29 (Compatibilidad):** El módulo de impresión térmica debe ser compatible con comandos estándar ESC/POS.
* **RNF-30 (Usabilidad):** El Modo Oscuro debe cumplir con las directrices de contraste de accesibilidad WCAG 2.1 nivel AA.
* **RNF-31 (Autonomía):** Las notificaciones locales no deben requerir conexión a internet para activarse, basándose exclusivamente en el reloj interno del dispositivo.

---

## Historias de Usuario (Selección Fase 2)

**HU-48 Trasladar Orden a Bodega**
* **Como** modista/dueña,
* **Quiero** enviar órdenes abandonadas a la sección de Bodega,
* **Para** despejar mi lista de entregas y disponer de las prendas para venta.
* *Criterios de Aceptación:*
  * CA-01. El sistema solo habilitará el botón de traslado si la orden supera los 30 días desde la fecha de finalización.
  * CA-02. El sistema debe solicitar doble confirmación antes de archivar la orden.
  * CA-03. La orden pasará a una vista exclusiva llamada "Bodega".

**HU-49 Exportar a Excel**
* **Como** modista/dueña,
* **Quiero** exportar las tablas de mis reportes a Excel,
* **Para** compartir mis ingresos con mi contador fácilmente.
* *Criterios de Aceptación:*
  * CA-01. El sistema debe generar un archivo con extensión .xlsx.
  * CA-02. El sistema debe invocar la función de compartir nativa del celular (Share API) para enviar el Excel por WhatsApp o Telegram.

**HU-50 Buscar globalmente**
* **Como** modista/dueña,
* **Quiero** escribir cualquier nombre o número en una sola barra de búsqueda,
* **Para** encontrar instantáneamente si se trata de un cliente o una orden sin navegar entre menús.
* *Criterios de Aceptación:*
  * CA-01. La barra debe estar accesible desde el Dashboard principal.
  * CA-02. Los resultados deben dividirse en categorías visuales (Clientes encontrados, Órdenes encontradas).
