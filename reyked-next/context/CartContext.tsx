"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { IVA, productoPorId } from "@/data/productos";

const KEY = "reyked-cart";

type Cart = Record<string, number>;

interface ToastState {
  msg: string;
  link: boolean;
  on: boolean;
}

interface CartCtx {
  cart: Cart;
  /** true cuando el carrito ya se leyó de localStorage (evita redirigir por un carrito "vacío" transitorio). */
  ready: boolean;
  totals: { sub: number; iva: number; total: number; n: number };
  add: (id: string, n?: number) => void;
  setQty: (id: string, q: number) => void;
  clear: () => void;
  toast: ToastState;
  notify: (msg: string, link?: boolean) => void;
  /** Cambia cada vez que el contador del carrito debe "rebotar". */
  bumpKey: number;
  bump: () => void;
}

const Ctx = createContext<CartCtx | null>(null);

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return c;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({});
  const [loaded, setLoaded] = useState(false);
  const [bumpKey, setBumpKey] = useState(0);
  const [toast, setToast] = useState<ToastState>({ msg: "", link: false, on: false });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Carga desde localStorage tras montar (evita desajustes de hidratación).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const o = JSON.parse(raw) as Record<string, unknown>;
        const next: Cart = {};
        for (const k of Object.keys(o)) {
          const q = Number(o[k]);
          if (productoPorId[k] && q > 0) next[k] = Math.min(999, q | 0);
        }
        setCart(next);
      }
    } catch {
      /* sin almacenamiento o JSON inválido */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch {
      /* sin almacenamiento */
    }
  }, [cart, loaded]);

  const add = useCallback((id: string, n = 1) => {
    setCart((c) => ({ ...c, [id]: Math.min(999, (c[id] || 0) + n) }));
  }, []);

  const setQty = useCallback((id: string, q: number) => {
    setCart((c) => {
      const next = { ...c };
      if (q <= 0) delete next[id];
      else next[id] = Math.min(999, q);
      return next;
    });
  }, []);

  const clear = useCallback(() => setCart({}), []);

  const notify = useCallback((msg: string, link = false) => {
    setToast({ msg, link, on: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((t) => ({ ...t, on: false })), 2800);
  }, []);

  const bump = useCallback(() => setBumpKey((k) => k + 1), []);

  const totals = useMemo(() => {
    let sub = 0;
    let n = 0;
    for (const k of Object.keys(cart)) {
      sub += productoPorId[k].p * cart[k];
      n += cart[k];
    }
    const iva = Math.round(sub * IVA);
    return { sub, iva, total: sub + iva, n };
  }, [cart]);

  const value = useMemo(
    () => ({ cart, ready: loaded, totals, add, setQty, clear, toast, notify, bumpKey, bump }),
    [cart, loaded, totals, add, setQty, clear, toast, notify, bumpKey, bump],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
