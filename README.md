# DAIG Web

React + Vite, Supabase (Auth, Postgres y Storage), Netlify Functions y Resend.

## Desarrollo y validación

```sh
npm ci
npm run dev
npm test
npm run build
```

Para correo, administración de usuarios y documentación técnica se necesita
`npm run dev:netlify`, ya que `vite` solo sirve el frontend.

Variables del frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
Variables de las funciones: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (o sus equivalentes
`VITE_`), `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
La clave de servicio solo debe estar en el servidor, nunca en una variable `VITE_`.
Las pruebas sustituyen las peticiones externas y no envían correos reales.

## Activar las facturas

1. Ejecutar `supabase/agregar_factura.sql` en el SQL Editor del proyecto Supabase.
   Es una migración aditiva y repetible: crea `factura_path` y el bucket privado
   `registros-facturas`, con lectura para el propietario, admin y directiva.
2. Publicar frontend y funciones Netlify juntos, después de aplicar el SQL.
   Para adjuntar varias facturas, ejecutar también
   `supabase/agregar_facturas_multiples.sql` antes de publicar. Conserva las
   facturas anteriores en `factura_paths`; el formulario permite añadir varias
   imágenes y quitar cada una por separado, también al editar. El límite de
   15 MB se aplica por imagen. Las colas offline antiguas siguen siendo compatibles.
3. Verificar con un trabajador: crear un registro con factura, abrirla desde
   el historial, reemplazarla y quitarla al editar. Comprobar también la vista
   expandida de registros en administración.
4. Probar un registro nuevo sin conexión y volver a conectar con el mismo
   usuario. La factura queda en IndexedDB junto con las fotos hasta guardar
   correctamente el registro. El envío se realiza al volver a abrir el portal
   o al recuperar conexión con el portal abierto; no existe un service worker.

La factura es opcional: JPG, PNG, WebP o HEIC, máximo 15 MB; HEIC se convierte
a JPEG antes de subirlo. Las URLs de lectura caducan a los 10 minutos y se
renuevan mientras la vista permanece abierta. Quitar o reemplazar una factura
desvincula la anterior del registro, pero no elimina el objeto del almacenamiento.
Un fallo después de subir archivos también puede dejar objetos sin referencia;
su limpieza requiere revisar referencias antes de borrarlos.

## Documentación técnica y permisos

Los documentos están en `private/docs`, incluidos únicamente en la función
`tech-docs`; ya no se publican en `/docs`. La función comprueba sesión y rol
`admin` o `tecnico` en cada solicitud. Los enlaces internos funcionan dentro
del visor autenticado. El build de Vite por sí solo no sirve estos documentos.

Los SQL históricos no constituyen una copia completa del esquema de producción.
Antes de recrear la base, obtener un esquema/migración completo del proyecto
actual. La nueva migración no modifica el bucket existente `registros-fotos`,
que los scripts históricos configuran como público. Pasarlo a privado requiere
migrar también sus lectores y exportaciones; las facturas usan un bucket separado.

## Comprobaciones pendientes en el entorno real

La compilación y las pruebas locales no verifican RLS desplegado, permisos de
Storage, envío real de Resend ni el empaquetado de funciones en Netlify.
La migración SQL debe aplicarse antes de considerar activa la funcionalidad.
