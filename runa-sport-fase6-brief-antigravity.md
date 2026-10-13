# Runa Sport — Brief de ejecución: FASE 6
### Carrito de compras

> Para pegar directamente en Antigravity, sobre el repo ya actualizado con la Fase 5 (rutas públicas `/producto/[slug]`, `/categoria/[slug]`, `/productos`, header nuevo con ícono de carrito sin funcionalidad).

---

## Objetivo de esta fase

Carrito funcional de punta a punta: agregar, modificar cantidad, quitar, ver subtotal/total, validado siempre contra la base de datos real (nunca contra lo que diga el navegador). Todavía **sin checkout ni pagos** — el botón "Finalizar compra" al final de esta fase puede llevar a un `/checkout` placeholder simple, o directo a WhatsApp con el resumen del pedido (a elección de Antigravity, pero debe quedar claro en el commit cuál de las dos se hizo, porque condiciona el arranque de la Fase 7).

## Qué NO tocar

- Nada de `app/admin/**`, `lib/auth.js`, `lib/actions.js`, `lib/perms.js`.
- El schema de Prisma **no cambia en esta fase** (no hace falta ningún modelo nuevo: el carrito vive en una cookie, no en la base). No correr migraciones.
- Las páginas de producto/categoría/home de la Fase 5 se **extienden**, no se reescriben.

## Decisión de diseño (ya tomada, no rediscutir)

El carrito se guarda en una **cookie** (`rs_cart`), no en localStorage ni sessionStorage. Contenido: únicamente `[{ productId, variantId: null, qty }]` — nunca precios, nunca nombres, nunca datos personales. El precio y el stock **se recalculan siempre en el servidor** a partir de esos IDs, tanto para mostrar el carrito como para cualquier paso posterior. Esto es intencional (ver el documento de arquitectura general): así un precio desactualizado en el navegador nunca se termina cobrando.

## Qué se hace

### 1. `lib/cart.js` (nuevo)

Funciones:
- `readCartCookie()`: lee la cookie `rs_cart` del request, parsea el JSON, devuelve `[]` si no existe o está corrupta (nunca debe tirar un error 500 por una cookie rota).
- `resolveCart(items)`: recibe el array crudo de la cookie, busca cada `productId` en la base (`db.product.findMany` con `include: inventory, images`), descarta los que ya no existen o no están `PUBLISHED`, recalcula `qty` contra el stock disponible (si alguien tenía 5 en el carrito y ahora solo hay 2, lo baja a 2 y lo marca para avisar en la UI), y devuelve: `{ items: [...con nombre, precio, imagen, qty, subtotal...], subtotal, total, ajustado: boolean }`. `ajustado: true` indica que algo cambió respecto a lo que pedía la cookie (para mostrar un aviso tipo "Ajustamos la cantidad de X por stock disponible").
- `writeCartCookie(response, items)`: escribe la cookie (JSON de `[{productId, qty}]` solamente, sin los datos resueltos).

### 2. Route Handler `/api/cart`

`app/api/cart/route.js`:

- **GET**: lee la cookie, llama a `resolveCart`, devuelve el carrito resuelto en JSON. Lo usa el header para el contador y la página `/carrito` para el primer render si se quiere hacer client-side (aunque `/carrito` como Server Component puede leer la cookie directamente sin pasar por este endpoint — ver punto 4).
- **POST**: recibe `{ action: 'add' | 'set' | 'remove', productId, qty }`.
  - `add`: suma `qty` a lo que ya hubiera de ese producto (si no estaba, lo agrega).
  - `set`: fija la cantidad exacta (para los inputs de "+"/"-"/cantidad manual en `/carrito`, mismo patrón UX que ya usa `/admin/stock`).
  - `remove`: saca el producto del carrito.
  - En los tres casos: valida `qty` como entero positivo razonable (mismo criterio que ya usan las Server Actions del admin, ej. `stock/adjustStock`), vuelve a resolver contra la base para no permitir pedir más que el stock disponible, escribe la cookie actualizada, y devuelve el carrito resuelto actualizado (así el cliente no necesita un segundo round-trip).
  - Body vacío o `action` inválida → 400, nunca 500.

### 3. Componente de carrito en el header

`components/shop/CartIcon.jsx` (client component): al montar, pide `GET /api/cart` y muestra la cantidad total de ítems como badge sobre el ícono (mismo patrón visual que la campana 🔔 de notificaciones del admin — reutilizar esa clase CSS `.bellcount` si aplica, renombrada o compartida). Al hacer click, navega a `/carrito`. No hace falta un dropdown/mini-carrito flotante en esta fase — eso es un lindo agregado pero no está pedido, y sumarlo ahora es scope extra que puede esperar a una fase de pulido.

### 4. Página `/carrito`

`app/(public)/carrito/page.jsx`. Server Component que lee la cookie (vía `cookies()` de `next/headers`) y llama a `resolveCart` directamente (sin pasar por HTTP, más simple y rápido que golpear su propio endpoint). Por cada ítem:
- Imagen, nombre (link a `/producto/[slug]`), precio unitario, cantidad con controles +/- y opción de tipear un número (mismo componente de cantidad que ya existe en `/admin/stock`, adaptado a client component porque acá necesita optimistic update sin recargar toda la página), subtotal de esa línea, botón "Quitar".
- Si `ajustado` es `true` en algún ítem: aviso visible tipo "Ajustamos [Producto] a 2 unidades porque es el stock disponible."
- Resumen: subtotal, envío (por ahora fijo en $0 o "A coordinar" — el cálculo real de envío es parte del checkout en la Fase 7, no de esta), total.
- Botón "Finalizar compra": ver la decisión de diseño más abajo.
- Carrito vacío: mensaje + link a `/productos`, no un error ni una tabla vacía fea.
- Las acciones de +/-/quitar llaman a `POST /api/cart` desde el cliente y refrescan el estado local con la respuesta (no hace falta recargar toda la página, pero si Antigravity prefiere usar `router.refresh()` de Next también es válido y más simple — priorizar simplicidad sobre optimismo si el tiempo apremia).

### 5. Botones en la página de producto

En `/producto/[slug]` (de la Fase 5), agregar debajo del botón de WhatsApp:
- **"Agregar al carrito"**: llama a `POST /api/cart` con `action: 'add'`, muestra una confirmación breve (toast simple, puede ser un `<div>` que aparece y desaparece con CSS, sin librería nueva) y actualiza el badge del header.
- **"Comprar ahora"**: agrega al carrito igual que el anterior y navega directo a `/carrito` (no a checkout todavía, porque checkout no existe hasta la Fase 7).
- Si `stock === 0`: ambos botones deshabilitados, mismo criterio visual que ya usa `Catalog.jsx` para "Sin stock".
- Si el producto tiene talles/colores cargados: por ahora, sin selector obligatorio de variante (eso depende de si la Fase 9 llega a implementar `ProductVariant` con stock propio). Que el carrito guarde el producto en general alcanza para esta fase.

### 6. "Finalizar compra" — decisión a tomar por Antigravity

Elegir **una** de estas dos, dejando anotado cuál en el commit/README, porque cambia el punto de partida de la Fase 7:

- **Opción A (recomendada para esta fase):** el botón arma un mensaje de WhatsApp con el resumen del carrito (productos, cantidades, total) usando la misma plantilla/mecanismo que ya existe para consultas individuales, y abre `wa.me`. Es el "cumple ya, mejora después" — la tienda puede operar con esto mientras se construye el checkout real.
- **Opción B:** el botón navega a un `/checkout` placeholder ("Estamos preparando el checkout, mientras tanto escribinos por WhatsApp" con el mismo link). Sirve si se prefiere dejar la URL `/checkout` reservada desde ya.

### 7. Tracking

Agregar los tipos de evento `agregar_carrito` y `finalizar_compra_wa` (u homólogo según la opción elegida en el punto 6) al `Set` de tipos permitidos en `app/api/events/route.js`, siguiendo el mismo patrón que los eventos existentes (`consulta`, `filtro`, etc.).

## Checklist de aceptación

- [ ] Agregar un producto desde `/producto/[slug]` actualiza el badge del header sin recargar la página.
- [ ] `/carrito` muestra los productos agregados, con imagen, precio y cantidad correctos.
- [ ] Cambiar la cantidad desde `/carrito` (+, -, y tipeando un número) actualiza el subtotal y el total correctamente.
- [ ] Pedir más cantidad que el stock disponible: el sistema la ajusta automáticamente y avisa, no permite pasarse.
- [ ] Quitar un producto lo saca del carrito y, si era el último, se ve el estado de carrito vacío.
- [ ] Cerrar el navegador y volver a abrirlo (o refrescar fuerte) conserva el carrito — confirma que la cookie persiste.
- [ ] Un producto con `stock: 0` no se puede agregar.
- [ ] "Finalizar compra" hace lo que se haya decidido en el punto 6, sin romper.
- [ ] **El panel `/admin` y todo lo de las Fases 1-5 sigue funcionando igual.**
- [ ] Si se cambia el stock de un producto desde `/admin/stock` mientras está en el carrito de otra pestaña, al volver a `/carrito` se refleja el ajuste (no hace falta que sea instantáneo/tiempo real, alcanza con que se corrija al recargar `/carrito`).

## Instrucciones para vos (después de que Antigravity termine esta fase)

Tampoco hace falta migración de base en esta fase (el carrito es cookie, no tabla). En PowerShell, en la carpeta del proyecto:

```powershell
npm install   # solo si se agregó alguna dependencia nueva
npm run dev
```

Y probar el checklist de arriba, prestando especial atención a los dos puntos de stock (son los que más fácil se rompen) antes de pedir la Fase 7.
