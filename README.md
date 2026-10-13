# Runa Sport – Fase 1 (base + sitio público desde la base de datos)

Next.js 14 + PostgreSQL + Prisma. El sitio público lee productos, categorías, stock y datos de la tienda desde la base,
y registra visitas, clics y consultas de WhatsApp en el backend (sin localStorage).

## Requisitos
Node.js 20+ y Docker Desktop (o un PostgreSQL 14+ propio).

## Instalación (Windows, en la carpeta del proyecto, ej. `D:\Tienda Runa\runa-sport`)
1. `npm install`
2. `copy .env.example .env` y editá `ADMIN_PASSWORD` (10+ caracteres). No subas `.env` a ningún lado.
3. `docker compose up -d`  (levanta PostgreSQL; si usás otro Postgres, ajustá `DATABASE_URL`)
4. `npx prisma migrate dev --name init`  (crea las tablas)
5. `npm run db:seed`  (migra los 8 productos, categorías, talles, stock y datos de contacto; crea el admin inicial). Se puede repetir sin duplicar ni pisar cambios.
6. `npm run dev` → http://localhost:3000

## Producción
`npm run db:deploy && npm run build && npm start`

## Fase 2 (agregada)
Login real con sesiones, dashboard, CRUD de productos y categorías, stock con movimientos, registro de actividad con export CSV.
Entrar a `/admin` con el `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`.

## Fase 3 (agregada)
- **Imágenes por producto**: desde "Editar producto" → sección Imágenes. Subir, arrastrar y soltar, recortar (arrastrando sobre la imagen), marcar principal, reordenar (arrastrando las filas), editar ALT/título, reemplazar, eliminar y restaurar la imagen anterior. Se optimizan y convierten a WEBP automáticamente (necesita el paquete `sharp`, ya en `package.json`).
- **Página principal** (`/admin/pagina-principal`): hero (título, subtítulo, botón), logo, datos de contacto, WhatsApp, redes sociales, footer.
- **Configuración** (`/admin/configuracion`): SEO (meta title/description), favicon, colores de marca (se aplican en todo el sitio público al instante) y textos generales.
- Las imágenes se guardan en `public/uploads/` (no se suben a git). Para pasar a Cloudinary/S3 más adelante, solo hay que cambiar `lib/images.js`.

## Fase 4 (agregada)
- **Dashboard**: tarjetas y gráficos (visitas y consultas por día, productos más consultados, categorías más vistas, evolución del stock), alertas de stock y actividad reciente.
- **Consultas** y **Clientes/Contactos**: ranking por producto, por dispositivo y por canal, con filtro de 7/30/90 días y exportación a CSV y Excel. No se guardan datos personales.
- **Usuarios** (solo Super Admin): crear usuarios con rol, cambiar rol, desactivar y cambiar contraseña. **Mi cuenta** (click en tu nombre arriba): cambiar tu propia contraseña.
- **Buscador global** (arriba) y **notificaciones** (campana).
- **Backups** (solo Super Admin): crear, descargar, restaurar y eliminar. Se guardan en la carpeta `backups/` (no se sube a git). Restaurar pide escribir RESTAURAR y antes crea un backup automático del estado actual.
- **Recuperar contraseña por email**: completá `APP_URL` y `SMTP_*` en `.env`. Sin SMTP, el enlace aparece en la terminal de `npm run dev`.
- **Exportar a Excel** en Registro de actividad y en Consultas.
- Las imágenes subidas también se sirven con `npm run build && npm start` (ruta `/uploads/...`).

### Actualizar desde la Fase 3
1. Descomprimí el zip sobre la carpeta del proyecto, aceptando reemplazar.
2. `npm install`
3. `npx prisma migrate dev --name fase4` (agrega la tabla de recuperación de contraseña, no borra datos).
4. Reiniciá `npm run dev`.

## Todavía no incluido
Páginas públicas por producto (`/productos/mi-producto`), sitemap y robots.txt, imagen Open Graph y el registro de vistas de producto (hoy esas páginas no existen). Almacenamiento en Cloudinary o S3.
