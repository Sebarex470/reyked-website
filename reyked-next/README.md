# Reyked · Next.js (App Router + TypeScript)

Migración del prototipo `reyked-rediseno.html` según `BRIEF-reyked.md`.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Estado

| Ruta | Estado |
|---|---|
| `/` Inicio | listo |
| `/tienda`, `/tienda/[categoria]` | listo (filtro por categoría, orden, búsqueda por URL `?q=&sort=`) |
| `/producto/[id]`, `/carrito`, `/checkout`, `/pedido` | pendiente |
| `/nosotros`, `/envios`, `/cambios`, `/contacto` | pendiente |

## Estructura

- `app/globals.css`: CSS del prototipo copiado sin cambios (tokens, modo claro/oscuro, animaciones, `prefers-reduced-motion`).
- `data/productos.ts`: categorías y productos (precios de EJEMPLO, neto CLP; IVA 19 % se suma).
- `context/CartContext.tsx`: carrito (Context + localStorage con try/catch) y avisos.
- Fuentes: Barlow Condensed, Barlow e IBM Plex Mono vía `@fontsource` (autoalojadas, sin pedir nada a Google).
