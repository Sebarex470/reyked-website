'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clp = n => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('es-CL');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CATS = { aseo: 'Aseo & Desinfección', seguridad: 'Seguridad Vial e Industrial', logistica: 'Carga y Logística', pisos: 'Pisos y Revestimientos' };
const ESTADOS = ['Pendiente de pago', 'Pendiente de transferencia', 'Pagado', 'Preparando', 'Despachado', 'Entregado', 'Cancelado', 'Rechazado', 'Reembolsado', 'Contracargo', 'Revisar monto'];
const GASTO_CATS = ['Mercadería', 'Arriendo', 'Sueldos', 'Transporte', 'Servicios', 'Marketing', 'Otros'];
const PAID = ['Pagado', 'Preparando', 'Despachado', 'Entregado'];
const mes = k => new Date(k + '-15').toLocaleDateString('es-CL', { month: 'short', year: '2-digit' });

let tab = 'resumen';

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400);
}
async function api(path, method = 'GET', body) {
  const r = await fetch('/api/admin/' + path, {
    method, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'reyked' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== 'login') { showLogin(); throw new Error('Sesión expirada.'); }
  if (!r.ok) throw new Error(data.error || 'Error del servidor.');
  return data;
}
const num = v => v === '' ? NaN : Number(v);

/* ===== sesión ===== */
function showLogin() { $('#appView').hidden = true; $('#logout').hidden = true; $('#loginView').hidden = false; }
async function showApp() { $('#loginView').hidden = true; $('#appView').hidden = false; $('#logout').hidden = false; render(); }
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target; $('#loginErr').textContent = '';
  try { await api('login', 'POST', { user: f.user.value, password: f.password.value }); f.reset(); showApp(); }
  catch (ex) { $('#loginErr').textContent = ex.message; }
});
$('#logout').onclick = async () => { try { await api('logout', 'POST'); } catch { /* ya sin sesión */ } showLogin(); };
$('#admTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; tab = b.dataset.tab; render(); });

/* ===== vistas ===== */
async function render() {
  $$('#admTabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  const v = $('#view');
  try {
    if (tab === 'resumen') v.innerHTML = vResumen(await api('resumen'));
    else if (tab === 'pedidos') { const o = await api('pedidos'); v.innerHTML = vPedidos(o); }
    else if (tab === 'productos') v.innerHTML = vProductos(await api('productos'));
    else if (tab === 'gastos') v.innerHTML = vGastos(await api('gastos'));
    else if (tab === 'presupuesto') v.innerHTML = vPresupuesto(await api('resumen'));
    else if (tab === 'ganancias') v.innerHTML = vGanancias(await api('resumen'));
    else if (tab === 'clientes') v.innerHTML = vClientes(await api('pedidos'));
  } catch (ex) { if (ex.message !== 'Sesión expirada.') v.innerHTML = `<p class="error">${esc(ex.message)}</p>`; }
}
const kpi = (t, v) => `<div class="kpi"><small>${t}</small><strong>${v}</strong></div>`;
function bars(meses, key) {
  const max = Math.max(1, ...meses.map(m => Math.abs(m[key])));
  return `<div class="bars">${meses.map(m => `<div title="${mes(m.mes)}: ${clp(m[key])}"><i style="height:${Math.abs(m[key]) / max * 100}%"></i></div>`).join('')}</div>
    <div class="bars-l">${meses.map(m => `<span>${mes(m.mes)}<br>${clp(m[key])}</span>`).join('')}</div>`;
}

function vResumen(r) {
  const a = r.actual;
  return `<h2>Resumen del mes</h2><div class="kpis">
    ${kpi('Ventas', clp(a.ventas))}${kpi('Pedidos pagados', a.pedidos)}${kpi('Gastos', clp(a.gastos))}${kpi('Utilidad', clp(a.utilidad))}
    ${kpi('Por confirmar pago', r.pendientes)}${kpi('Por despachar', r.porDespachar)}</div>
    <h3>Ventas últimos 6 meses</h3>${bars(r.meses, 'ventas')}
    ${r.stockBajo.length ? `<h3 class="mt">Stock bajo</h3><ul class="plain">${r.stockBajo.map(p => `<li>${esc(p.name)} · quedan <strong>${p.stock}</strong></li>`).join('')}</ul>` : ''}`;
}

function vPedidos(list) {
  if (!list.length) return '<h2>Pedidos</h2><p class="empty">Aún no hay pedidos.</p>';
  return `<div class="row"><h2>Pedidos</h2><a class="btn btn-line" href="/api/admin/pedidos.csv">Descargar CSV</a></div>
  ${list.map(o => `<div class="order" data-id="${esc(o.id)}">
    <div class="row"><strong>${esc(o.id)}</strong><strong>${clp(o.total)}</strong></div>
    <small>${new Date(o.fecha).toLocaleString('es-CL')} · ${esc(o.metodo)} · ${esc({ local: 'despacho local', region: 'regiones', retiro: 'retiro' }[o.entrega] || o.entrega)}</small>
    <p>${esc(o.cliente.nombre)} · <a href="tel:${esc(o.cliente.tel)}">${esc(o.cliente.tel)}</a> · <a href="mailto:${esc(o.cliente.email)}">${esc(o.cliente.email)}</a><br>${esc(o.cliente.dir)}</p>
    <ul>${o.items.map(i => `<li>${i.qty} × ${esc(i.name)} (${clp(i.price)})</li>`).join('')}</ul>
    <label class="inline">Estado <select data-estado>${ESTADOS.map(e => `<option${e === o.estado ? ' selected' : ''}>${e}</option>`).join('')}</select></label>
  </div>`).join('')}`;
}

function vProductos(list) {
  const catSel = v => Object.entries(CATS).map(([k, n]) => `<option value="${k}"${k === v ? ' selected' : ''}>${n}</option>`).join('');
  const row = p => `<form class="prow" data-id="${esc(p.id)}">
    <label>Nombre<input name="name" value="${esc(p.name)}" required></label>
    <label>Descripción<input name="desc" value="${esc(p.desc)}"></label>
    <label>Categoría<select name="cat">${catSel(p.cat)}</select></label>
    <label>Precio venta<input name="price" type="number" min="0" step="1" value="${p.price}" required></label>
    <label>Costo<input name="cost" type="number" min="0" step="1" value="${p.cost}" required></label>
    <label>Stock <small>(vacío = sin control)</small><input name="stock" type="number" min="0" step="1" value="${p.stock ?? ''}"></label>
    <label class="chk"><input name="active" type="checkbox"${p.active ? ' checked' : ''}> visible en la tienda</label>
    <div class="acts"><button class="btn btn-dark" type="submit">Guardar</button><button class="btn btn-line" type="button" data-del>Eliminar</button></div>
  </form>`;
  const blank = { name: '', desc: '', cat: 'aseo', price: '', cost: 0, stock: null, active: true };
  return `<h2>Productos</h2><p class="note">El costo no se muestra a los clientes; se usa para calcular tu ganancia.</p>
    <h3>Agregar producto</h3>${row(blank).replace('data-id=""', 'data-new').replace('<button class="btn btn-line" type="button" data-del>Eliminar</button>', '')}
    <h3 class="mt">Catálogo actual (${list.length})</h3>${list.map(p => `<div class="pcard"><span class="label">${esc(p.code)}</span>${row(p)}</div>`).join('')}`;
}

function vGastos(list) {
  const hoy = new Date().toISOString().slice(0, 10);
  return `<h2>Gastos</h2>
  <form class="form gform" id="gastoForm">
    <label>Fecha<input type="date" name="fecha" value="${hoy}" required></label>
    <label>Categoría<select name="categoria">${GASTO_CATS.map(c => `<option>${c}</option>`).join('')}</select></label>
    <label>Descripción<input name="descripcion"></label>
    <label>Monto (CLP)<input type="number" name="monto" min="1" step="1" required></label>
    <button class="btn btn-dark" type="submit">Registrar gasto</button>
  </form>
  <h3 class="mt">Historial</h3>
  ${list.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th class="r">Monto</th><th></th></tr></thead><tbody>
    ${list.map(g => `<tr><td>${esc(g.fecha)}</td><td>${esc(g.categoria)}</td><td>${esc(g.descripcion)}</td><td class="r">${clp(g.monto)}</td><td><button class="linkbtn" data-delg="${esc(g.id)}">eliminar</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Sin gastos registrados.</p>'}`;
}

function vPresupuesto(r) {
  const pct = r.presupuesto > 0 ? r.actual.gastos / r.presupuesto * 100 : 0, left = r.presupuesto - r.actual.gastos;
  return `<h2>Presupuesto mensual de gastos</h2>
  <form class="form pform" id="presForm"><label>Presupuesto del mes (CLP)<input type="number" name="presupuesto" min="0" step="1000" value="${r.presupuesto}" required></label>
  <button class="btn btn-dark" type="submit">Guardar</button></form>
  <div class="meter" role="progressbar" aria-valuenow="${Math.min(100, Math.round(pct))}" aria-valuemin="0" aria-valuemax="100"><i class="${pct > 100 ? 'over' : ''}" style="width:${Math.min(100, pct)}%"></i></div>
  <div class="kpis">${kpi('Gastado este mes', clp(r.actual.gastos))}${kpi(left >= 0 ? 'Disponible' : 'Excedido', clp(Math.abs(left)))}${kpi('Uso', Math.round(pct) + '%')}</div>
  <h3>Gastos por mes</h3>${bars(r.meses, 'gastos')}`;
}

function vGanancias(r) {
  const tot = k => r.meses.reduce((s, m) => s + m[k], 0);
  return `<h2>Ganancias</h2><p class="note">Utilidad = ventas pagadas − costo de los productos vendidos − gastos registrados.</p>
  <div class="kpis">${kpi('Ventas (6 meses)', clp(tot('ventas')))}${kpi('Costo productos', clp(tot('costo')))}${kpi('Gastos', clp(tot('gastos')))}${kpi('Utilidad', clp(tot('utilidad')))}</div>
  <div class="scroll"><table class="tbl"><thead><tr><th>Mes</th><th class="r">Ventas</th><th class="r">Costo</th><th class="r">Gastos</th><th class="r">Utilidad</th></tr></thead><tbody>
  ${[...r.meses].reverse().map(m => `<tr><td>${mes(m.mes)}</td><td class="r">${clp(m.ventas)}</td><td class="r">${clp(m.costo)}</td><td class="r">${clp(m.gastos)}</td><td class="r"><strong>${clp(m.utilidad)}</strong></td></tr>`).join('')}</tbody></table></div>
  <h3 class="mt">Utilidad por mes</h3>${bars(r.meses, 'utilidad')}`;
}

function vClientes(orders) {
  const m = new Map();
  for (const o of orders) {
    const k = o.cliente.email.toLowerCase(), c = m.get(k) || { ...o.cliente, pedidos: 0, total: 0 };
    c.pedidos++; if (PAID.includes(o.estado)) c.total += o.total; m.set(k, c);
  }
  const list = [...m.values()].sort((a, b) => b.total - a.total);
  return `<h2>Clientes</h2>${list.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>Cliente</th><th>Contacto</th><th class="r">Pedidos</th><th class="r">Comprado</th></tr></thead><tbody>
  ${list.map(c => `<tr><td>${esc(c.nombre)}</td><td><a href="mailto:${esc(c.email)}">${esc(c.email)}</a><br>${esc(c.tel)}</td><td class="r">${c.pedidos}</td><td class="r">${clp(c.total)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Aún no hay clientes.</p>'}`;
}

/* ===== acciones ===== */
$('#view').addEventListener('change', async e => {
  const sel = e.target.closest('[data-estado]'); if (!sel) return;
  try { await api('pedidos/' + sel.closest('.order').dataset.id, 'PATCH', { estado: sel.value }); toast('Estado actualizado'); }
  catch (ex) { toast(ex.message); render(); }
});
$('#view').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target;
  try {
    if (f.classList.contains('prow')) {
      const body = { name: f.name.value, desc: f.desc.value, cat: f.cat.value, price: num(f.price.value), cost: num(f.cost.value), stock: f.stock.value === '' ? null : num(f.stock.value), active: f.active.checked };
      if (f.hasAttribute('data-new')) await api('productos', 'POST', body); else await api('productos/' + f.dataset.id, 'PUT', body);
      toast('Producto guardado'); render();
    } else if (f.id === 'gastoForm') {
      await api('gastos', 'POST', { fecha: f.fecha.value, categoria: f.categoria.value, descripcion: f.descripcion.value, monto: num(f.monto.value) });
      toast('Gasto registrado'); render();
    } else if (f.id === 'presForm') {
      await api('ajustes', 'PUT', { presupuesto: num(f.presupuesto.value) }); toast('Presupuesto guardado'); render();
    }
  } catch (ex) { toast(ex.message); }
});
$('#view').addEventListener('click', async e => {
  const t = e.target.closest('button'); if (!t) return;
  try {
    if (t.hasAttribute('data-del')) {
      const f = t.closest('form'); if (!confirm(`¿Eliminar "${f.name.value}"? Los pedidos anteriores se conservan.`)) return;
      await api('productos/' + f.dataset.id, 'DELETE'); toast('Producto eliminado'); render();
    } else if (t.dataset.delg) {
      if (!confirm('¿Eliminar este gasto?')) return;
      await api('gastos/' + t.dataset.delg, 'DELETE'); toast('Gasto eliminado'); render();
    }
  } catch (ex) { toast(ex.message); }
});

/* ===== inicio ===== */
api('me').then(showApp, showLogin);
