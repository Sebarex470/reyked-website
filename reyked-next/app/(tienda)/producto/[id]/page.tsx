import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { P, catName, productoPorId } from "@/data/productos";
import { clp, conIva } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { Crumbs } from "@/components/Crumbs";
import { Glyph } from "@/components/Glyph";
import { ProductBuy } from "@/components/ProductBuy";
import { ProductCard } from "@/components/ProductCard";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => P.map((p) => ({ id: p.id }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = productoPorId[id];
  if (!p) return {};
  return {
    title: p.n,
    description: `${p.n} (${catName(p.c)}) en Reyked, Concepción. Retiro en tienda y envíos a todo Chile.`,
    alternates: { canonical: `/producto/${p.id}` },
  };
}

export default async function Producto({ params }: Props) {
  const { id } = await params;
  const p = productoPorId[id];
  if (!p) notFound();
  const rel = P.filter((x) => x.c === p.c && x.id !== p.id).slice(0, 4);

  // Datos estructurados (SEO). Precio con IVA, que es lo que paga el cliente. Revisar al cargar el catálogo real.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.n,
    category: catName(p.c),
    url: `${SITE_URL}/producto/${p.id}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "CLP",
      price: conIva(p.p),
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/producto/${p.id}`,
      seller: { "@type": "Organization", name: "Comercializadora Reyked" },
    },
  };

  return (
    <div className="wrap page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Crumbs items={[["Inicio", "/"], ["Tienda", "/tienda"], [catName(p.c), `/tienda/${p.c}`], [p.n, null]]} />
      <div className="pdp">
        <div className="big" aria-hidden="true"><Glyph g={p.g} /></div>
        <div>
          <div className="eyebrow">{catName(p.c)} · {p.s}</div>
          <h1>{p.n}</h1>
          <div className="stock">En stock</div>
          <div className="price">{clp(p.p)}<small>+ IVA</small></div>
          <div className="fine">Precio de ejemplo. Total con IVA: {clp(conIva(p.p))} por unidad.</div>
          <ProductBuy id={p.id} />
          <dl className="spec">
            <div><dt>Categoría</dt><dd>{catName(p.c)}</dd></div>
            <div><dt>Tipo</dt><dd>{p.s}</dd></div>
            <div><dt>Retiro</dt><dd>Las Heras 2241, local 7, Concepción</dd></div>
            <div><dt>Despacho</dt><dd>Todo Chile, por pagar</dd></div>
          </dl>
        </div>
      </div>
      {rel.length > 0 && (
        <section className="sec">
          <div className="sec-h">
            <h2>Más en {catName(p.c)}</h2>
            <Link href={`/tienda/${p.c}`}>Ver categoría →</Link>
          </div>
          <div className="grid">{rel.map((x) => <ProductCard key={x.id} p={x} />)}</div>
        </section>
      )}
    </div>
  );
}
