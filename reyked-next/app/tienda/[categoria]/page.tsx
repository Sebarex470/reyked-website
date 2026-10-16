import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CATS, catPorKey, type CategoriaKey } from "@/data/productos";
import { ShopView } from "@/components/ShopView";

type Props = { params: Promise<{ categoria: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => CATS.map((c) => ({ categoria: c.k }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const c = catPorKey[categoria as CategoriaKey];
  if (!c) return {};
  return {
    title: c.n,
    description: `${c.n}: productos de Reyked con envíos a todo Chile y retiro en Concepción.`,
    alternates: { canonical: `/tienda/${c.k}` },
  };
}

export default async function Categoria({ params }: Props) {
  const { categoria } = await params;
  if (!catPorKey[categoria as CategoriaKey]) notFound();
  return (
    <Suspense fallback={null}>
      <ShopView cat={categoria as CategoriaKey} />
    </Suspense>
  );
}
