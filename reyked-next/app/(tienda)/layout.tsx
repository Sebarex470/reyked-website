import { Suspense } from "react";
import { CartProvider } from "@/context/CartContext";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toast } from "@/components/Toast";
import { Reveal } from "@/components/Reveal";
import { WA } from "@/data/productos";

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <TopBar />
      <Suspense fallback={<header className="main"><div className="wrap hd" style={{ minHeight: 60 }} /></header>}>
        <Header />
      </Suspense>
      <main id="view" tabIndex={-1}>{children}</main>
      <Footer />
      <a className="wa" target="_blank" rel="noopener" href={`https://wa.me/${WA}`} aria-label="Escribir a Reyked por WhatsApp">
        <svg className="i" viewBox="0 0 24 24" style={{ width: 26, height: 26 }}>
          <path d="M4 20l1.3-4A8 8 0 1 1 8.2 19z" />
          <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.6-2-1-.8.8c-1-.4-1.9-1.3-2.3-2.3l.8-.8-1-2z" />
        </svg>
      </a>
      <Toast />
      <Reveal />
    </CartProvider>
  );
}
