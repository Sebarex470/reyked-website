/** URL pública del sitio (SEO, sitemap, datos estructurados). Definir NEXT_PUBLIC_SITE_URL en Vercel. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://reyked.cl").replace(/\/$/, "");

export const STORE_TAGLINE = "Higiene & Seguridad";
export const STORE_NAME = `Reyked ${STORE_TAGLINE}`;
export const STORE_ADDRESS = "Lautaro 775, Concepción";
export const STORE_HOURS = "Lunes a jueves, 9:00–18:00 · Viernes, 9:00–17:30";
export const CONTACT_EMAIL = "ventas@reyked.cl";
export const WHATSAPP_NUMBER = "+56 9 5647 4595";
export const WHATSAPP_URL = "https://wa.me/" + WHATSAPP_NUMBER.replace(/\D/g, "");
export const INSTAGRAM_HANDLE = "reyked.cl";
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;
export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=100078818228310";
