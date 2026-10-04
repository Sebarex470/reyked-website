'use strict';
/* Servidor REYKED: sirve el sitio y procesa pagos con Mercado Pago Checkout Pro.
   Sin dependencias (Node >= 18). Los precios se leen SIEMPRE de products.json. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/* --- .env mínimo --- */
try {
  for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
} catch { /* sin .env */ }

const { MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET } = process.env;
const PORT = +process.env.PORT || 3000;
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const HTTPS = PUBLIC_URL.startsWith('https://');
const MP = process.env.MP_API_URL || 'https://api.mercadopago.com';

const ROOT = __dirname;
const PRODUCTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'products.json'), 'utf8'));
const byId = id => PRODUCTS.find(p => p.id === id);

/* --- pedidos en data/orders.json --- */
const DATA = path.join(ROOT, 'data');
const FILE = path.join(DATA, 'orders.json');
fs.mkdirSync(DATA, { recursive: true });
let orders = {};
try { orders = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { /* nuevo */ }
const save = () => fs.writeFileSync(FILE, JSON.stringify(orders, null, 2));

/* --- utilidades --- */
const send = (res, code, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(code, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};
const readBody = req => new Promise((resolve, reject) => {
  let n = 0; const chunks = [];
  req.on('data', c => { n += c.length; if (n > 100_000) { reject(new Error('Cuerpo demasiado grande')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', reject);
});
const str = (v, max) => typeof v === 'string' ? v.trim().slice(0, max) : '';

function validate(b) {
  if (!b || !Array.isArray(b.items) || !b.items.length || b.items.length > 50) return 'Carrito inválido.';
  const items = [];
  for (const it of b.items) {
    const p = byId(it?.id);
    if (!p) return 'Producto no existe.';
    if (!Number.isInteger(it.qty) || it.qty < 1 || it.qty > 999) return 'Cantidad inválida.';
    items.push({ id: p.id, name: p.name, qty: it.qty, price: p.price });
  }
  const c = b.cliente || {};
  const cliente = { nombre: str(c.nombre, 100), email: str(c.email, 120), tel: str(c.tel, 30), dir: str(c.dir, 200) };
  if (!cliente.nombre || !cliente.dir || !cliente.tel || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cliente.email)) return 'Datos del cliente incompletos.';
  if (!['local', 'region', 'retiro'].includes(b.entrega)) return 'Tipo de entrega inválido.';
  if (!['mercadopago', 'transferencia'].includes(b.metodo)) return 'Método de pago inválido.';
  return { items, cliente, entrega: b.entrega, metodo: b.metodo };
}

async function mp(pathname, opts = {}) {
  const r = await fetch(MP + pathname, { ...opts, headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json', ...opts.headers } });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Mercado Pago ${r.status}: ${data.message || 'error'}`);
  return data;
}

/* --- POST /api/pagos/crear --- */
async function crear(req, res) {
  let b; try { b = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'JSON inválido.' }); }
  const v = validate(b);
  if (typeof v === 'string') return send(res, 400, { error: v });

  const order = {
    id: 'RK-' + crypto.randomBytes(5).toString('hex').toUpperCase(),
    fecha: new Date().toISOString(),
    items: v.items, cliente: v.cliente, entrega: v.entrega, metodo: v.metodo,
    total: v.items.reduce((s, i) => s + i.price * i.qty, 0),
    estado: v.metodo === 'transferencia' ? 'Pendiente de transferencia' : 'Pendiente de pago'
  };

  if (v.metodo === 'transferencia') {
    orders[order.id] = order; save();
    return send(res, 200, { pedido: order.id, estado: order.estado });
  }
  if (!MP_ACCESS_TOKEN) return send(res, 503, { error: 'Pagos no configurados (falta MP_ACCESS_TOKEN).' });

  const back = r => `${PUBLIC_URL}/?pago=${r}&pedido=${order.id}`;
  const pref = {
    items: order.items.map(i => ({ id: i.id, title: i.name, quantity: i.qty, unit_price: i.price, currency_id: 'CLP' })),
    payer: { name: order.cliente.nombre, email: order.cliente.email },
    external_reference: order.id,
    back_urls: { success: back('ok'), pending: back('pending'), failure: back('failure') },
    statement_descriptor: 'REYKED'
  };
  if (HTTPS) { pref.auto_return = 'approved'; pref.notification_url = `${PUBLIC_URL}/api/pagos/webhook`; }
  try {
    const r = await mp('/checkout/preferences', { method: 'POST', body: JSON.stringify(pref) });
    order.preferenceId = r.id;
    orders[order.id] = order; save();
    // Con credenciales de prueba MP entrega sandbox_init_point; con las reales, init_point.
    const url = MP_ACCESS_TOKEN.startsWith('TEST-') ? (r.sandbox_init_point || r.init_point) : r.init_point;
    send(res, 200, { pedido: order.id, url });
  } catch (e) {
    console.error(e.message);
    send(res, 502, { error: 'No se pudo iniciar el pago con Mercado Pago.' });
  }
}

/* --- POST /api/pagos/webhook --- */
function signatureOk(req, dataId) {
  if (!MP_WEBHOOK_SECRET) return true; // sin secreto configurado no se puede verificar
  const sig = String(req.headers['x-signature'] || '');
  const ts = (sig.match(/ts=([^,]+)/) || [])[1], v1 = (sig.match(/v1=([^,]+)/) || [])[1];
  if (!ts || !v1) return false;
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${req.headers['x-request-id'] || ''};ts:${ts};`;
  const mac = crypto.createHmac('sha256', MP_WEBHOOK_SECRET).update(manifest).digest('hex');
  return mac.length === v1.length && crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(v1));
}
const ESTADOS = { approved: 'Pagado', authorized: 'Pagado', pending: 'Pendiente de pago', in_process: 'Pendiente de pago', in_mediation: 'Pendiente de pago', rejected: 'Rechazado', cancelled: 'Cancelado', refunded: 'Reembolsado', charged_back: 'Contracargo' };

async function webhook(req, res, url) {
  let body = {}; try { body = JSON.parse(await readBody(req) || '{}'); } catch { /* query-only */ }
  const type = url.searchParams.get('type') || url.searchParams.get('topic') || body.type;
  const id = url.searchParams.get('data.id') || url.searchParams.get('id') || body.data?.id;
  if (type !== 'payment' || !id) return send(res, 200, { ok: true }); // otros eventos: ignorar
  if (!signatureOk(req, id)) return send(res, 401, { error: 'Firma inválida.' });
  send(res, 200, { ok: true }); // responder rápido; MP reintenta si no recibe 200
  try {
    // No se confía en el cuerpo recibido: se consulta el pago directo a Mercado Pago.
    const pay = await mp(`/v1/payments/${encodeURIComponent(id)}`);
    const order = orders[pay.external_reference];
    if (!order) return;
    if (pay.currency_id !== 'CLP' || Math.round(pay.transaction_amount) !== order.total) {
      console.error(`Monto no coincide en ${order.id}`); order.estado = 'Revisar monto'; return save();
    }
    order.estado = ESTADOS[pay.status] || order.estado;
    order.mpPaymentId = pay.id; save();
  } catch (e) { console.error('webhook:', e.message); }
}

/* --- estáticos (lista blanca) --- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const PUBLIC_FILES = new Set(['index.html', 'styles.css', 'app.js', 'products.json']);
function serveStatic(res, pathname) {
  const rel = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  const full = path.resolve(ROOT, rel);
  const ok = PUBLIC_FILES.has(rel) || (rel.startsWith('assets/') && full.startsWith(path.join(ROOT, 'assets') + path.sep));
  if (!ok) return send(res, 404, 'No encontrado', 'text/plain; charset=utf-8');
  fs.readFile(full, (err, buf) => err ? send(res, 404, 'No encontrado', 'text/plain; charset=utf-8') : send(res, 200, buf, TYPES[path.extname(full)] || 'application/octet-stream'));
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, PUBLIC_URL);
  try {
    if (req.method === 'POST' && url.pathname === '/api/pagos/crear') return await crear(req, res);
    if (req.method === 'POST' && url.pathname === '/api/pagos/webhook') return await webhook(req, res, url);
    const m = url.pathname.match(/^\/api\/pedidos\/(RK-[A-F0-9]{10})$/);
    if (req.method === 'GET' && m) {
      const o = orders[m[1]]; // solo estado y total: sin datos personales
      return o ? send(res, 200, { id: o.id, estado: o.estado, total: o.total }) : send(res, 404, { error: 'No existe.' });
    }
    if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(res, url.pathname);
    send(res, 405, { error: 'Método no permitido.' });
  } catch (e) { console.error(e); if (!res.headersSent) send(res, 500, { error: 'Error interno.' }); }
}).listen(PORT, () => console.log(`REYKED en ${PUBLIC_URL} (MP: ${MP_ACCESS_TOKEN ? 'configurado' : 'SIN TOKEN'})`));
