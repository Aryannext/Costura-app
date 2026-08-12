import{V as e}from"./_plugin-vue_export-helper-DH4grXso.js";import{g as t,p as n}from"./index-BITxfth1.js";async function r(e,r,i){if(!n)throw Error(`Database not initialized`);let a=await n.run(`INSERT INTO notificacion (mensaje, id_orden, id_tipo_notificacion) VALUES (?, ?, ?)`,[e,r,i]);return await t(),a.changes.lastId}async function i(e){if(!n)throw Error(`Database not initialized`);return(await n.query(`
        SELECT n.*, tn.nombre as tipo_nombre 
        FROM notificacion n
        JOIN tipo_notificacion tn ON n.id_tipo_notificacion = tn.id_tipo_notificacion
        WHERE n.id_orden = ?
        ORDER BY n.fecha_envio DESC
    `,[e])).values||[]}async function a(e){if(!n)throw Error(`Database not initialized`);return(await n.query(`
        SELECT n.*, tn.nombre as tipo_nombre, ot.id_orden
        FROM notificacion n
        JOIN tipo_notificacion tn ON n.id_tipo_notificacion = tn.id_tipo_notificacion
        JOIN orden_trabajo ot ON n.id_orden = ot.id_orden
        WHERE ot.id_cliente = ?
        ORDER BY n.fecha_envio DESC
    `,[e])).values||[]}async function o(){if(!n)throw Error(`Database not initialized`);let e=await n.query(`
        SELECT id_orden 
        FROM orden_trabajo 
        WHERE id_estado_orden = 3
    `),t=0;if(e.values&&e.values.length>0)for(let i of e.values)(await n.query(`
                SELECT count(*) as count 
                FROM notificacion 
                WHERE id_orden = ? AND id_tipo_notificacion = 3 AND date(fecha_envio) = date('now','localtime')
            `,[i.id_orden])).values[0].count===0&&(await r(`Recordatorio: Su orden está lista para ser reclamada. Por favor, acérquese a recogerla.`,i.id_orden,3),t++);return t}function s(){let t=e([]),n=e(!1),s=e(null);return{notificaciones:t,loading:n,error:s,fetchNotificaciones:async e=>{n.value=!0,s.value=null;try{t.value=await i(e)}catch(e){s.value=`Error al cargar notificaciones: `+e.message}finally{n.value=!1}},fetchNotificacionesCliente:async e=>{n.value=!0,s.value=null;try{t.value=await a(e)}catch(e){s.value=`Error al cargar notificaciones del cliente: `+e.message}finally{n.value=!1}},saveNotificacion:async(e,t,n)=>{try{await r(e,t,n)}catch(e){console.error(`Error al guardar notificación:`,e)}},triggerRecordatorios:async()=>{n.value=!0,s.value=null;try{return await o()}catch(e){return s.value=`Error al ejecutar recordatorios: `+e.message,0}finally{n.value=!1}}}}export{s as t};