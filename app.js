'use strict';
/* ===== Configuración ===== */
const CONFIG = {
  whatsapp: '56956474595',
  // Pagos: este prototipo SIMULA el cobro. Para cobrar de verdad, define un
  // backend que cree la preferencia/transacción y pon aquí su URL.
  // El backend debe responder { url } para redirigir al checkout del proveedor.
  paymentEndpoint: null, // p.ej. '/api/pagos/crear'
  defaultBudget: 500000
};

const CATEGORIES = [
  { id: 'all', name: 'Todo' },
  { id: 'aseo', name: 'Aseo & Desinfección' },
  { id: 'seguridad', name: 'Seguridad Vial e Industrial' },
  { id: 'logistica', name: 'Carga y Logística' },
  { id: 'pisos', name: 'Pisos y Revestimientos' }
];

// Precios referenciales de ejemplo: reemplazar por los reales de la clienta.
const PRODUCTS = [
  { id: 'kit-ht', cat: 'aseo', icon: '🧴', name: 'Kit Higiene Total', desc: 'Detergente, desengrasante, Clean4+ y accesorios para oficinas y negocios.', price: 54990 },
  { id: 'det-5l', cat: 'aseo', icon: '🪣', name: 'Detergente profesional 5 L', desc: 'Multiuso de alto rendimiento para superficies y pisos.', price: 8990 },
  { id: 'des-5l', cat: 'aseo', icon: '🧽', name: 'Desengrasante industrial 5 L', desc: 'Para cocinas, talleres y maquinaria.', price: 11990 },
  { id: 'clean4', cat: 'aseo', icon: '🧪', name: 'Clean4+ Amonio cuaternario', desc: 'Desinfectante concentrado de amplio espectro.', price: 14990 },
  { id: 'cono', cat: 'seguridad', icon: '🚧', name: 'Cono de tráfico 70 cm', desc: 'Con banda reflectante, alta visibilidad.', price: 9990 },
  { id: 'barrera', cat: 'seguridad', icon: '⛓️', name: 'Barrera extensible', desc: 'Control de acceso y filas, cinta retráctil.', price: 39990 },
  { id: 'cinta', cat: 'seguridad', icon: '⚠️', name: 'Cinta de peligro 100 m', desc: 'Demarcación de áreas de riesgo.', price: 3990 },
  { id: 'espejo', cat: 'seguridad', icon: '🔍', name: 'Espejo panorámico', desc: 'Visibilidad en cruces y estacionamientos.', price: 29990 },
  { id: 'lomo', cat: 'seguridad', icon: '🛑', name: 'Lomo de toro / tope', desc: 'Reductor de velocidad de alta resistencia.', price: 24990 },
  { id: 'transpaleta', cat: 'logistica', icon: '📦', name: 'Transpaleta manual 2.5 t', desc: 'Traslado de pallets en bodegas.', price: 229990 },
  { id: 'apiladora', cat: 'logistica', icon: '🏗️', name: 'Apiladora manual', desc: 'Elevación y apilado de carga.', price: 549990 },
  { id: 'escalera', cat: 'logistica', icon: '🪜', name: 'Escalera industrial', desc: 'Estructura reforzada para uso intensivo.', price: 119990 },
  { id: 'goma', cat: 'pisos', icon: '⬛', name: 'Piso de goma (m²)', desc: 'Antideslizante, ideal para zonas de trabajo.', price: 18990 },
  { id: 'gym', cat: 'pisos', icon: '🏋️', name: 'Piso para gimnasio (m²)', desc: 'Amortiguación y alta durabilidad.', price: 21990 },
  { id: 'wet', cat: 'pisos', icon: '🚪', name: 'Limpiapiés alto tráfico Wet', desc: 'Retiene humedad y suciedad en accesos.', price: 34990 }
];

/* ===== Utilidades ===== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clp = n => '$' + Math.round(n).toLocaleString('es-CL');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } }
};
const waLink = text => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
const byId = id => PRODUCTS.find(p => p.id === id);

let cart = store.get('reyked_cart', []);       // [{id, qty}]
let orders = store.get('reyked_orders', []);   // pedidos del cliente
let settings = store.get('reyked_settings', { budget: CONFIG.defaultBudget, margin: 25 });
let activeCat = 'all';

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ===== Catálogo ===== */
function renderCats() {
  $('#cats').innerHTML = CATEGORIES.map(c => `<button class="${c.id === activeCat ? 'on' : ''}" data-cat="${c.id}">${c.name}</button>`).join('');
}
function renderProducts() {
  const list = PRODUCTS.filter(p => activeCat === 'all' || p.cat === activeCat);
  $('#products').innerHTML = list.map(p => `
    <article class="prod">
      <div class="ph" aria-hidden="true">${p.icon}</div>
      <div class="b">
        <span class="tag">${CATEGORIES.find(c => c.id === p.cat).name}</span>
        <h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>
        <div class="foot"><span class="price">${clp(p.price)}</span>
        <button class="btn btn-primary" data-add="${p.id}">Agregar</button></div>
      </div>
    </article>`).join('');
}

/* ===== Carrito ===== */
const cartTotal = () => cart.reduce((s, i) => s + (byId(i.id)?.price || 0) * i.qty, 0);
function saveCart() { store.set('reyked_cart', cart); renderCart(); }
function addToCart(id) {
  const it = cart.find(i => i.id === id);
  it ? it.qty++ : cart.push({ id, qty: 1 });
  saveCart(); toast('Agregado al carrito');
}
function renderCart() {
  cart = cart.filter(i => byId(i.id));
  $('#cartCount').textContent = cart.reduce((s, i) => s + i.qty, 0);
  $('#cartSubtotal').textContent = clp(cartTotal());
  $('#cartItems').innerHTML = cart.length ? cart.map(i => { const p = byId(i.id); return `
    <div class="line"><div class="th">${p.icon}</div>
      <div><h4>${esc(p.name)}</h4><small>${clp(p.price)} c/u</small>
        <div class="qty"><button data-dec="${p.id}" aria-label="Menos">−</button><span>${i.qty}</span><button data-inc="${p.id}" aria-label="Más">+</button>
        <button class="rm" data-rm="${p.id}">Quitar</button></div></div>
      <strong>${clp(p.price * i.qty)}</strong></div>`; }).join('')
    : '<p class="empty">Tu carrito está vacío.</p>';
}
function changeQty(id, d) {
  const it = cart.find(i => i.id === id); if (!it) return;
  it.qty += d; if (it.qty <= 0) cart = cart.filter(i => i !== it);
  saveCart();
}

/* ===== Overlays ===== */
let lastFocus = null;
function openPanel(el) {
  lastFocus = document.activeElement;
  closeAll(true);
  $('#overlay').hidden = false;
  if (el.classList.contains('drawer')) { el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); }
  else el.hidden = false;
  document.body.style.overflow = 'hidden';
  ($('[data-close]', el) || el).focus();
}
function closeAll(keepFocus) {
  $$('.drawer').forEach(d => { d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); });
  $$('.modal').forEach(m => m.hidden = true);
  $('#overlay').hidden = true; document.body.style.overflow = '';
  if (!keepFocus && lastFocus) lastFocus.focus();
}

/* ===== Checkout ===== */
const PAY_NOTES = {
  tarjeta: 'Los datos de tarjeta se validan en tu dispositivo y no se guardan. En producción los procesa el proveedor de pagos.',
  mercadopago: 'Serás redirigido a Mercado Pago para completar el pago.',
  webpay: 'Serás redirigido a Webpay Plus para pagar con tarjetas bancarias chilenas.',
  transferencia: 'Te enviaremos los datos bancarios; el pedido se despacha al confirmar la transferencia.'
};
function renderSummary() {
  const f = $('#checkoutForm');
  const entrega = f.entrega.value;
  const sub = cartTotal();
  const envio = entrega === 'retiro' ? 'Gratis' : entrega === 'local' ? 'A coordinar' : 'Según destino';
  $('#coSummary').innerHTML = `${cart.map(i => `<div class="row"><span>${i.qty} × ${esc(byId(i.id).name)}</span><span>${clp(byId(i.id).price * i.qty)}</span></div>`).join('')}
    <div class="row"><span>Envío</span><span>${envio}</span></div>
    <div class="row total"><span>Total productos</span><span>${clp(sub)}</span></div>`;
  $('#payBtn').textContent = 'Pagar ' + clp(sub);
}
function syncPayUI() {
  const m = $('#checkoutForm').pago.value;
  $('#cardFields').hidden = m !== 'tarjeta';
  $('#payNote').textContent = PAY_NOTES[m];
}
function luhn(num) {
  let sum = 0, alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = +num[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}
function validCard(f) {
  const num = f.cardnum.value.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(num) || !luhn(num)) return 'Número de tarjeta inválido.';
  const m = f.cardexp.value.match(/^(\d{2})\/(\d{2})$/);
  if (!m || +m[1] < 1 || +m[1] > 12) return 'Fecha de vencimiento inválida (MM/AA).';
  if (new Date(2000 + +m[2], +m[1], 1) <= new Date()) return 'La tarjeta está vencida.';
  if (!/^\d{3,4}$/.test(f.cardcvv.value)) return 'CVV inválido.';
  return '';
}
async function submitCheckout(e) {
  e.preventDefault();
  const f = e.target, err = $('#coError'); err.textContent = '';
  if (!cart.length) { err.textContent = 'Tu carrito está vacío.'; return; }
  if (!f.checkValidity()) { f.reportValidity(); return; }
  const metodo = f.pago.value;
  if (metodo === 'tarjeta') { const m = validCard(f); if (m) { err.textContent = m; return; } }

  const order = {
    id: 'RK-' + Date.now().toString(36).toUpperCase(),
    fecha: new Date().toISOString(),
    items: cart.map(i => ({ id: i.id, name: byId(i.id).name, qty: i.qty, price: byId(i.id).price })),
    total: cartTotal(), metodo, entrega: f.entrega.value,
    cliente: { nombre: f.nombre.value, email: f.email.value, tel: f.tel.value, dir: f.dir.value },
    estado: metodo === 'transferencia' ? 'Pendiente de transferencia' : (CONFIG.paymentEndpoint ? 'Pendiente de pago' : 'Pagado (simulado)')
  };
  const btn = $('#payBtn'); btn.disabled = true; btn.textContent = 'Procesando…';
  try {
    if (CONFIG.paymentEndpoint && metodo !== 'transferencia') {
      // Nunca se envían datos de tarjeta: el backend crea la sesión de pago del proveedor.
      const r = await fetch(CONFIG.paymentEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ metodo, orden: order }) });
      if (!r.ok) throw new Error('El servidor de pagos no respondió.');
      const { url } = await r.json();
      orders.unshift(order); store.set('reyked_orders', orders);
      cart = []; saveCart();
      if (url) { location.href = url; return; }
    } else {
      await new Promise(r => setTimeout(r, 800)); // simulación
      orders.unshift(order); store.set('reyked_orders', orders);
      cart = []; saveCart();
    }
    f.reset(); closeAll(true);
    toast(`Pedido ${order.id} registrado`);
    openAccount('pedidos');
  } catch (ex) {
    err.textContent = ex.message || 'No se pudo procesar el pago.';
  } finally { btn.disabled = false; renderSummary(); }
}

/* ===== Mi cuenta ===== */
let tab = 'pedidos';
const monthKey = d => d.slice(0, 7);
const monthName = k => new Date(k + '-15').toLocaleDateString('es-CL', { month: 'short' });
const paidOrders = () => orders.filter(o => !/^Pendiente/.test(o.estado));

function openAccount(t) { tab = t || tab; openPanel($('#accountModal')); renderAccount(); }
function renderAccount() {
  $$('#acTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  const body = $('#acBody');
  const paid = paidOrders();
  const total = paid.reduce((s, o) => s + o.total, 0);
  const nowKey = monthKey(new Date().toISOString());
  const month = paid.filter(o => monthKey(o.fecha) === nowKey).reduce((s, o) => s + o.total, 0);

  if (tab === 'pedidos') {
    body.innerHTML = orders.length ? orders.map(o => `
      <div class="order"><div class="row"><strong>${esc(o.id)}</strong><span class="st">${esc(o.estado)}</span></div>
      <small>${new Date(o.fecha).toLocaleString('es-CL')} · ${esc(o.metodo)}</small>
      <ul>${o.items.map(i => `<li>${i.qty} × ${esc(i.name)}</li>`).join('')}</ul>
      <div class="row"><span>${esc(o.cliente.dir)}</span><strong>${clp(o.total)}</strong></div></div>`).join('')
      : '<p class="empty">Aún no tienes pedidos. ¡Agrega productos al carrito!</p>';
  } else if (tab === 'gastos') {
    const by = {}; paid.forEach(o => by[monthKey(o.fecha)] = (by[monthKey(o.fecha)] || 0) + o.total);
    const keys = Object.keys(by).sort().slice(-6), max = Math.max(1, ...keys.map(k => by[k]));
    body.innerHTML = `<div class="kpis">
      <div class="kpi"><small>Gasto total</small><strong>${clp(total)}</strong></div>
      <div class="kpi"><small>Este mes</small><strong>${clp(month)}</strong></div>
      <div class="kpi"><small>Pedidos</small><strong>${paid.length}</strong></div>
      <div class="kpi"><small>Ticket promedio</small><strong>${clp(paid.length ? total / paid.length : 0)}</strong></div></div>
      ${keys.length ? `<div class="bars">${keys.map(k => `<div title="${clp(by[k])}"><i style="height:${by[k] / max * 100}%"></i></div>`).join('')}</div>
      <div class="bars-l">${keys.map(k => `<span>${monthName(k)}<br>${clp(by[k])}</span>`).join('')}</div>` : '<p class="empty">Sin gastos registrados todavía.</p>'}`;
  } else if (tab === 'presupuesto') {
    const pct = settings.budget > 0 ? month / settings.budget * 100 : 0;
    const left = settings.budget - month;
    body.innerHTML = `<label class="form">Presupuesto mensual (CLP)
      <input type="number" id="budgetIn" min="0" step="10000" value="${settings.budget}"></label>
      <div class="meter" role="progressbar" aria-valuenow="${Math.min(100, Math.round(pct))}" aria-valuemin="0" aria-valuemax="100"><i class="${pct > 100 ? 'over' : pct > 80 ? 'warn' : ''}" style="width:${Math.min(100, pct)}%"></i></div>
      <div class="kpis"><div class="kpi"><small>Gastado este mes</small><strong>${clp(month)}</strong></div>
      <div class="kpi"><small>${left >= 0 ? 'Disponible' : 'Excedido'}</small><strong>${clp(Math.abs(left))}</strong></div>
      <div class="kpi"><small>Uso</small><strong>${Math.round(pct)}%</strong></div></div>`;
    $('#budgetIn').addEventListener('change', e => { settings.budget = Math.max(0, +e.target.value || 0); store.set('reyked_settings', settings); renderAccount(); });
  } else {
    const gain = total * settings.margin / 100;
    body.innerHTML = `<p class="lead">Estimación de ganancia si revendes lo comprado con un margen sobre el costo.</p>
      <label class="form">Margen de reventa (%)
      <input type="number" id="marginIn" min="0" max="500" step="1" value="${settings.margin}"></label>
      <div class="kpis" style="margin-top:1rem"><div class="kpi"><small>Inversión (compras)</small><strong>${clp(total)}</strong></div>
      <div class="kpi"><small>Ganancia estimada</small><strong>${clp(gain)}</strong></div>
      <div class="kpi"><small>Ingreso por ventas</small><strong>${clp(total + gain)}</strong></div>
      <div class="kpi"><small>Este mes</small><strong>${clp(month * settings.margin / 100)}</strong></div></div>`;
    $('#marginIn').addEventListener('change', e => { settings.margin = Math.min(500, Math.max(0, +e.target.value || 0)); store.set('reyked_settings', settings); renderAccount(); });
  }
}

/* ===== Eventos ===== */
document.addEventListener('click', e => {
  const t = e.target.closest('button,a'); if (!t) return;
  if (t.dataset.add) addToCart(t.dataset.add);
  else if (t.dataset.inc) changeQty(t.dataset.inc, 1);
  else if (t.dataset.dec) changeQty(t.dataset.dec, -1);
  else if (t.dataset.rm) changeQty(t.dataset.rm, -999);
  else if (t.dataset.cat) { activeCat = t.dataset.cat; renderCats(); renderProducts(); }
  else if (t.dataset.tab) { tab = t.dataset.tab; renderAccount(); }
  else if (t.hasAttribute('data-close')) closeAll();
  if (t.closest('#menu')) $('#menu').classList.remove('open');
});
$('#overlay').addEventListener('click', () => closeAll());
$$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeAll(); }));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
$('#openCart').onclick = () => openPanel($('#cartDrawer'));
$('#openAccount').onclick = () => openAccount();
$('#burger').onclick = e => { const o = $('#menu').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); };
$('#addKit').onclick = () => { addToCart('kit-ht'); openPanel($('#cartDrawer')); };
$('#goCheckout').onclick = () => {
  if (!cart.length) return toast('Agrega productos primero');
  openPanel($('#checkoutModal')); renderSummary(); syncPayUI();
};
$('#cartWa').onclick = () => {
  if (!cart.length) return toast('Agrega productos primero');
  const lines = cart.map(i => `• ${i.qty} × ${byId(i.id).name}`).join('\n');
  window.open(waLink(`Hola REYKED, quisiera cotizar:\n${lines}\nTotal referencial: ${clp(cartTotal())}`), '_blank', 'noopener');
};
const co = $('#checkoutForm');
co.addEventListener('change', () => { renderSummary(); syncPayUI(); });
co.addEventListener('submit', submitCheckout);
co.cardnum.addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim());
co.cardexp.addEventListener('input', e => { let v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); e.target.value = v; });
$('#contactForm').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target;
  window.open(waLink(`Hola REYKED, soy ${f.nombre.value} (${f.email.value}${f.tel.value ? ', ' + f.tel.value : ''}).\n${f.msg.value}`), '_blank', 'noopener');
});

/* ===== Init ===== */
const hello = waLink('Hola REYKED, quisiera cotizar productos para mi empresa.');
['heroWa', 'waFloat'].forEach(id => $('#' + id).href = hello);
$('#kitPrice').textContent = clp(byId('kit-ht').price);
$('#year').textContent = new Date().getFullYear();
renderCats(); renderProducts(); renderCart();
