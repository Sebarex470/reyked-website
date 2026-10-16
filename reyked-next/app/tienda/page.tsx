import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopView } from "@/components/ShopView";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Productos de aseo, construcción, contenedores, carga y levante, seguridad industrial y seguridad vial.",
  alternates: { canonical: "/tienda" },
};

export default function Tienda() {
  return (
    <Suspense fallback={null}>
      <ShopView cat="all" />
    </Suspense>
  );
}
