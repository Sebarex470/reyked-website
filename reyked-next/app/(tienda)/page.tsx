import Link from "next/link";
import { CATS, P, porPopularidad } from "@/data/productos";
import { clp } from "@/lib/format";
import { Glyph } from "@/components/Glyph";
import { AddButton } from "@/components/AddButton";
import { ProductCard } from "@/components/ProductCard";
import { HeroGrid } from "@/components/HeroGrid";
import { Human } from "@/components/Human";

export default function Inicio() {
  const top = porPopularidad.slice(0, 3);
  const ribbon = "Seguridad industrial ◆ Aseo ◆ Seguridad vial ◆ Envíos a todo Chile ◆ Retiro en Concepción ◆ ";
  return (
    <>
      <HeroGrid>
        <div className="wrap">
          <div>
            <div className="eyebrow">Aseo · Seguridad industrial · Seguridad vial</div>
            <h1>
              Todo para <em>seguridad</em> industrial y{" "}
              <span className="squig">
                aseo
                <svg viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2 8 C 14 1, 24 12, 38 6 S 62 2, 74 7 S 92 10, 98 4" />
                </svg>
              </span>
            </h1>
            <p className="lead">
              Somos Reyked, de Concepción. Te ayudamos a equipar tu bodega, obra o local con productos de aseo y seguridad.
              Si no sabes cuál elegir, te asesoramos antes de que compres.
            </p>
            <div className="btnrow">
              <Link className="btn primary" href="/tienda">Ver la tienda</Link>
              <Link className="btn" href="/contacto">Cotizar por volumen</Link>
            </div>
          </div>
          <div className="quick">
            <div className="qhead">
              <div>
                <div className="eyebrow">Compra rápida</div>
                <h2>Lo más pedido</h2>
              </div>
              <svg className="stamp" viewBox="0 0 100 100" aria-hidden="true">
                <defs>
                  <path id="ring" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" />
                </defs>
                <circle className="c" cx="50" cy="50" r="24" />
                <text className="r" x="50" y="60" textAnchor="middle">RK</text>
                <text>
                  <textPath href="#ring" textLength={236} lengthAdjust="spacing">ATENCIÓN PERSONALIZADA · CONCEPCIÓN · </textPath>
                </text>
              </svg>
            </div>
            {top.map((p) => (
              <div className="q-item" key={p.id}>
                <div className="g" aria-hidden="true"><Glyph g={p.g} /></div>
                <div>
                  <Link className="n" href={`/producto/${p.id}`}>{p.n}</Link>
                  <div className="p">{clp(p.p)} + IVA</div>
                </div>
                <AddButton id={p.id} className="mini" />
              </div>
            ))}
          </div>
        </div>
      </HeroGrid>

      <div className="ribbon" aria-hidden="true">
        <div className="track">
          <span>{ribbon}</span>
          <span>{ribbon}</span>
        </div>
      </div>

      <div className="wrap">
        <div className="perks">
          <div className="perk">
            <svg className="i" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6" /></svg>
            <div><b>Atención personalizada</b><span>Te ayudamos a elegir el producto correcto para tu faena.</span></div>
          </div>
          <div className="perk">
            <svg className="i" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h4" /></svg>
            <div><b>Compras seguras</b><span>Pedido con resumen claro, IVA desglosado y confirmación.</span></div>
          </div>
          <div className="perk">
            <svg className="i" viewBox="0 0 24 24"><path d="M2 6h12v10H2zM14 9h4l3 3v4h-7" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></svg>
            <div><b>Envíos a todo Chile</b><span>Despacho por pagar. También retiro en tienda.</span></div>
          </div>
        </div>

        <section className="sec">
          <div className="sec-h">
            <h2>Explora por categoría</h2>
            <Link href="/tienda">Ver toda la tienda →</Link>
          </div>
          <div className="tiles">
            {CATS.map((c) => {
              const n = P.filter((p) => p.c === c.k).length;
              return (
                <Link className="tile rv" href={`/tienda/${c.k}`} key={c.k}>
                  <span className="g" aria-hidden="true"><Glyph g={c.g} /></span>
                  <b>{c.n}</b>
                  <span className="c">{n} {n === 1 ? "producto" : "productos"}</span>
                  <span className="go">Ver categoría →</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="sec">
          <div className="sec-h">
            <h2>Productos destacados</h2>
            <Link href="/tienda">Ver todos →</Link>
          </div>
          <div className="grid">
            {porPopularidad.slice(0, 4).map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        <Human />
      </div>
    </>
  );
}
