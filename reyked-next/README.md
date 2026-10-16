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

## Pendiente (definir con la clienta)

Pasarela de pago (hoy: confirmación por WhatsApp), textos finales de Envíos y Cambios, logo vectorial y fotos, listado real de productos (Excel → `data/productos.ts`, usar `next/image`), emisión electrónica de boleta/factura y correos de confirmación, dominio y DNS en nic.cl.

## Estructura

- `app/globals.css`: CSS del prototipo sin cambios (tokens, claro/oscuro, animaciones, `prefers-reduced-motion`).
- `app/(tienda)/`: páginas públicas con cabecera/pie/carrito. `app/admin/`: panel. `app/api/`: pedidos y API del panel.
- `data/productos.ts`: categorías y productos (precios de EJEMPLO, neto CLP; IVA 19 % se suma).
- `lib/server/`: almacenamiento (archivo / Redis), sesión y reglas de pedidos.
