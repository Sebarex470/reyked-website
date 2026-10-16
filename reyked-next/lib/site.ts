/** URL pública del sitio (SEO, sitemap, datos estructurados). Definir NEXT_PUBLIC_SITE_URL en Vercel. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://reyked.cl").replace(/\/$/, "");
