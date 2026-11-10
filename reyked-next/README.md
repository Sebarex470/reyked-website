# Reyked · Next.js (App Router + TypeScript)

Migración del prototipo `reyked-rediseno.html` según `BRIEF-reyked.md`, más un panel de administración.

```bash
npm install
cp .env.example .env.local   # completar (ver abajo)
npm run dev                  # http://localhost:3000
npm run build && npm start
```

## Rutas

| Ruta | Descripción |
|---|---|
| `/`, `/tienda`, `/tienda/[categoria]`, `/producto/[id]` | Tienda (filtros, orden y búsqueda por URL `?q=&sort=`) |
| `/carrito`, `/checkout`, `/pedido` | Compra. El pedido se **guarda en el servidor** (precios y totales se recalculan allí) y se confirma por WhatsApp |
| `/nosotros`, `/envios`, `/cambios`, `/contacto` | Información |
| `/admin` | Panel de administración (login) |

SEO: metadata por página, `sitemap.xml`, `robots.txt`, datos estructurados `Product` y redirecciones desde URLs típicas de WooCommerce (`next.config.ts`; **verificar contra las URLs reales de reyked.cl**).

## Panel `/admin`

Sesión de 8 h en cookie firmada (`HttpOnly`, `SameSite=Strict`), bloqueo de 15 min tras 5 intentos fallidos y cabecera anti-CSRF en cada cambio.

- **Resumen:** ventas netas, utilidad, pedidos por confirmar/despachar, pagos por cobrar, documentos por emitir.
- **Pedidos:** datos del cliente, estado del pedido y del pago, medio de pago, notas, CSV.
- **Dinero:** resultado por mes (ventas − costo − gastos), IVA estimado (referencial: confirmar con el contador), presupuesto mensual y registro de gastos (con o sin IVA).
- **Facturas:** control de boleta/factura por pedido (tipo, estado, número, fecha, enlace al PDF). **No emite en el SII**: se emite en el sistema de facturación elegido y se registra aquí. La integración automática queda pendiente (brief, punto 4).
- **Clientes:** compras por cliente.
- **Productos:** costo neto por producto para calcular ganancias. Si un pedido no guardó costo, se usa el costo actual.

## Variables de entorno

Ver `.env.example`. Las claves van **solo** en `.env.local` o en Vercel, nunca en el código.

- `ADMIN_PASSWORD` y `SESSION_SECRET` (≥ 32 caracteres) habilitan el panel.
- **Base de datos:** en Vercel el disco no es persistente. Conectar **Upstash Redis** desde el Marketplace (define `UPSTASH_REDIS_REST_URL/TOKEN`). Sin eso, en Vercel los pedidos y el panel responden con error en vez de perder datos. En local se guardan en `.data/`.

## Catálogo (Excel → tienda)

El catálogo real sale del Excel de Reyked. Para actualizarlo (precios, stock, fotos o productos nuevos):

```bash
npm run catalogo -- ruta/Catalogo_Productos.xlsm          # añade --incluir-sin-datos para publicar también los productos sin precio ni stock
```

Genera `data/catalogo.json` y las fotos en `public/productos/*.webp` (optimizadas, 640 px). Luego `git commit` y `git push`: Vercel publica solo.

- Columnas: CÓDIGO, NOMBRE, STOCK, PRECIO DE VENTA (**neto**; el IVA 19 % se suma) e IMAGEN (fotos pegadas sobre la fila).
- Una fila con la palabra **"eliminar"** en una columna de notas (E a H) no se publica. Los productos sin precio **y** sin stock tampoco; ambas listas quedan en `data/catalogo-omitidos.json`.
- Sin precio pero con stock → "Precio a consultar" (cotizar). Con precio y sin stock → "Agotado" (consultar disponibilidad). La compra respeta el stock, también en el servidor.
- El Excel **no trae categorías**: se asignan por palabras clave en `scripts/importar-catalogo.mjs` (tabla `REGLAS`). Para corregir una, cambia la regla y vuelve a importar. Las categorías sin productos no aparecen en menús ni rutas.
- Los nombres se normalizan (de MAYÚSCULAS a título, algunas tildes comunes). Los datos del Excel no se modifican.
- El stock es el del Excel: no baja solo con cada pedido. Se actualiza reimportando.

## Pendiente (definir con la clienta)

Pasarela de pago (hoy: confirmación por WhatsApp), textos finales de Envíos y Cambios, logo vectorial y fotos, emisión electrónica de boleta/factura y correos de confirmación, dominio y DNS en nic.cl.

## Estructura

- `app/globals.css`: CSS del prototipo sin cambios (tokens, claro/oscuro, animaciones, `prefers-reduced-motion`).
- `app/(tienda)/`: páginas públicas con cabecera/pie/carrito. `app/admin/`: panel. `app/api/`: pedidos y API del panel.
- `data/productos.ts`: tipos y categorías; lee `data/catalogo.json` (generado desde el Excel).
- `lib/server/`: almacenamiento (archivo / Redis), sesión y reglas de pedidos.
