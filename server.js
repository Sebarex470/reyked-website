'use strict';
/* Servidor REYKED: sitio, pagos Mercado Pago (Checkout Pro) y panel de administración.
   Sin dependencias (Node >= 18). Los precios se leen SIEMPRE del catálogo del servidor. */
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

const { MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, ADMIN_USER = 'admin', ADMIN_PASSWORD } = process.env;
const PORT = +process.env.PORT || 3000;
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const HTTPS = PUBLIC_URL.startsWith('https://');
const MP = process.env.MP_API_URL || 'https://api.mercadopago.com';
const ROOT = __dirname;

/* --- almacenamiento en data/*.json (escritura atómica) --- */
const DATA = path.join(ROOT, 'data');
fs.mkdirSync(DATA, { recursive: true });
const load = (name, def) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8')); } catch { return def; } };
const persist = (name, v) => { const f = path.join(DATA, name); fs.writeFileSync(f + '.tmp', JSON.stringify(v, null, 2)); fs.renameSync(f + '.tmp', f); };

const CATS = ['aseo', 'seguridad', 'logistica', 'pisos'];
let products = load('products.json', null);
if (!products) { // primera ejecución: sembrar desde products.json
  products = JSON.parse(fs.readFileSync(path.join(ROOT, 'products.json'), 'utf8')).map(p => ({ ...p, cost: 0, stock: null, active: true }));
  persist('products.json', products);
}
let orders = load('orders.json', {});
let expenses = load('expenses.json', []);
let settings = load('settings.json', { presupuesto: 0 });
const byId = id => products.find(p => p.id === id);

const ESTADOS = ['Pendiente de pago', 'Pendiente de transferencia', 'Pagado', 'Preparando', 'Despachado', 'Entregado', 'Cancelado', 'Rechazado', 'Reembolsado', 'Contracargo', 'Revisar monto'];
const PAID = new Set(['Pagado', 'Preparando', 'Despachado', 'Entregado']);

/* --- utilidades --- */
const send = (res, code, body, type = 'application/json; charset=utf-8', extra = {}) => {
  res.writeHead(code, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', ...(type.startsWith('application/json') ? { 'Cache-Control': 'no-store' } : {}), ...extra });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};
const readBody = req => new Promise((resolve, reject) => {
  let n = 0; const chunks = [];
  req.on('data', c => { n += c.length; if (n > 100_000) { reject(new Error('Cuerpo demasiado grande')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', reject);
});
const json = async req => { try { return JSON.parse(await readBody(req) || '{}'); } catch { return null; } };
const str = (v, max) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const int = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const monthKey = iso => String(iso).slice(0, 7);

/* --- stock: se descuenta al confirmarse el pago y se repone si se anula --- */
function setEstado(order, estado) {
  const wasPaid = order.stockDescontado;
  order.estado = estado;
  if (PAID.has(estado) && !wasPaid) {
    for (const i of order.items) { const p = byId(i.id); if (p && p.stock !== null) p.stock = Math.max(0, p.stock - i.qty); }
    order.stockDescontado = true; persist('products.json', products);
  } else if (['Cancelado', 'Reembolsado', 'Contracargo'].includes(estado) && wasPaid) {
    for (const i of order.items) { const p = byId(i.id); if (p && p.stock !== null) p.stock += i.qty; }
    order.stockDescontado = false; persist('products.json', products);
  }
  persist('orders.json', orders);
}

/* ========== Catálogo público ========== */
const publicProducts = () => products.filter(p => p.active).map(({ id, code, cat, name, desc, price, stock }) => ({ id, code, cat, name, desc, price, agotado: stock !== null && stock <= 0 }));

/* ========== Pedidos / Mercado Pago ========== */
function validate(b) {
  if (!b || !Array.isArray(b.items) || !b.items.length || b.items.length > 50) return 'Carrito inválido.';
  const items = [];
  for (const it of b.items) {
    const p = byId(it?.id);
    if (!p || !p.active) return 'Un producto ya no está disponible.';
    if (!int(it.qty, 1, 999)) return 'Cantidad inválida.';
    if (p.stock !== null && it.qty > p.stock) return `Stock insuficiente de "${p.name}" (quedan ${p.stock}).`;
    items.push({ id: p.id, name: p.name, qty: it.qty, price: p.price, cost: p.cost || 0 });
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

async function crear(req, res) {
  const b = await json(req); if (!b) return send(res, 400, { error: 'JSON inválido.' });
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
    orders[order.id] = order; persist('orders.json', orders);
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
    orders[order.id] = order; persist('orders.json', orders);
    const url = MP_ACCESS_TOKEN.startsWith('TEST-') ? (r.sandbox_init_point || r.init_point) : r.init_point;
    send(res, 200, { pedido: order.id, url });
  } catch (e) { console.error(e.message); send(res, 502, { error: 'No se pudo iniciar el pago con Mercado Pago.' }); }
}

function signatureOk(req, dataId) {
  if (!MP_WEBHOOK_SECRET) return true;
  const sig = String(req.headers['x-signature'] || '');
  const ts = (sig.match(/ts=([^,]+)/) || [])[1], v1 = (sig.match(/v1=([^,]+)/) || [])[1];
  if (!ts || !v1) return false;
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${req.headers['x-request-id'] || ''};ts:${ts};`;
  const mac = crypto.createHmac('sha256', MP_WEBHOOK_SECRET).update(manifest).digest('hex');
  return mac.length === v1.length && crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(v1));
}
const MP_ESTADOS = { approved: 'Pagado', authorized: 'Pagado', pending: 'Pendiente de pago', in_process: 'Pendiente de pago', in_mediation: 'Pendiente de pago', rejected: 'Rechazado', cancelled: 'Cancelado', refunded: 'Reembolsado', charged_back: 'Contracargo' };
const ADVANCED = new Set(['Preparando', 'Despachado', 'Entregado']);

async function webhook(req, res, url) {
  const body = await json(req) || {};
  const type = url.searchParams.get('type') || url.searchParams.get('topic') || body.type;
  const id = url.searchParams.get('data.id') || url.searchParams.get('id') || body.data?.id;
  if (type !== 'payment' || !id) return send(res, 200, { ok: true });
  if (!signatureOk(req, id)) return send(res, 401, { error: 'Firma inválida.' });
  send(res, 200, { ok: true });
  try {
    const pay = await mp(`/v1/payments/${encodeURIComponent(id)}`); // no se confía en el cuerpo recibido
    const order = orders[pay.external_reference];
    if (!order) return;
    if (pay.currency_id !== 'CLP' || Math.round(pay.transaction_amount) !== order.total) {
      console.error(`Monto no coincide en ${order.id}`); return setEstado(order, 'Revisar monto');
    }
    order.mpPaymentId = pay.id;
    const nuevo = MP_ESTADOS[pay.status];
    if (nuevo && !(nuevo === 'Pagado' && ADVANCED.has(order.estado))) setEstado(order, nuevo); else persist('orders.json', orders);
  } catch (e) { console.error('webhook:', e.message); }
}

/* ========== Administración ========== */
const sessions = new Map(); // token -> { exp }
const fails = new Map();    // ip -> { n, until }
const digest = s => crypto.createHash('sha256').update(String(s)).digest();
const COOKIE = 'rk_sess';

function sessionOf(req) {
  const m = (req.headers.cookie || '').match(/(?:^|;\s*)rk_sess=([a-f0-9]{64})/);
  if (!m) return null;
  const s = sessions.get(m[1]);
  if (s && s.exp > Date.now()) return { token: m[1], ...s };
  sessions.delete(m[1]); return null;
}
const cookie = (v, age) => `${COOKIE}=${v}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${HTTPS ? '; Secure' : ''}`;

async function login(req, res) {
  if (!ADMIN_PASSWORD) return send(res, 503, { error: 'Administración no configurada (falta ADMIN_PASSWORD).' });
  const ip = req.socket.remoteAddress, f = fails.get(ip);
  if (f && f.n >= 5 && f.until > Date.now()) return send(res, 429, { error: 'Demasiados intentos. Espera 15 minutos.' });
  const b = await json(req) || {};
  const ok = crypto.timingSafeEqual(digest(b.user), digest(ADMIN_USER)) & crypto.timingSafeEqual(digest(b.password), digest(ADMIN_PASSWORD));
  if (!ok) { fails.set(ip, { n: (f && f.until > Date.now() ? f.n : 0) + 1, until: Date.now() + 15 * 60_000 }); return send(res, 401, { error: 'Usuario o contraseña incorrectos.' }); }
  fails.delete(ip);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { exp: Date.now() + 8 * 3600_000 });
  send(res, 200, { ok: true }, undefined, { 'Set-Cookie': cookie(token, 8 * 3600) });
}

function cleanProduct(b, base = {}) {
  const name = str(b.name, 120), desc = str(b.desc, 300);
  if (!name) return 'El nombre es obligatorio.';
  if (!CATS.includes(b.cat)) return 'Categoría inválida.';
  if (!int(b.price, 0, 100_000_000) || !int(b.cost, 0, 100_000_000)) return 'Precio y costo deben ser números enteros positivos.';
  if (!(b.stock === null || int(b.stock, 0, 1_000_000))) return 'Stock inválido.';
  return { ...base, name, desc, cat: b.cat, price: b.price, cost: b.cost, stock: b.stock, active: b.active !== false };
}

function resumen() {
  const now = new Date(), keys = [];
  for (let i = 5; i >= 0; i--) keys.push(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)).toISOString().slice(0, 7));
  const m = Object.fromEntries(keys.map(k => [k, { mes: k, ventas: 0, costo: 0, gastos: 0, pedidos: 0 }]));
  for (const o of Object.values(orders)) {
    const r = m[monthKey(o.fecha)]; if (!r || !PAID.has(o.estado)) continue;
    r.ventas += o.total; r.pedidos++; r.costo += o.items.reduce((s, i) => s + (i.cost || 0) * i.qty, 0);
  }
  for (const e of expenses) { const r = m[monthKey(e.fecha)]; if (r) r.gastos += e.monto; }
  const meses = keys.map(k => ({ ...m[k], utilidad: m[k].ventas - m[k].costo - m[k].gastos }));
  const actual = meses[meses.length - 1];
  return {
    meses, actual, presupuesto: settings.presupuesto,
    pendientes: Object.values(orders).filter(o => /^Pendiente|^Revisar/.test(o.estado)).length,
    porDespachar: Object.values(orders).filter(o => ['Pagado', 'Preparando'].includes(o.estado)).length,
    stockBajo: products.filter(p => p.stock !== null && p.stock <= 5).map(p => ({ id: p.id, name: p.name, stock: p.stock }))
  };
}

const csvCell = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };

async function admin(req, res, url) {
  const p = url.pathname;
  if (req.method === 'POST' && p === '/api/admin/login') return login(req, res);
  const s = sessionOf(req);
  if (!s) return send(res, 401, { error: 'No autenticado.' });
  if (req.method !== 'GET' && req.headers['x-requested-with'] !== 'reyked') return send(res, 403, { error: 'Solicitud no permitida.' });
  const m = re => p.match(re);
  let x;

  if (req.method === 'POST' && p === '/api/admin/logout') { sessions.delete(s.token); return send(res, 200, { ok: true }, undefined, { 'Set-Cookie': cookie('', 0) }); }
  if (req.method === 'GET' && p === '/api/admin/me') return send(res, 200, { user: ADMIN_USER });
  if (req.method === 'GET' && p === '/api/admin/resumen') return send(res, 200, resumen());

  if (req.method === 'GET' && p === '/api/admin/pedidos') return send(res, 200, Object.values(orders).sort((a, b) => b.fecha.localeCompare(a.fecha)));
  if (req.method === 'GET' && p === '/api/admin/pedidos.csv') {
    const rows = [['Pedido', 'Fecha', 'Estado', 'Pago', 'Entrega', 'Cliente', 'Correo', 'Teléfono', 'Dirección', 'Detalle', 'Total']];
    for (const o of Object.values(orders).sort((a, b) => a.fecha.localeCompare(b.fecha))) rows.push([o.id, o.fecha, o.estado, o.metodo, o.entrega, o.cliente.nombre, o.cliente.email, o.cliente.tel, o.cliente.dir, o.items.map(i => `${i.qty}x ${i.name}`).join('; '), o.total]);
    return send(res, 200, '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n'), 'text/csv; charset=utf-8', { 'Content-Disposition': 'attachment; filename="pedidos-reyked.csv"' });
  }
  if (req.method === 'PATCH' && (x = m(/^\/api\/admin\/pedidos\/(RK-[A-F0-9]{10})$/))) {
    const o = orders[x[1]], b = await json(req);
    if (!o) return send(res, 404, { error: 'Pedido no existe.' });
    if (!b || !ESTADOS.includes(b.estado)) return send(res, 400, { error: 'Estado inválido.' });
    setEstado(o, b.estado); return send(res, 200, o);
  }

  if (req.method === 'GET' && p === '/api/admin/productos') return send(res, 200, products);
  if (req.method === 'POST' && p === '/api/admin/productos') {
    const b = await json(req) || {}, v = cleanProduct(b);
    if (typeof v === 'string') return send(res, 400, { error: v });
    const n = products.reduce((mx, q) => Math.max(mx, +(q.code || '').replace(/\D/g, '') || 0), 0) + 1;
    const prod = { id: 'p-' + crypto.randomBytes(4).toString('hex'), code: 'RK-' + String(n).padStart(2, '0'), ...v };
    products.push(prod); persist('products.json', products); return send(res, 200, prod);
  }
  if ((x = m(/^\/api\/admin\/productos\/([\w-]+)$/))) {
    const prod = byId(x[1]); if (!prod) return send(res, 404, { error: 'Producto no existe.' });
    if (req.method === 'PUT') {
      const v = cleanProduct(await json(req) || {}, prod);
      if (typeof v === 'string') return send(res, 400, { error: v });
      Object.assign(prod, v); persist('products.json', products); return send(res, 200, prod);
    }
    if (req.method === 'DELETE') { products = products.filter(q => q !== prod); persist('products.json', products); return send(res, 200, { ok: true }); }
  }

  if (req.method === 'GET' && p === '/api/admin/gastos') return send(res, 200, [...expenses].sort((a, b) => b.fecha.localeCompare(a.fecha)));
  if (req.method === 'POST' && p === '/api/admin/gastos') {
    const b = await json(req) || {};
    const e = { id: crypto.randomBytes(4).toString('hex'), fecha: str(b.fecha, 10), categoria: str(b.categoria, 40), descripcion: str(b.descripcion, 200), monto: b.monto };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.fecha) || !e.categoria || !int(e.monto, 1, 1_000_000_000)) return send(res, 400, { error: 'Fecha, categoría y monto (entero) son obligatorios.' });
    expenses.push(e); persist('expenses.json', expenses); return send(res, 200, e);
  }
  if (req.method === 'DELETE' && (x = m(/^\/api\/admin\/gastos\/([a-f0-9]{8})$/))) {
    expenses = expenses.filter(e => e.id !== x[1]); persist('expenses.json', expenses); return send(res, 200, { ok: true });
  }

  if (req.method === 'PUT' && p === '/api/admin/ajustes') {
    const b = await json(req) || {};
    if (!int(b.presupuesto, 0, 10_000_000_000)) return send(res, 400, { error: 'Presupuesto inválido.' });
    settings.presupuesto = b.presupuesto; persist('settings.json', settings); return send(res, 200, settings);
  }
  send(res, 404, { error: 'No existe.' });
}

/* ========== Estáticos (lista blanca) ========== */
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const PUBLIC_FILES = new Set(['index.html', 'nosotros.html', 'catalogo.html', 'kit.html', 'despacho.html', 'contacto.html', 'admin.html', 'styles.css', 'app.js', 'admin.js']);
function serveStatic(res, pathname) {
  const rel = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  const full = path.resolve(ROOT, rel);
  const ok = PUBLIC_FILES.has(rel) || (rel.startsWith('assets/') && full.startsWith(path.join(ROOT, 'assets') + path.sep));
  if (!ok) return send(res, 404, 'No encontrado', 'text/plain; charset=utf-8');
  fs.readFile(full, (err, buf) => err ? send(res, 404, 'No encontrado', 'text/plain; charset=utf-8') : send(res, 200, buf, TYPES[path.extname(full)] || 'application/octet-stream', rel === 'admin.html' ? { 'Cache-Control': 'no-store' } : {}));
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, PUBLIC_URL);
  try {
    if (url.pathname.startsWith('/api/admin/')) return await admin(req, res, url);
    if (req.method === 'GET' && url.pathname === '/api/productos') return send(res, 200, publicProducts());
    if (req.method === 'POST' && url.pathname === '/api/pagos/crear') return await crear(req, res);
    if (req.method === 'POST' && url.pathname === '/api/pagos/webhook') return await webhook(req, res, url);
    const m = url.pathname.match(/^\/api\/pedidos\/(RK-[A-F0-9]{10})$/);
    if (req.method === 'GET' && m) {
      const o = orders[m[1]];
      return o ? send(res, 200, { id: o.id, estado: o.estado, total: o.total }) : send(res, 404, { error: 'No existe.' });
    }
    if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(res, url.pathname);
    send(res, 405, { error: 'Método no permitido.' });
  } catch (e) { console.error(e); if (!res.headersSent) send(res, 500, { error: 'Error interno.' }); }
}).listen(PORT, () => console.log(`REYKED en ${PUBLIC_URL} (MP: ${MP_ACCESS_TOKEN ? 'ok' : 'SIN TOKEN'} · admin: ${ADMIN_PASSWORD ? 'ok' : 'SIN CLAVE'})`));
