import type { MetadataRoute } from "next";
import { CATS, P } from "@/data/productos";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const fijas = ["", "/tienda", "/nosotros", "/envios", "/cambios", "/contacto"];
  return [
    ...fijas.map((r) => ({ url: SITE_URL + r, changeFrequency: "weekly" as const, priority: r === "" ? 1 : 0.7 })),
    ...CATS.map((c) => ({ url: `${SITE_URL}/tienda/${c.k}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...P.map((p) => ({ url: `${SITE_URL}/producto/${p.id}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
