# Runa Sport → E-commerce completo
### Documento de arquitectura y plan de fases para ejecutar con Antigravity

> Este documento asume que el proyecto de base es **Runa Sport** tal como quedó al final de la Fase 4 (Next.js 14 + PostgreSQL + Prisma + Auth por sesión, panel `/admin` funcional). No se parte de ningún HTML nuevo: se evoluciona el proyecto existente.
>
> **Supuesto a confirmar:** se mantiene el nombre "Runa Sport" y la paleta azul/amarillo actual. Si en realidad se quiere renombrar a "Vértice Sport", es un cambio menor (textos + `SiteSetting.brand_name` + assets) que se puede aplicar en cualquier fase sin afectar el resto del plan.

---

## 0. Qué se reutiliza y qué se reemplaza

| Del proyecto actual (Runa Sport, Fase 1-4) | Reutilizar / Reemplazar |
|---|---|
| Next.js 14 (App Router), Prisma, PostgreSQL | **Reutilizar tal cual.** Es la base de todo lo que sigue. |
| Auth por cookie de sesión (`lib/auth.js`), roles (Super Admin / Admin / Editor) | **Reutilizar.** Se agregan permisos nuevos (`orders`, `payments`, `customers`) al mismo sistema. |
| Modelo `Product`, `Category`, `ProductImage`, `ProductSize`, `ProductColor`, `Inventory` | **Reutilizar y extender.** Se agregan campos (destacado ya existe, falta "en oferta" calculado desde `promoPrice`), y se agrega `ProductVariant` real para combinaciones talle+color con stock propio. |
| `SiteSetting` (clave/valor) | **Reutilizar.** Es el lugar natural para hero, SEO, redes, y también para datos no sensibles de métodos de pago. |
| Sistema de imágenes (`lib/images.js`, recorte en canvas, `public/uploads`) | **Reutilizar tal cual.** Ya cumple el punto 13 del pedido (sin bloques de color como sustituto permanente, compresión, ALT). |
| Analítica (`AnalyticsEvent`, `ContactQuery`) | **Reutilizar y ampliar** con eventos de carrito (`agregar_carrito`, `iniciar_checkout`) y con `ContactQuery` pasando a ser un caso particular de "interés", separado de `Order`. |
| Home con grilla de productos y filtro por categoría en una sola página, anclas `#stock` / `#contacto` | **Reemplazar.** Pasa a ser: home con secciones (hero, categorías, destacados, ofertas) + páginas propias por categoría y por producto. Las anclas desaparecen. |
| Botón "Consultar" que abre WhatsApp | **Reutilizar el mecanismo, no el único camino.** Sigue existiendo en cada producto, pero deja de ser la única acción: se suma "Agregar al carrito" / "Comprar ahora". |
| Panel `/admin` (sidebar, dashboard, CRUD de productos/categorías, stock, actividad, usuarios, backups, configuración) | **Reutilizar la estructura y el patrón de código tal cual** (Server Actions, `requireUser(permiso)`, `ActionForm`, tablas con `.tw`/`.abtn`). Se agregan secciones nuevas siguiendo el mismo patrón: Pedidos, Clientes, Medios de pago. |
| Registro de actividad (`ActivityLog`) | **Reutilizar.** Cada acción nueva (cambiar estado de un pedido, activar un medio de pago) se loguea igual que hoy. |

**Conclusión:** no hay que tirar nada. El ~70% de lo pedido (identidad visual, imágenes, WhatsApp, categorías, stock, panel admin, actividad, usuarios, backups, SEO) ya existe y solo se extiende. Lo genuinamente nuevo es: páginas de producto/categoría con URL propia, carrito, checkout, medios de pago configurables, pedidos y clientes.

---

## 1. Arquitectura del proyecto

Se mantiene la decisión original: **un solo proyecto Next.js** (no un backend Express separado), porque simplifica el despliegue en el VPS y ya viene funcionando bien en las fases anteriores.

```
Navegador (sitio público + panel /admin)
        │
        ▼
Next.js 14 (App Router)
  ├─ Server Components  → lectura directa a Prisma (sin round-trip HTTP)
  ├─ Server Actions      → escrituras desde formularios (admin y checkout)
  ├─ Route Handlers /app/api/*  → integraciones externas (webhook de Mercado Pago,
  │                               búsqueda del carrito, tracking)
  └─ Middleware           → protege /admin/*, valida stock en checkout
        │
        ▼
PostgreSQL (Prisma ORM)
        │
        ▼
Mercado Pago API (SDK oficial) ── solo desde el servidor, nunca desde el navegador
```

**Por qué no un backend separado:** ya se decidió así en la Fase 1 y cambiar ahora implicaría reescribir autenticación, sesiones y todo el panel admin. Server Actions + Route Handlers cubren perfectamente carrito, checkout y webhooks sin esa complejidad extra.

**Carrito:** vive en el navegador (cookie `rs_cart`, JSON con `[{productId, variantId, qty}]`), **no** en localStorage/sessionStorage (para cumplir el punto 18 del pedido al pie de la letra: el cookie es HTTP-only-capaz y no es accesible por cualquier script de terceros). El contenido del carrito **no es información sensible** (son IDs y cantidades, no datos personales ni de pago), así que guardarlo del lado del cliente es correcto y estándar en e-commerce — lo que nunca se guarda ahí es el stock definitivo ni el precio final: **ambos se recalculan siempre en el servidor** al mostrar el carrito y al confirmar el checkout, así un precio viejo en la cookie nunca se cobra de verdad.

---

## 2. Estructura de carpetas (incremental sobre la actual)

```
runa-sport/
├─ app/
│  ├─ (public)/                      ← nuevo grupo de rutas, todo lo público
│  │  ├─ page.jsx                    → home (hero, categorías, destacados, ofertas)
│  │  ├─ productos/page.jsx          → listado general /productos
│  │  ├─ categoria/[slug]/page.jsx   → /categoria/remeras
│  │  ├─ producto/[slug]/page.jsx    → /producto/remera-dry-fit-sprint
│  │  ├─ ofertas/page.jsx            → /ofertas
│  │  ├─ medios-de-pago/page.jsx     → /medios-de-pago
│  │  ├─ carrito/page.jsx            → /carrito
│  │  ├─ checkout/page.jsx           → /checkout
│  │  ├─ checkout/gracias/[order]/page.jsx  → confirmación post-compra
│  │  └─ contacto/page.jsx           → /contacto
│  ├─ admin/(panel)/
│  │  ├─ pedidos/page.jsx            → nuevo
│  │  ├─ pedidos/[id]/page.jsx       → nuevo (detalle + cambio de estado)
│  │  ├─ clientes/page.jsx           → nuevo
│  │  ├─ pagos/page.jsx              → nuevo (medios de pago)
│  │  └─ (todo lo existente se mantiene igual)
│  └─ api/
│     ├─ cart/route.js               → leer/actualizar el carrito server-side (valida stock)
│     ├─ pagos/mercadopago/webhook/route.js
│     └─ pagos/mercadopago/crear-preferencia/route.js
├─ lib/
│  ├─ cart.js                        → leer cookie, recalcular contra la base
│  ├─ orders.js                      → crear pedido, cambiar estado, numeración
│  ├─ payments/
│  │  ├─ mercadopago.js
│  │  └─ index.js                    → arma la lista de métodos activos para mostrar
│  └─ (lib actual sin cambios: db, auth, actions, images, stats, backup…)
├─ components/
│  ├─ shop/                          → Header con buscador y carrito, ProductCard, Gallery…
│  └─ admin/ (como ya existe, + PedidoStatusForm, PaymentMethodForm)
└─ prisma/schema.prisma              → extendido, ver sección 3
```

`app/(public)` es un *route group*: no agrega segmento a la URL, solo ordena el código. La home deja de vivir en `app/page.jsx` a secas y pasa a este grupo junto con el resto del sitio público.

---

## 3. Base de datos (extensión del schema actual)

Se agregan estos modelos a `prisma/schema.prisma`. Los modelos ya existentes (`Product`, `Category`, `ProductImage`, `ProductSize`, `ProductColor`, `Inventory`, `SiteSetting`, `User`, `Session`, `ActivityLog`, etc.) **no se tocan**, salvo los dos cambios puntuales marcados como "ajuste".

```prisma
// Ajuste sobre Product: dos columnas nuevas y una relación
model Product {
  // ...columnas actuales sin cambios...
  onSale        Boolean         @default(false)   // "producto en oferta" explícito
  relatedTo     Product[]       @relation("ProductRelated")
  relatedFrom   Product[]       @relation("ProductRelated")
  variants      ProductVariant[]
  orderItems    OrderItem[]
}

// Ajuste sobre Category: falta la imagen de portada (el campo description ya existe)
model Category {
  // ...columnas actuales sin cambios...
  imageStorageKey String?   // ya existe "imageUrl"; se agrega la key para poder borrar el archivo
}

// Combinación talle+color con stock propio (hoy el stock es por producto, no por variante)
model ProductVariant {
  id         Int      @id @default(autoincrement())
  productId  Int
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  sizeLabel  String?
  colorName  String?
  sku        String?  @unique
  quantity   Int      @default(0)
  priceDelta Int      @default(0)   // diferencia de precio sobre el precio base, si aplica
  @@unique([productId, sizeLabel, colorName])
}

model Customer {
  id         Int      @id @default(autoincrement())
  firstName  String
  lastName   String
  dni        String?
  email      String
  phone      String
  whatsapp   String?
  createdAt  DateTime @default(now())
  orders     Order[]
  @@index([email])
}

model Order {
  id             Int           @id @default(autoincrement())
  number         String        @unique   // ej. "RS-000123", correlativo propio, no el id interno
  customerId     Int
  customer       Customer      @relation(fields: [customerId], references: [id])
  items          OrderItem[]
  subtotal       Int
  discountTotal  Int           @default(0)
  discountCode   String?
  shippingCost   Int           @default(0)
  total          Int
  deliveryMethod String        // 'PICKUP' | 'SHIPPING'
  shipProvince   String?
  shipCity       String?
  shipZip        String?
  shipAddress    String?
  shipFloor      String?
  paymentMethodId Int?
  paymentMethod  PaymentMethod? @relation(fields: [paymentMethodId], references: [id])
  paymentStatus  String        @default("PENDING")   // PENDING | PAID | REJECTED | REFUNDED
  status         String        @default("PENDIENTE") // ver máquina de estados abajo
  notes          String?       @db.Text
  mpPreferenceId String?
  mpPaymentId    String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  @@index([status])
  @@index([createdAt])
}

model OrderItem {
  id         Int      @id @default(autoincrement())
  orderId    Int
  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId  Int
  product    Product  @relation(fields: [productId], references: [id])
  variantId  Int?
  nameSnap   String   // nombre del producto al momento de la compra (por si luego se edita/borra)
  priceSnap  Int      // precio unitario al momento de la compra
  qty        Int
}

model PaymentMethod {
  id            Int      @id @default(autoincrement())
  type          String   // 'MERCADOPAGO' | 'TRANSFER' | 'CASH' | 'CARD' | 'OTHER'
  name          String
  active        Boolean  @default(true)
  position      Int      @default(0)
  description   String?  @db.Text
  instructions  String?  @db.Text
  surchargePct  Float    @default(0)   // recargo, ej. tarjeta en cuotas
  discountPct   Float    @default(0)   // descuento, ej. transferencia o efectivo
  installments  Int?                   // solo TARJETA
  // Transferencia bancaria (no sensible, se puede mostrar al público):
  bankName      String?
  bankHolder    String?
  bankCbu       String?
  bankAlias     String?
  bankCuit      String?
  // Mercado Pago: la Access Token y la Public Key NUNCA van acá.
  // Van solo en variables de entorno del servidor (ver sección 10).
  mpEnabled     Boolean  @default(false)
  orders        Order[]
}

model Discount {
  id         Int       @id @default(autoincrement())
  code       String    @unique
  percent    Float?
  amount     Int?
  active     Boolean   @default(true)
  expiresAt  DateTime?
  usageLimit Int?
  usedCount  Int       @default(0)
}
```

**Por qué la Access Token de Mercado Pago no es un campo de la tabla `PaymentMethod`**, aunque el punto 9 del pedido la liste como campo del admin: una Access Token es una credencial que permite cobrar en nombre de la tienda. Guardarla en la base de datos (aunque no se muestre en el frontend) la deja expuesta a cualquiera que tenga acceso a un backup, a la base, o a una fuga de la app. La práctica estándar — y lo que exige Mercado Pago en sus propias guías — es guardarla **solo** en una variable de entorno del servidor (`MERCADOPAGO_ACCESS_TOKEN`), que ni siquiera los Server Components pueden filtrar al navegador por accidente (a diferencia de una columna de tabla, que un desarrollador futuro podría exponer sin querer en un `select *`). En el panel, el campo "Access Token" se reemplaza por un **indicador de estado** ("✅ Configurada" / "⚠️ Falta configurar en el servidor") con instrucciones de qué variable cargar — así se cumple el espíritu del pedido (que el admin sepa si Mercado Pago está listo) sin violar el punto 18 del mismo pedido ("no dejar Access Tokens... dentro del frontend", que aplica con más razón todavía a que queden en una tabla legible).

**Máquina de estados de `Order.status`:** `PENDIENTE → PAGO_PENDIENTE → PAGO_CONFIRMADO → PREPARANDO → ENVIADO → ENTREGADO`, con `CANCELADO` alcanzable desde cualquier estado anterior a `ENTREGADO`. Se valida en el servidor que no se salte hacia atrás por error de un click.

---

## 4. API / Route Handlers

Los Server Actions cubren casi todo (igual que en las fases anteriores), pero hacen falta algunos Route Handlers reales porque los necesita un sistema externo (Mercado Pago) o el propio navegador antes de tener JS de React cargado:

| Ruta | Método | Qué hace |
|---|---|---|
| `/api/cart` | GET | Lee la cookie del carrito, recalcula precios/stock contra la base, devuelve el carrito "de verdad". |
| `/api/cart` | POST | Agrega/modifica/quita un ítem, valida stock, reescribe la cookie. |
| `/api/pagos/mercadopago/crear-preferencia` | POST | Llamado desde `/checkout` al confirmar con Mercado Pago: crea la preferencia con el SDK oficial usando `MERCADOPAGO_ACCESS_TOKEN`, devuelve la URL de pago. |
| `/api/pagos/mercadopago/webhook` | POST | Mercado Pago notifica acá cuando cambia el estado de un pago. Se valida la firma (`x-signature`) antes de actualizar `Order.paymentStatus`. **Nunca confiar en un webhook sin validar la firma** — si no se valida, cualquiera podría simular un pago aprobado. |

Todo lo demás (crear producto, cambiar stock, guardar configuración, crear pedido desde el checkout, cambiar estado de un pedido) sigue siendo un **Server Action**, exactamente con el mismo patrón que ya usa el proyecto (`'use server'`, `requireUser(permiso)`, `logActivity(...)`, `revalidatePath(...)`).

---

## 5. Sistema de autenticación

No cambia nada de lo ya construido (sesión por cookie httpOnly, hash bcrypt, bloqueo tras intentos fallidos, recuperación por email). Solo se agregan permisos nuevos a `lib/perms.js`:

```js
const P = {
  SUPER_ADMIN: '*',
  ADMIN: ['products', 'stock', 'images', 'queries', 'stats', 'orders', 'payments', 'customers'],
  EDITOR: ['products', 'images', 'content'],
}
```

`orders`, `payments` y `customers` quedan fuera del rol Editor a propósito: ver pedidos y datos de clientes es información sensible de negocio, no contenido del sitio.

---

## 6. Sistema de productos (extensión)

- El precio y el stock **por defecto** siguen siendo los de `Product`/`Inventory` como hoy — eso cubre el 90% de los productos que no tienen variantes reales de stock independiente.
- `ProductVariant` es **opcional**: solo se crea si un producto necesita que, por ejemplo, "Remera talle M" tenga stock distinto de "Remera talle L". Si el producto no tiene variantes cargadas, el checkout usa el stock e inventario general, igual que ahora. Esto evita forzar una migración de datos complicada sobre los 8 productos que ya existen.
- "Producto destacado" ya existe (`featured`). "Producto en oferta" se agrega como columna explícita (`onSale`) en vez de inferirlo solo de `promoPrice`, porque el pedido lo pide como un interruptor aparte — un producto puede tener precio promocional sin querer que aparezca en la sección `/ofertas`, o viceversa (una oferta por tiempo limitado sin tocar el precio de catálogo).
- "Productos relacionados": relación muchos-a-muchos (`relatedTo`/`relatedFrom`), elegidos a mano desde el editor del producto (no automático por categoría, para que el admin tenga control real de qué se sugiere).

---

## 7. Carrito de compras

- **Estado:** cookie `rs_cart` (JSON, `httpOnly: false` porque el propio JS del carrito necesita leerla para mostrar el contador, pero **nunca** contiene precios ni datos personales — solo `productId`, `variantId`, `qty`).
- **Validación de stock:** en tres momentos — al agregar un ítem, al abrir `/carrito`, y de nuevo al confirmar `/checkout` (por si el stock cambió entre medio, por ejemplo por otra venta). Si algo ya no está disponible, se avisa antes de cobrar, nunca después.
- **Código de descuento:** se valida contra `Discount` (activo, no vencido, no agotado) en el servidor al aplicarlo y de nuevo al confirmar la compra.
- **Feedback visual:** al agregar un producto, el contador del carrito en el header se actualiza y se muestra una confirmación breve (toast), cumpliendo el punto 17 del pedido.

---

## 8. Checkout

`/checkout` es un formulario en pasos (datos del cliente → entrega → medio de pago → confirmar), pero todo en una sola page para simplicidad (sin necesitar estado global complejo). Al confirmar:

1. Server Action `crearPedido(formData)`.
2. Revalida stock y precios contra la base (nunca confía en lo que mandó el navegador).
3. Crea o reutiliza el `Customer` por email.
4. Crea el `Order` + sus `OrderItem` con el precio **congelado** (`priceSnap`) al momento de la compra — así si después se cambia el precio del producto, los pedidos viejos no se alteran retroactivamente.
5. Según el medio de pago elegido:
   - **Mercado Pago:** llama a `/api/pagos/mercadopago/crear-preferencia` y redirige al checkout de Mercado Pago.
   - **Transferencia / Efectivo:** muestra las instrucciones configuradas en `PaymentMethod` y marca el pedido como `PENDIENTE` / `PAGO_PENDIENTE`.
6. Vacía el carrito y redirige a `/checkout/gracias/[numeroDePedido]`.

---

## 9. Sistema de pagos

`lib/payments/index.js` arma, en el servidor, la lista de métodos activos ordenados (`PaymentMethod.findMany({ where: { active: true }, orderBy: { position: 'asc' } })`) para mostrar tanto en `/medios-de-pago` como en el checkout — **un solo lugar de verdad**, así nunca se desincroniza lo que dice la página pública de lo que realmente está habilitado.

Mercado Pago es un caso particular: la fila en `PaymentMethod` con `type: 'MERCADOPAGO'` controla si la opción aparece (`mpEnabled`), pero la integración real solo funciona si además existe `MERCADOPAGO_ACCESS_TOKEN` en el `.env` del servidor. Si falta la variable, la opción se oculta automáticamente en el checkout aunque el admin la haya "activado", y el panel lo avisa con un cartel.

---

## 10. Panel administrativo — secciones nuevas

Siguiendo el mismo patrón que ya tiene el panel (sidebar, `requireUser(permiso)`, tablas con acciones, `ActionForm`/`ConfirmForm`):

- **`/admin/pedidos`**: tabla con número, fecha, cliente, total, método de pago, estado de pago, estado de pedido. Filtros por fecha, estado y método de pago (reutilizando el patrón de `activityWhere` ya existente). Exportable a CSV/Excel igual que Actividad y Consultas.
- **`/admin/pedidos/[id]`**: detalle completo + formulario para avanzar el estado (respetando la máquina de estados de la sección 3) + notas internas.
- **`/admin/clientes`**: tabla derivada de `Customer` con cantidad de compras, total comprado (`sum` de sus `Order.total`) y última compra (`max` de `Order.createdAt`) — calculado en la consulta, no guardado como columna redundante.
- **`/admin/pagos`**: CRUD de `PaymentMethod` con drag-and-drop para el orden (mismo mecanismo que ya existe para reordenar imágenes), activar/desactivar, y el indicador de estado de Mercado Pago descripto en la sección 3.
- **Dashboard**: se agregan tarjetas de Ventas (suma de `Order.total` con `paymentStatus: 'PAID'`), Pedidos pendientes, Pedidos pagados, y un gráfico de ventas por día (mismo componente `BarChart`/`LineChart` en SVG que ya se usa para visitas y consultas, sin sumar ninguna librería nueva).

---

## 11. Configuración general del sitio

Se extiende `SiteSetting` (mismo mecanismo clave/valor que ya existe) con las claves nuevas que pide el punto 12: `og_image_url`, `seo_keywords`, `social_tiktok` (ya existen `social_instagram`/`social_facebook`). No hace falta ningún modelo nuevo para esto.

---

## 12. Sistema de imágenes

Ya cumple el punto 13 del pedido tal como quedó en la Fase 3 (subida, recorte, galería, reordenamiento, eliminación, compresión automática a WEBP, ALT). Lo único que se agrega es la **imagen de portada por categoría** (el campo `imageUrl` en `Category` ya existe en el schema pero hoy nada lo sube desde el panel — se conecta al mismo componente `SiteImageUploader` que ya se usa para el logo y el favicon) y, si se cargan variantes, la posibilidad de asociar una imagen de `ProductImage` a una variante específica (por ejemplo, la foto de la remera en color Azul).

---

## 13. URLs — arquitectura limpia (reemplaza los anchors)

| Ruta | Contenido |
|---|---|
| `/` | Home: hero, categorías, destacados, ofertas |
| `/productos` | Listado general, con filtros |
| `/categoria/[slug]` | Ej. `/categoria/remeras` |
| `/producto/[slug]` | Ej. `/producto/remera-dry-fit-sprint` |
| `/ofertas` | Productos con `onSale: true` |
| `/medios-de-pago` | Métodos activos, leídos de `PaymentMethod` |
| `/carrito` | Carrito actual |
| `/checkout` | Formulario de compra |
| `/checkout/gracias/[numero]` | Confirmación post-compra |
| `/contacto` | Datos de contacto (lo que hoy vive en el aside del hero) |
| `/admin/...` | Panel, como ya existe |

Cada `slug` se genera con la misma función `slugify` que ya usa el proyecto, y queda único por `@unique` en el schema — si dos productos generarían el mismo slug, se agrega un sufijo numérico automático.

---

## 14. Seguridad

- Ninguna clave (Mercado Pago, `ADMIN_SECRET`, `JWT`/secreto de sesión) vive en el código ni en la base de datos: todas van en `.env`, tal como ya lo hace el proyecto con `ADMIN_PASSWORD`.
- El webhook de Mercado Pago valida la firma (`x-signature` + `x-request-id`) antes de tocar la base — sin esto, cualquiera podría llamar a la URL del webhook y marcar pedidos como pagados sin haber pagado.
- El checkout nunca confía en precios ni stock que vengan del navegador: todo se recalcula server-side antes de crear el pedido.
- Rate limiting en `crearPedido` y en el webhook, con el mismo mecanismo simple en memoria que ya usa `/api/events`.
- Datos personales del cliente (`Customer`): se guardan porque son necesarios para el pedido (es una tienda real, no una landing), pero **no se usan con fines de analítica** — la analítica sigue siendo anónima (`AnalyticsEvent`) como hoy.

---

## 15. Plan de fases para ejecutar en Antigravity

Mismo criterio que se usó para construir Runa Sport: cada fase deja **algo que funciona de punta a punta**, no una mitad de feature.

### Fase 5 — Base de e-commerce (sin pagos todavía)
- Migración del schema (sección 3, sin `Discount` todavía).
- Páginas `/producto/[slug]` y `/categoria/[slug]` (reemplazan la grilla única de la home).
- Home rediseñada: hero + categorías en tarjetas + destacados.
- Header nuevo: buscador, ícono de carrito, sticky, menú hamburguesa.
- **Entregable:** se puede navegar todo el catálogo por URLs propias, con diseño mejorado, sin romper nada del panel admin existente.

### Fase 6 — Carrito
- Cookie de carrito + `/api/cart` + página `/carrito`.
- Botones "Agregar al carrito" y "Comprar ahora" en la página de producto.
- Feedback visual (toast, contador en el header).
- **Entregable:** carrito funcional de punta a punta, sin checkout todavía (el botón "Finalizar compra" puede ir directo a WhatsApp con el resumen, como paso intermedio).

### Fase 7 — Checkout y pedidos (con Efectivo/Transferencia primero, sin Mercado Pago)
- Modelos `Customer`, `Order`, `OrderItem`, `PaymentMethod` (sin campos de Mercado Pago activos todavía).
- Página `/checkout` completa.
- `/admin/pedidos` y `/admin/pedidos/[id]`.
- `/admin/clientes`.
- `/medios-de-pago` pública.
- **Entregable:** se puede comprar de verdad con Efectivo o Transferencia, y administrar esos pedidos desde el panel. Es la fase más grande — conviene no mezclarla con Mercado Pago para poder probarla sin depender de una cuenta externa.

### Fase 8 — Mercado Pago
- SDK oficial, variables de entorno (`MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_ACCESS_TOKEN`).
- `/api/pagos/mercadopago/crear-preferencia` y `/api/pagos/mercadopago/webhook` (con validación de firma).
- `/admin/pagos` con el indicador de estado de la integración.
- **Requiere que antes de esta fase exista una cuenta de Mercado Pago y sus credenciales**, cargadas por vos mismo en el `.env` del servidor — nunca pegadas en el chat ni en ningún documento.
- **Entregable:** pago real online funcionando, con actualización automática del estado del pedido.

### Fase 9 — Descuentos, ofertas, relacionados y SEO fino
- Modelo `Discount` + aplicación en carrito/checkout.
- `/ofertas`, campo `onSale`, productos relacionados en la ficha de producto.
- Imagen de portada por categoría, `og_image_url`, sitemap.xml, robots.txt (pendiente también en Runa Sport clásico).
- **Entregable:** las funciones "de negocio" que completan el pedido original.

Cada fase, al igual que en Runa Sport, debería incluir su propia migración de Prisma (`npx prisma migrate dev --name faseN`) sin tocar los datos ya cargados, y quedar documentada con instrucciones de instalación para Windows PowerShell, igual que los README anteriores.

---

## 16. Variables de entorno nuevas (a sumar a `.env.example`)

```
# --- Mercado Pago (Fase 8) ---
MERCADOPAGO_PUBLIC_KEY=""
MERCADOPAGO_ACCESS_TOKEN=""
MERCADOPAGO_WEBHOOK_SECRET=""

# --- Numeración de pedidos (Fase 7) ---
ORDER_PREFIX="RS"
```

---

## 17. Resumen para pasarle a Antigravity

Si se le da este documento fase por fase a Antigravity, el orden recomendado de prompts es: **Fase 5 → probar → Fase 6 → probar → Fase 7 → probar con pagos manuales → crear cuenta de Mercado Pago y cargar credenciales → Fase 8 → probar un pago real de prueba (sandbox) → Fase 9.** No conviene pedirle las fases 7 y 8 juntas: mezclar "pedidos" con "Mercado Pago" en un mismo tiro es la combinación más propensa a errores difíciles de depurar (plata real de por medio), y separarlas permite validar que los pedidos funcionan antes de sumar la dependencia externa.
