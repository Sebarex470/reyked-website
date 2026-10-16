"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CATS } from "@/data/productos";
import { useCart } from "@/context/CartContext";

type Menu = "shop" | "info" | null;
const Chevron = () => (
  <svg className="i" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const { totals, bumpKey } = useCart();
  const [navOpen, setNavOpen] = useState(false);
  const [menu, setMenu] = useState<Menu>(null);
  const [q, setQ] = useState(params.get("q") ?? "");
  const countRef = useRef<HTMLSpanElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const section = pathname.startsWith("/tienda") || pathname.startsWith("/producto") ? "tienda"
    : pathname === "/nosotros" ? "nosotros"
    : pathname === "/envios" || pathname === "/cambios" ? "info"
    : pathname === "/contacto" ? "contacto" : "";
  const cur = (k: string) => (section === k ? ({ "aria-current": "page" } as const) : {});

  // Cierra menús al navegar; mantiene el buscador alineado con la URL.
  useEffect(() => {
    setNavOpen(false);
    setMenu(null);
  }, [pathname]);
  useEffect(() => setQ(params.get("q") ?? ""), [params]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".dd")) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        setNavOpen(false);
      }
    };
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Contador que rebota.
  useEffect(() => {
    const el = countRef.current;
    if (!el || bumpKey === 0) return;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }, [bumpKey]);

  const goSearch = (value: string, replace: boolean) => {
    const sp = new URLSearchParams(params.toString());
    if (value.trim()) sp.set("q", value);
    else sp.delete("q");
    const base = pathname.startsWith("/tienda") ? pathname : "/tienda";
    const url = sp.toString() ? `${base}?${sp}` : base;
    if (replace) router.replace(url, { scroll: false });
    else router.push(url);
  };

  return (
    <header className="main">
      <div className="wrap hd">
        <Link className="logo" href="/" aria-label="Reyked, inicio">
          REY<b>KED</b>
          <small>Comercializadora</small>
        </Link>
        <nav className={"links" + (navOpen ? " open" : "")} id="nav" aria-label="Principal" ref={navRef}>
          <div className={"dd" + (menu === "shop" ? " open" : "")} id="ddShop">
            <button type="button" aria-expanded={menu === "shop"} {...cur("tienda")}
              onClick={() => setMenu(menu === "shop" ? null : "shop")}>
              Tienda <Chevron />
            </button>
            <div className="menu" id="menuShop">
              <Link className="all" href="/tienda">Ver toda la tienda</Link>
              {CATS.map((c) => (
                <Link key={c.k} href={`/tienda/${c.k}`}>{c.n}</Link>
              ))}
            </div>
          </div>
          <Link href="/nosotros" {...cur("nosotros")}>Nosotros</Link>
          <div className={"dd" + (menu === "info" ? " open" : "")} id="ddInfo">
            <button type="button" aria-expanded={menu === "info"} {...cur("info")}
              onClick={() => setMenu(menu === "info" ? null : "info")}>
              Info <Chevron />
            </button>
            <div className="menu">
              <Link href="/envios">Envíos y retiro</Link>
              <Link href="/cambios">Cambios y devoluciones</Link>
            </div>
          </div>
          <Link href="/contacto" {...cur("contacto")}>Contacto</Link>
        </nav>
        <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); goSearch(q, false); }}>
          <label htmlFor="q" style={{ position: "absolute", left: -9999 }}>Buscar productos</label>
          <input id="q" type="search" placeholder="Buscar: cono, alcohol gel…" autoComplete="off" value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (pathname.startsWith("/tienda")) goSearch(e.target.value, true);
            }} />
        </form>
        <div className="hd-actions">
          <Link className="cart-btn" id="cartLink" href="/carrito" aria-label="Ver carrito">
            <svg className="i" viewBox="0 0 24 24">
              <circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" />
              <path d="M2 3h3l2.6 12.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6" />
            </svg>
            <span className="t">Carrito</span>
            <span className="count" id="cartCount" ref={countRef}>{totals.n}</span>
          </Link>
          <button className="icon-btn burger" id="burger" type="button" aria-label="Abrir menú" aria-expanded={navOpen}
            onClick={() => setNavOpen(!navOpen)}>
            <svg className="i" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </div>
    </header>
  );
}
