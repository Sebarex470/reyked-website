import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    // URLs típicas de WordPress/WooCommerce → rutas nuevas. VERIFICAR contra las URLs reales de reyked.cl
    // (sitemap viejo o Search Console) antes del cambio de dominio y completar los slugs de producto.
    return [
      { source: "/categoria-producto/:cat", destination: "/tienda/:cat", permanent: true },
      { source: "/categoria-producto/:cat/:sub*", destination: "/tienda/:cat", permanent: true },
      { source: "/producto-categoria/:cat", destination: "/tienda/:cat", permanent: true },
      { source: "/finalizar-compra", destination: "/checkout", permanent: true },
      { source: "/mi-cuenta", destination: "/", permanent: true },
      { source: "/quienes-somos", destination: "/nosotros", permanent: true },
      { source: "/envios-y-retiro", destination: "/envios", permanent: true },
      { source: "/cambios-y-devoluciones", destination: "/cambios", permanent: true },
      { source: "/contactenos", destination: "/contacto", permanent: true },
    ];
  },
};

export default nextConfig;
