# Respaldo Completo — Runa Sport (Tienda Runa)

Este directorio contiene el **respaldo completo y funcional** del proyecto **Runa Sport (Tienda Runa)**.

---

## 📦 Contenido del Respaldo

1. **Aplicación Web Completa (Next.js 14 App Router + PostgreSQL + Prisma)**
   - **`app/`**:
     - Rutas públicas: catálogo principal (`/`), carrito de compras (`/carrito`), páginas dinámicas de categorías (`/categoria/[slug]`), páginas de producto (`/producto/[slug]`), listado completo (`/productos`), ofertas (`/ofertas`), contacto (`/contacto`).
     - Panel de administración (`/admin`): dashboard, catálogo de productos, categorías, gestión de stock y movimientos, galería de imágenes WEBP con recorte, registro de actividad con exportación a Excel/CSV, gestión de usuarios con roles, backups automáticos y configuración de marca/SEO.
     - Rutas API (`app/api/cart`, `app/api/events`, `app/api/products`, `app/uploads`).
   - **`components/`**: componentes reutilizables de tienda pública (`ShopHeader`, `ShopFooter`, `ProductCard`, `ProductGallery`, `ProductDetailActions`, `CartIcon`, `CartView`, `CategoryCard`) y panel de administración (`Charts`, `ProductForm`, `ImageManager`, `ImageEditor`, etc.).
   - **`lib/`**: módulos del backend (autenticación y sesiones, carrito de compras persistente en cookie, lógica de base de datos con Prisma, utilidades de imágenes con Sharp, exportación a Excel, correo, logs y permisos).
   - **`prisma/`**: esquema de datos (`schema.prisma`), migraciones de base de datos y script de datos iniciales (`seed.mjs`).
   - **`public/uploads/`**: imágenes subidas de los productos optimizadas en formato WEBP.
   - **`node_modules/`**: dependencias instaladas y listas para usar.
   - **`runa-sport-codigo-fuente-backup.zip`**: archivo comprimido portátil con el código fuente completo, assets y configuraciones (excluyendo node_modules para máxima portabilidad).

2. **Páginas y Prototipos Estáticos**
   - **`tienda-runa-ropa-deportiva.html`**: Prototipo estático original en HTML/CSS de Tienda Runa.
   - **`tienda-ropa-deportiva.html`**: Versión alternativa estática.

3. **Documentación y Planes de Arquitectura**
   - **`runa-sport-ecommerce-plan.md`**: Plan maestro de arquitectura de fases del e-commerce.
   - **`runa-sport-fase6-brief-antigravity.md`**: Especificación de ejecución de la Fase 6 (Carrito de compras y flujo WhatsApp).

---

## 🚀 Cómo Ejecutar la Tienda

1. Abrir una terminal en este directorio (`D:\Tienda Runa\version-runasport-final`).
2. Si la base de datos PostgreSQL no está activa, levantarla con Docker:
   ```powershell
   docker compose up -d
   ```
3. Generar el cliente de Prisma (ya generado, pero por si se requiere):
   ```powershell
   npx prisma generate
   ```
4. Iniciar el servidor de desarrollo:
   ```powershell
   npm run dev
   ```
5. Abrir el navegador en:
   - Sitio público: [http://localhost:3000](http://localhost:3000)
   - Panel de administración: [http://localhost:3000/admin](http://localhost:3000/admin)
