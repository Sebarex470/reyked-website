/**
 * Importa el catálogo de Reyked desde el Excel (.xlsx/.xlsm) y genera:
 *   - data/catalogo.json         (productos listos para la tienda)
 *   - public/productos/*.webp    (fotos optimizadas, nombre = código en minúscula)
 *
 * Uso:  npm run catalogo -- ruta/al/Catalogo.xlsm
 *
 * Columnas esperadas: CÓDIGO, NOMBRE DEL PRODUCTO, STOCK, PRECIO DE VENTA, IMAGEN (fotos flotantes sobre la fila).
 * Reglas:
 *  - Una fila con "eliminar" en una columna de notas (E a H) se omite.
 *  - Se omiten productos sin precio y sin stock (no hay nada que mostrar); con --incluir-sin-datos se publican como "consultar".
 *  - Precio = neto en CLP (el IVA 19 % se suma en la tienda).
 * Las categorías no vienen en el Excel: se asignan por palabras clave (ver REGLAS) y se pueden corregir ahí.
 */
import ExcelJS from "exceljs";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const entrada = args.find((a) => !a.startsWith("--"));
const INCLUIR_SIN_DATOS = args.includes("--incluir-sin-datos");
if (!entrada) {
  console.error("Falta la ruta del Excel.  Uso: npm run catalogo -- ruta/Catalogo.xlsm [--incluir-sin-datos]");
  process.exit(1);
}
const RAIZ = path.resolve(import.meta.dirname, "..");
const DIR_IMG = path.join(RAIZ, "public", "productos");
const SALIDA = path.join(RAIZ, "data", "catalogo.json");

/* ---------- limpieza de nombres ---------- */
const sinTildes = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const MINUSCULAS = new Set(["de", "del", "con", "para", "y", "en", "a", "el", "la", "los", "las", "por", "sin", "al", "o", "c/", "s/"]);
const TILDES = {
  higienico: "higiénico", jabon: "jabón", liquido: "líquido", liquida: "líquida", tapon: "tapón", oido: "oído",
  termometro: "termómetro", lampara: "lámpara", plastico: "plástico", plastica: "plástica", metalico: "metálico",
  proteccion: "protección", automatico: "automático", mecanico: "mecánico", telescopico: "telescópico",
  acrilica: "acrílica", magnetica: "magnética", dielectrico: "dieléctrico", electrico: "eléctrico", antideslizante: "antideslizante",
  desechable: "desechable", baston: "bastón", pano: "paño", panos: "paños", panuelo: "pañuelo", panuelos: "pañuelos",
  etica: "ética", ropa: "ropa", cabritilla: "cabritilla", fotocopia: "fotocopia", sabanilla: "sabanilla", escudo: "escudo",
};
const SIGLAS = new Set(["PVC", "LED", "EPP", "HP", "ISP", "KN95", "XL", "XXL", "UV", "WC", "PU", "TPR", "ABS", "AA", "AAA", "MSA", "3M"]);

function nombreBonito(raw) {
  let n = String(raw).replace(/\s+/g, " ").trim();
  n = n.replace(/^PLASTICO-\s*/i, "");                       // prefijo interno
  n = n.replace(/^(TORK|WINNEX|IMPEKE|VIRUTEX|8M|POETT|IGENIX)\s*-\s*/i, "$1 ");
  n = n.replace(/SENAL ETICA/i, "SEÑALÉTICA");
  const out = n.split(" ").map((w, i) => {
    if (!w) return w;
    const up = w.toUpperCase();
    if (SIGLAS.has(up)) return up;
    if (/\d/.test(w)) return w.replace(/(\d)(ML|LTS?|LT|GRS?|GR|KG|MTS?|MT|CC|UN|UNI|HJ|CM|MM|UND|BOL|PARES)\b/gi, (_, d, u) => d + u.toLowerCase()).replace(/X(?=\d)/g, "x").replace(/(?<=\d)MMX/g, "mmx");
    if (w.includes("/")) return up;                         // D/H, H/S, C/TVAIVEN…
    const base = w.toLowerCase();
    if (i > 0 && MINUSCULAS.has(base)) return base;
    const conTilde = TILDES[sinTildes(base)] ?? base;
    return conTilde.charAt(0).toUpperCase() + conTilde.slice(1);
  });
  return out.join(" ").replace(/\s+-\s+/g, " – ");
}

const slug = (s) => sinTildes(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);

/* ---------- categorías (primera regla que calce gana; se evalúa sobre el nombre sin tildes, en mayúscula) ---------- */
// [categoría, subtipo, expresión]
const REGLAS = [
  // casos puntuales que podrían confundirse
  ["aseo", "Ambientales e insecticidas", /CONO GEL|PERFUMERO/],
  ["aseo", "Desinfección", /TOALLA.*DESINF|TOALLITAS DESINF/],
  ["aseo", "Guantes", /GUANTE.*(MULTIUSO|AMARILLO)/],
  ["otros", "Cafetería", /NESCAFE|\bTE (LIPTON|CEYLAN|SUPREMO)|AZUCAR|ENDUZANTE|CUCHARA|\bVASO|BAJA LENGUA/],
  ["otros", "Oficina", /\bPILA\b|PAPEL FOTOCOPIA|RESMA|CORCHETERA|PIZARRA|BORRADOR|TINTA|ROLLO TERMICO|HERVIDOR|BENEDICTINO|\bSILLA\b|CARRO PORTA UTILES/],
  // seguridad vial
  ["vial", "Conos y accesorios", /\bCONO\b|BARRA CONECTORA|SEPARADOR DE CINTA|ARGOLLA PLAST/],
  ["vial", "Hitos y tachas", /\bHITO|TACHA|DELINEADOR/],
  ["vial", "Barreras", /BARRERA/],
  ["vial", "Balizas y señalización", /BALIZA|LAMPARA DESTELLANTE|PALETA PARE|REFLECTIVO AVERY|CADENA PLASTICA/],
  ["vial", "Cintas de demarcación", /CINTA (PELIGRO|DEMARCATORIA|REFLEC)/],
  // seguridad industrial
  ["industrial", "Espejos y reductores de velocidad", /ESPEJO|LOMO DE TORO|TOPE DE ESTAC|PROT\. PILAR|PERNO ANCLAJE|SEÑALETICA|SENAL ETICA|PISO HUMEDO/],
  ["industrial", "Mascarillas y protección facial", /MASCARILLA|MASCARA MEDIO|FILTRO 3M|ESCUDO|CARETA/],
  ["industrial", "Cabeza, ojos y oídos", /CASCO|LENTE|ANTEOJO|TAPON DE OIDO|PROTECTOR AUDITIVO|JOCKEY/],
  ["industrial", "Ropa de protección", /\bBUZO|PECHERA|ABRIGO|CAPA IMPERMEABLE|CHALECO|CUBRE CALZADO|GORRO|PUNTERA/],
  ["industrial", "Trabajo en altura y derrames", /ARNES|CABO VIDA|KIT ANTIDERRAME/],
  ["industrial", "Guantes", /\bGUANTES?\b/],
  ["industrial", "Seguridad personal", /BASTON RETRACTIL/],
  // contenedores
  ["contenedores", "Contenedores", /\bCONTENEDOR/],
  ["contenedores", "Basureros y papeleros", /BASURERO|PAPELERO|GAMELA/],
  // construcción: pisos, cintas, adhesivos
  ["construccion", "Cintas", /\bCINTA (ANTI|GRIS|MULTIPROP|MULTIUSO|DE ALUMINIO|ALUMINIO)/],
  ["construccion", "Pisos, gradas y limpiapiés", /\bPISO\b|PISO R\.|GRADA|PLANCHA ANTIFATIGA|PROTECTOR DE PISO|LIMPIAPIES/],
  ["construccion", "Adhesivos", /ADHESIVO/],
  // embalaje
  ["carga", "Embalaje", /\bFILM\b|CINTA EMBALAJE/],
  // aseo
  ["aseo", "Papel y toallas", /HIGIENICO|\bTOALLA|SERVILLETA|\bWIPE|SABANILLA|PAÑUELO|MANGA HIGIENICO|CONFOR |PROTECTOR DE ASIENTO|PAÑO DE LIMPIEZA MAXWIPE/],
  ["aseo", "Bolsas de basura", /\bBOLSA/],
  ["aseo", "Guantes", /GUANTE/],
  ["aseo", "Higiene personal", /TERMOMETRO|PARCHE|PROTECTOR SOLAR|FAMILAND|COTIDIAN/],
  ["aseo", "Ambientales e insecticidas", /DESODORANTE|AMBIENTAL|AMDIENTAL|GLADE|AIR WICK|DIFUSOR|PINO AROMATIZ|NEUTRALIZADOR|CANASTILLA|PASTILLA|TAPETE URIARIO|INSECTICIDA|\bRAID\b|KILLER|TANAX|REPELEX|TRAMPA|FUMIGADOR|AEROSOL ?$/],
  ["aseo", "Desinfección", /CLORO|HIPOCLORITO|CLORINDA|DESINFECT|ALCOHOL|LYSOFORM|ANTIBAC|SANITIZ|AMONIO/],
  ["aseo", "Jabones y dispensadores", /JABON|DISPENSADOR|SECADOR DE MANOS/],
  ["aseo", "Ceras, pisos y automotriz", /\bCERA\b|ABRILLANTADOR|REMOVEDOR|RENOVADOR|SILICONA|LUSTRA|SHAMPOO DE AUTO|NEUMATICO|BETUN|PASTA PULIDORA|PULIDOR/],
  ["aseo", "Limpiadores y detergentes", /LIMPIA|DETERGENTE|DESENGRASANTE|ANTIGRASA|LAVALOZA|QUIX|\bCIF\b|ANTISARRO|DIECON|SUAVISANTE|SUAVIZANTE|SAVISANTE|NEGROS? INTENSOS?|SHAMPOO|DESINCRUSTANTE|THE PINK STUFF/],
  ["aseo", "Utensilios y equipos", /ESCOBILL|TRAPERO|MOPA|\bMOP\b|SECAPISO|\bPALA\b|BALDE|CARRO|PULVERIZADOR|ESPONJA|SPONGI|VIRUTILLA|PLUMERO|SOPAPO|\bKIT\b|HORQUILLA|TELESCOPICO|\bPAD\b|REPUESTO|PAÑO|PORTA MOPA|BARRE HOJAS|HIDROLAVADORA|LAVATORIO|PERFUMERO|TIRA X|PACK 4|MAGO PADS|\bMANGO\b/],
];

function clasificar(nombre) {
  const t = sinTildes(nombre).toUpperCase();
  for (const [c, s, re] of REGLAS) if (re.test(t) || re.test(nombre.toUpperCase())) return { c, s };
  return { c: "aseo", s: "Otros de aseo" };
}

/* ---------- lectura del Excel ---------- */
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(entrada);
const ws = wb.worksheets[0];
const num = (v) => (typeof v === "number" ? v : typeof v === "object" && v && typeof v.result === "number" ? v.result : Number(String(v ?? "").replace(/[^\d.-]/g, "")) || 0);
const txt = (v) => (v == null ? "" : typeof v === "object" && "result" in v ? String(v.result ?? "") : typeof v === "object" && v.richText ? v.richText.map((r) => r.text).join("") : String(v)).trim();

const filas = new Map(); // fila(1-based) -> producto
const omitidos = { eliminar: [], sinPrecioNiStock: [], duplicado: [] };
const vistos = new Set();
ws.eachRow((row, i) => {
  if (i === 1) return;
  const code = txt(row.getCell(1).value);
  const nombre = txt(row.getCell(2).value);
  if (!code || !nombre) return;
  const notas = [5, 6, 7, 8].map((c) => txt(row.getCell(c).value)).join(" ");
  const stock = Math.max(0, Math.trunc(num(row.getCell(3).value)));
  const precio = Math.max(0, Math.round(num(row.getCell(4).value)));
  if (/elimin/i.test(notas)) return void omitidos.eliminar.push(`${code} ${nombre}`);
  if (vistos.has(code)) return void omitidos.duplicado.push(code);
  vistos.add(code);
  if (!precio && !stock && !INCLUIR_SIN_DATOS) return void omitidos.sinPrecioNiStock.push(`${code} ${nombre}`);
  const n = nombreBonito(nombre);
  const { c, s } = clasificar(n);
  filas.set(i, { id: `${slug(n)}-${code.toLowerCase()}`, code, n, c, s, p: precio, stock });
});

/* ---------- imágenes ---------- */
fs.mkdirSync(DIR_IMG, { recursive: true });
for (const f of fs.readdirSync(DIR_IMG)) if (f.endsWith(".webp")) fs.unlinkSync(path.join(DIR_IMG, f));
let conImagen = 0;
const hechas = new Set();
// Cada foto se asigna a la fila donde cae su CENTRO (algunas están ancladas a la fila anterior con desplazamiento).
const altoFilaPx = (i) => (ws.getRow(i).height ?? ws.properties.defaultRowHeight ?? 15) * (96 / 72);
function filaDeCentro(im) {
  const tl = im.range.tl;
  let y = (tl.nativeRowOff ?? 0) / 9525 + (im.range.ext?.height ?? 0) / 2;
  let r = tl.nativeRow + 1;
  while (y >= altoFilaPx(r) && r < 5000) { y -= altoFilaPx(r); r++; }
  return r;
}
for (const im of ws.getImages()) {
  const fila = filaDeCentro(im);
  const prod = filas.get(fila);
  if (!prod || hechas.has(prod.code)) continue;
  const media = wb.getImage(im.imageId);
  if (!media?.buffer) continue;
  const archivo = `${prod.code.toLowerCase()}.webp`;
  const info = await sharp(media.buffer)
    .flatten({ background: "#ffffff" })
    .resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(DIR_IMG, archivo));
  prod.img = `/productos/${archivo}`;
  prod.w = info.width;
  prod.h = info.height;
  hechas.add(prod.code);
  conImagen++;
}

/* ---------- salida y resumen ---------- */
const lista = [...filas.values()];
fs.writeFileSync(SALIDA, JSON.stringify(lista, null, 1) + "\n");

const cuenta = (fn) => lista.reduce((m, p) => ((m[fn(p)] = (m[fn(p)] || 0) + 1), m), {});
console.log(`\nProductos en el catálogo: ${lista.length}`);
console.log(" · comprables (precio y stock):", lista.filter((p) => p.p > 0 && p.stock > 0).length);
console.log(" · agotados (con precio):", lista.filter((p) => p.p > 0 && p.stock === 0).length);
console.log(" · sin precio (cotizar, con stock):", lista.filter((p) => p.p === 0 && p.stock > 0).length);
console.log(" · con foto:", conImagen);
console.log("Omitidos: eliminar =", omitidos.eliminar.length, "| sin precio ni stock =", omitidos.sinPrecioNiStock.length, "| códigos duplicados =", omitidos.duplicado.length);
console.log("\nPor categoría:", cuenta((p) => p.c));
console.log("Por subtipo:", cuenta((p) => `${p.c}/${p.s}`));
fs.writeFileSync(path.join(RAIZ, "data", "catalogo-omitidos.json"), JSON.stringify(omitidos, null, 1) + "\n");
