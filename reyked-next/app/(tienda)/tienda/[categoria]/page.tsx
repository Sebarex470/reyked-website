import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CATS_ACTIVAS, type CategoriaKey } from "@/data/productos";
import { ShopView } from "@/components/ShopView";

type Props = { params: Promise<{ categoria: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => CATS_ACTIVAS.map((c) => ({ categoria: c.k }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const c = CATS_ACTIVAS.find((x) => x.k === categoria);
  if (!c) return {};
  return {
    title: c.n,
    description: `${c.n}: productos de Reyked con envíos a todo Chile y retiro en Concepción.`,
    alternates: { canonical: `/tienda/${c.k}` },
  };
}

export default async function Categoria({ params }: Props) {
  const { categoria } = await params;
  if (!CATS_ACTIVAS.some((c) => c.k === categoria)) notFound();
  return (
    <Suspense fallback={null}>
      <ShopView cat={categoria as CategoriaKey} />
    </Suspense>
  );
}
