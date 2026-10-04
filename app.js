'use strict';
/* ===== Configuración ===== */
const CONFIG = { whatsapp: '56956474595' };
const CATEGORIES = [
  { id: 'all', name: 'Todo' },
  { id: 'aseo', name: 'Aseo & Desinfección' },
  { id: 'seguridad', name: 'Seguridad Vial e Industrial' },
  { id: 'logistica', name: 'Carga y Logística' },
  { id: 'pisos', name: 'Pisos y Revestimientos' }
];
const PAGES = [['nosotros.html', 'nosotros'], ['catalogo.html', 'catálogo'], ['kit.html', 'kit'], ['despacho.html', 'despacho'], ['contacto.html', 'contacto']];

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

let PRODUCTS = [];
let cart = store.get('reyked_cart', []);       // [{id, qty}]
let orders = store.get('reyked_orders', []);   // pedidos de este navegador
let activeCat = new URLSearchParams(location.search).get('cat') || 'all';
if (!CATEGORIES.some(c => c.id === activeCat)) activeCat = 'all';

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ===== Cascarón compartido: cabecera, pie, carrito, pago ===== */
function shell() {
  const here = location.pathname.split('/').pop() || 'index.html';
  const links = PAGES.map(([h, t]) => `<a href="${h}"${h === here ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  document.body.insertAdjacentHTML('afterbegin', `
<header class="site-header" id="top"><div class="container nav">
  <a href="index.html" class="brand" aria-label="REYKED Higiene & Seguridad - inicio"><img src="assets/logo.webp" alt="" width="40" height="44"><span>reyked</span></a>
  <nav class="menu" id="menu" aria-label="Principal">${links}</nav>
  <div class="nav-actions">
    <button class="nav-btn" id="openAccount" aria-label="Mis pedidos"><svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="10" cy="7" r="3.5"/><path d="M3 18c0-3.5 3.5-5 7-5s7 1.5 7 5"/></svg><span>mis pedidos</span></button>
    <button class="nav-btn" id="openCart" aria-label="Abrir carrito"><svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M1 2h3l2 10h9l2-7H5"/><circle cx="8" cy="16" r="1"/><circle cx="14" cy="16" r="1"/></svg><span>carrito (<b id="cartCount">0</b>)</span></button>
    <button class="nav-btn burger" id="burger" aria-label="Menú" aria-expanded="false"><svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M2 5h16M2 10h16M2 15h16"/></svg><span>menú</span></button>
  </div></div></header>`);
  document.body.insertAdjacentHTML('beforeend', `
<footer class="band dark footer"><div class="container">
  <span>© ${new Date().getFullYear()} Comercializadora Reyked SPA · Concepción, Chile</span>
  <a href="mailto:ventas@reyked.cl">ventas@reyked.cl</a>
  <a href="https://www.instagram.com/reyked.cl" target="_blank" rel="noopener">@reyked.cl</a>
  <a href="admin.html" class="admin-link">administración</a>
</div></footer>
<a class="wa-float" id="waFloat" href="#" target="_blank" rel="noopener">whatsapp</a>
<div class="overlay" id="overlay" hidden></div>
<aside class="drawer" id="cartDrawer" aria-label="Carrito" aria-hidden="true">
  <div class="drawer-head"><h3>Tu carrito</h3><button class="close" data-close aria-label="Cerrar">cerrar</button></div>
  <div class="drawer-body" id="cartItems"></div>
  <div class="drawer-foot">
    <div class="row"><span>Subtotal</span><strong id="cartSubtotal">$0</strong></div>
    <button class="btn btn-dark block" id="goCheckout">Ir a pagar</button>
    <button class="btn btn-line block" id="cartWa">Cotizar carrito por WhatsApp</button>
  </div>
</aside>
<div class="modal" id="checkoutModal" role="dialog" aria-modal="true" aria-labelledby="coTitle" hidden><div class="modal-box">
  <div class="drawer-head"><h3 id="coTitle">Finalizar compra</h3><button class="close" data-close aria-label="Cerrar">cerrar</button></div>
  <form id="checkoutForm" class="form" novalidate>
    <fieldset><legend>Datos de entrega</legend>
      <label>Nombre / Empresa<input name="nombre" required autocomplete="name"></label>
      <label>Correo<input type="email" name="email" required autocomplete="email"></label>
      <label>Teléfono<input type="tel" name="tel" required autocomplete="tel"></label>
      <label>Dirección o comuna de despacho<input name="dir" required autocomplete="street-address"></label>
      <label>Tipo de entrega<select name="entrega"><option value="local">Despacho local (hasta 15 km)</option><option value="region">Envío a regiones</option><option value="retiro">Retiro en tienda</option></select></label>
    </fieldset>
    <fieldset><legend>Método de pago</legend>
      <div class="pay-opts">
        <label><input type="radio" name="pago" value="mercadopago" checked><span>Mercado Pago · tarjetas de crédito y débito, saldo y otros medios</span></label>
        <label><input type="radio" name="pago" value="transferencia"><span>Transferencia bancaria</span></label>
      </div>
      <p class="note" id="payNote"></p>
    </fieldset>
    <div class="summary" id="coSummary"></div>
    <p class="error" id="coError" role="alert"></p>
    <button class="btn btn-dark block" type="submit" id="payBtn">Pagar</button>
  </form></div></div>
<div class="modal" id="accountModal" role="dialog" aria-modal="true" aria-labelledby="acTitle" hidden><div class="modal-box wide">
  <div class="drawer-head"><h3 id="acTitle">Mis pedidos</h3><button class="close" data-close aria-label="Cerrar">cerrar</button></div>
  <div id="acBody"></div></div></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>`);
  const hello = waLink('Hola REYKED, quisiera cotizar productos para mi empresa.');
  $$('#heroWa,#waFloat,.wa-hello').forEach(a => a.href = hello);
}

/* ===== Catálogo ===== */
function renderCats() {
  const el = $('#cats'); if (!el) return;
  el.innerHTML = CATEGORIES.map(c => `<button class="${c.id === activeCat ? 'on' : ''}" data-cat="${c.id}">${c.name}</button>`).join('');
}
function renderProducts() {
  const el = $('#products'); if (!el) return;
  const list = PRODUCTS.filter(p => activeCat === 'all' || p.cat === activeCat);
  el.innerHTML = list.length ? list.map(p => `
    <article class="prod">
      <div class="ph" aria-hidden="true">${esc(p.code)}</div>
      <div class="b">
        <span class="tag">${CATEGORIES.find(c => c.id === p.cat)?.name || ''}</span>
        <h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>
        <div class="foot"><span class="price">${clp(p.price)}</span>
        ${p.agotado ? '<span class="tag">agotado</span>' : `<button class="linkbtn" data-add="${esc(p.id)}">agregar</button>`}</div>
      </div>
    </article>`).join('') : '<p class="empty">No hay productos en esta categoría.</p>';
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
  if (PRODUCTS.length) cart = cart.filter(i => byId(i.id));
  $('#cartCount').textContent = cart.reduce((s, i) => s + i.qty, 0);
  $('#cartSubtotal').textContent = clp(cartTotal());
  $('#cartItems').innerHTML = cart.length ? cart.map(i => { const p = byId(i.id); if (!p) return ''; return `
    <div class="line"><div class="th">${esc(p.code)}</div>
      <div><h4>${esc(p.name)}</h4><small>${clp(p.price)} c/u</small>
        <div class="qty"><button data-dec="${esc(p.id)}" aria-label="Menos">−</button><span>${i.qty}</span><button data-inc="${esc(p.id)}" aria-label="Más">+</button>
        <button class="rm" data-rm="${esc(p.id)}">quitar</button></div></div>
      <strong>${clp(p.price * i.qty)}</strong></div>`; }).join('')
    : '<p class="empty">Tu carrito está vacío.</p>';
}
function changeQty(id, d) {
  const it = cart.find(i => i.id === id); if (!it) return;
  it.qty += d; if (it.qty <= 0) cart = cart.filter(i => i !== it);
  saveCart();
}

/* ===== Paneles ===== */
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
  mercadopago: 'Serás redirigido a Mercado Pago para pagar de forma segura. Nosotros no vemos ni guardamos los datos de tu tarjeta.',
  transferencia: 'Registraremos tu pedido y te enviaremos los datos bancarios; se despacha al confirmar la transferencia.'
};
function renderSummary() {
  const f = $('#checkoutForm'), sub = cartTotal();
  const envio = f.entrega.value === 'retiro' ? 'Gratis' : f.entrega.value === 'local' ? 'A coordinar' : 'Según destino';
  $('#coSummary').innerHTML = `${cart.map(i => `<div class="row"><span>${i.qty} × ${esc(byId(i.id).name)}</span><span>${clp(byId(i.id).price * i.qty)}</span></div>`).join('')}
    <div class="row"><span>Envío</span><span>${envio}</span></div>
    <div class="row total"><span>Total productos</span><span>${clp(sub)}</span></div>`;
  $('#payBtn').textContent = (f.pago.value === 'mercadopago' ? 'Pagar ' : 'Registrar pedido ') + clp(sub);
}
function syncPayUI() { $('#payNote').textContent = PAY_NOTES[$('#checkoutForm').pago.value]; }

async function submitCheckout(e) {
  e.preventDefault();
  const f = e.target, err = $('#coError'); err.textContent = '';
  if (!cart.length) { err.textContent = 'Tu carrito está vacío.'; return; }
  if (!f.checkValidity()) { f.reportValidity(); return; }
  const metodo = f.pago.value;
  const btn = $('#payBtn'); btn.disabled = true; btn.textContent = 'Procesando…';
  try {
    // Solo se envían ids y cantidades: el servidor calcula el total con sus propios precios.
    const r = await fetch('/api/pagos/crear', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metodo, entrega: f.entrega.value, items: cart.map(i => ({ id: i.id, qty: i.qty })),
        cliente: { nombre: f.nombre.value, email: f.email.value, tel: f.tel.value, dir: f.dir.value }
      })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'No se pudo procesar el pedido.');
    orders.unshift({
      id: data.pedido, fecha: new Date().toISOString(), metodo, entrega: f.entrega.value,
      items: cart.map(i => ({ id: i.id, name: byId(i.id).name, qty: i.qty })),
      total: cartTotal(), dir: f.dir.value,
      estado: metodo === 'transferencia' ? 'Pendiente de transferencia' : 'Pendiente de pago'
    });
    store.set('reyked_orders', orders);
    if (data.url) { location.href = data.url; return; } // Mercado Pago; el carrito se limpia al volver
    cart = []; saveCart(); f.reset(); closeAll(true);
    toast(`Pedido ${data.pedido} registrado`);
    openAccount();
  } catch (ex) {
    err.textContent = ex.message === 'Failed to fetch' ? 'Sin conexión con el servidor de pagos.' : ex.message;
  } finally { btn.disabled = false; renderSummary(); }
}

/* Regreso desde Mercado Pago: ?pago=ok|pending|failure&pedido=RK-XXXXXXXXXX */
async function handleReturn() {
  const q = new URLSearchParams(location.search), id = q.get('pedido'), res = q.get('pago');
  if (!id || !res) return;
  history.replaceState(null, '', location.pathname);
  if (res !== 'failure') { cart = []; saveCart(); }
  const sync = async tries => {
    await refreshOrders([id]);
    const o = orders.find(x => x.id === id);
    if (res === 'ok' && o && o.estado === 'Pendiente de pago' && tries > 0) setTimeout(() => sync(tries - 1), 3000);
    else if (!$('#accountModal').hidden) renderAccount();
  };
  await sync(5);
  toast(res === 'failure' ? 'El pago no se completó' : 'Gracias, recibimos tu pedido');
  openAccount();
}
async function refreshOrders(ids) {
  await Promise.all(ids.map(async id => {
    try {
      const r = await fetch('/api/pedidos/' + encodeURIComponent(id)); if (!r.ok) return;
      const { estado } = await r.json(), o = orders.find(x => x.id === id);
      if (o) o.estado = estado;
    } catch { /* sin conexión */ }
  }));
  store.set('reyked_orders', orders);
}

/* ===== Mis pedidos (este navegador) ===== */
function openAccount() {
  openPanel($('#accountModal')); renderAccount();
  refreshOrders(orders.filter(o => !/^(Entregado|Cancelado|Reembolsado)$/.test(o.estado)).map(o => o.id)).then(() => !$('#accountModal').hidden && renderAccount());
}
function renderAccount() {
  $('#acBody').innerHTML = orders.length ? orders.map(o => `
    <div class="order"><div class="row"><strong>${esc(o.id)}</strong><span class="st">${esc(o.estado)}</span></div>
    <small>${new Date(o.fecha).toLocaleString('es-CL')} · ${esc(o.metodo)}</small>
    <ul>${o.items.map(i => `<li>${i.qty} × ${esc(i.name)}</li>`).join('')}</ul>
    <div class="row"><span>${esc(o.dir || '')}</span><strong>${clp(o.total)}</strong></div></div>`).join('')
    : '<p class="empty">Aún no tienes pedidos en este dispositivo.</p>';
}

/* ===== Eventos ===== */
function bind() {
  document.addEventListener('click', e => {
    const t = e.target.closest('button,a'); if (!t) return;
    if (t.dataset.add) addToCart(t.dataset.add);
    else if (t.dataset.inc) changeQty(t.dataset.inc, 1);
    else if (t.dataset.dec) changeQty(t.dataset.dec, -1);
    else if (t.dataset.rm) changeQty(t.dataset.rm, -999);
    else if (t.dataset.cat) { activeCat = t.dataset.cat; renderCats(); renderProducts(); }
    else if (t.hasAttribute('data-close')) closeAll();
    if (t.closest('#menu')) $('#menu').classList.remove('open');
  });
  $('#overlay').addEventListener('click', () => closeAll());
  $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeAll(); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
  $('#openCart').onclick = () => openPanel($('#cartDrawer'));
  $('#openAccount').onclick = openAccount;
  $('#burger').onclick = e => { const o = $('#menu').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); };
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
  const kit = $('#addKit');
  if (kit) kit.onclick = () => { const k = PRODUCTS.find(p => p.name === 'Kit Higiene Total'); if (!k || k.agotado) return toast('Kit no disponible por ahora'); addToCart(k.id); openPanel($('#cartDrawer')); };
  const cf = $('#contactForm');
  if (cf) cf.addEventListener('submit', e => {
    e.preventDefault(); const f = e.target;
    window.open(waLink(`Hola REYKED, soy ${f.nombre.value} (${f.email.value}${f.tel.value ? ', ' + f.tel.value : ''}).\n${f.msg.value}`), '_blank', 'noopener');
  });
}

/* ===== Init ===== */
shell(); bind(); renderCats(); renderCart();
(async () => {
  try { PRODUCTS = await (await fetch('/api/productos')).json(); }
  catch { const g = $('#products'); if (g) g.innerHTML = '<p class="note">No se pudo cargar el catálogo. Abre el sitio desde el servidor (npm start).</p>'; }
  const kp = PRODUCTS.find(p => p.name === 'Kit Higiene Total');
  $$('.kit-price').forEach(el => el.textContent = kp ? clp(kp.price) : '');
  renderProducts(); renderCart(); handleReturn();
})();
