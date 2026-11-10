import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { P, catName, estadoProducto, productoPorId } from "@/data/productos";
import { clp, conIva } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { Crumbs } from "@/components/Crumbs";
import { ProductBuy } from "@/components/ProductBuy";
import { ProductCard, StockLabel } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";

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
    ...(p.img ? { openGraph: { images: [{ url: p.img, width: p.w, height: p.h, alt: p.n }] } } : {}),
  };
}

export default async function Producto({ params }: Props) {
  const { id } = await params;
  const p = productoPorId[id];
  if (!p) notFound();
  const e = estadoProducto(p);
  const rel = P.filter((x) => x.c === p.c && x.s === p.s && x.id !== p.id).concat(P.filter((x) => x.c === p.c && x.s !== p.s && x.id !== p.id)).filter((x) => x.p > 0 && x.stock > 0).slice(0, 4);

  // Datos estructurados (SEO). Precio con IVA, que es lo que paga el cliente; sin oferta si el precio es a consultar.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.n,
    sku: p.code,
    category: catName(p.c),
    url: `${SITE_URL}/producto/${p.id}`,
    ...(p.img ? { image: `${SITE_URL}${p.img}` } : {}),
    ...(p.p > 0
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "CLP",
            price: conIva(p.p),
            availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${SITE_URL}/producto/${p.id}`,
            seller: { "@type": "Organization", name: "Comercializadora Reyked" },
          },
        }
      : {}),
  };

  return (
    <div className="wrap page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Crumbs items={[["Inicio", "/"], ["Tienda", "/tienda"], [catName(p.c), `/tienda/${p.c}`], [p.n, null]]} />
      <div className="pdp">
        <div className="big" role={p.img ? undefined : "img"} aria-hidden={p.img ? undefined : true}>
          <ProductImage p={p} sizes="(max-width:860px) 92vw, 560px" priority />
        </div>
        <div>
          <div className="eyebrow">{catName(p.c)} · {p.s}</div>
          <h1>{p.n}</h1>
          <StockLabel p={p} />
          {p.p > 0 ? (
            <>
              <div className="price">{clp(p.p)}<small>+ IVA</small></div>
              <div className="fine">Total con IVA: {clp(conIva(p.p))} por unidad.</div>
            </>
          ) : (
            <div className="fine" style={{ margin: "10px 0" }}>Escríbenos y te cotizamos este producto.</div>
          )}
          <ProductBuy id={p.id} />
          <dl className="spec">
            <div><dt>Código</dt><dd>{p.code}</dd></div>
            <div><dt>Categoría</dt><dd>{catName(p.c)}</dd></div>
            <div><dt>Tipo</dt><dd>{p.s}</dd></div>
            {e !== "cotizar" && <div><dt>Stock</dt><dd>{p.stock > 0 ? `${p.stock} unidades` : "Sin stock por ahora"}</dd></div>}
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
