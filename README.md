# REYKED Higiene & Seguridad

Sitio web con catálogo, carrito, "Mi cuenta" y pagos con **Mercado Pago (Checkout Pro)**.
Servidor Node sin dependencias (Node >= 18).

## Puesta en marcha

```bash
cp .env.example .env     # completa MP_ACCESS_TOKEN y PUBLIC_URL
npm start                # http://localhost:3000
```

| Variable | Descripción |
|---|---|
| `MP_ACCESS_TOKEN` | Access Token de Mercado Pago (Tus integraciones > Credenciales). `TEST-...` para pruebas. |
| `PUBLIC_URL` | URL pública del sitio. En producción debe ser `https://` (webhook y retorno automático lo exigen). |
| `MP_WEBHOOK_SECRET` | Clave secreta del webhook (recomendado): el servidor valida la firma `x-signature`. |

En el panel de Mercado Pago configura el webhook: `https://TU-DOMINIO/api/pagos/webhook`, evento **Pagos**.

## Cómo funciona

1. El navegador envía solo `id` y `cantidad` de cada producto (`POST /api/pagos/crear`).
2. El servidor valida todo, calcula el total con los precios de `products.json` (nunca confía en el cliente), guarda el pedido y crea la preferencia en Mercado Pago.
3. El cliente paga en Mercado Pago (los datos de tarjeta jamás pasan por este sitio) y vuelve a `/?pago=...&pedido=...`.
4. Mercado Pago llama al webhook; el servidor consulta el pago directo a la API de MP, verifica monto y moneda, y marca el pedido como **Pagado**.
5. "Mi cuenta" lee el estado desde `GET /api/pedidos/:id` (solo estado y total).

Los pedidos se guardan en `data/orders.json` (ahí ve tu clienta nombre, contacto y detalle de cada compra). Para varios servidores o más volumen, cambia ese archivo por una base de datos.

## Catálogo y precios

Edita `products.json`. Los precios son de ejemplo hasta que la clienta entregue los reales.

## Notas

- Transferencia bancaria registra el pedido como "Pendiente de transferencia"; hay que confirmarlo a mano y los datos bancarios se envían por correo/WhatsApp.
- Webpay (Transbank) no está incluido: requiere su propia integración y contrato.
- "Mi cuenta" (presupuesto y margen de ganancia) se guarda en el navegador de cada cliente.
