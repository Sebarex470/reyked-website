"use client";

import { useRouter } from "next/navigation";
import { productoPorId } from "@/data/productos";
import { useCart } from "@/context/CartContext";
import { fly } from "@/lib/fly";

/** Acciones de compra: agregar (con bolita voladora y aviso) y comprar ahora (directo a checkout). */
export function useBuyActions() {
  const { add, notify, bump } = useCart();
  const router = useRouter();
  return {
    agregar(id: string, el: Element, n = 1) {
      add(id, n);
      notify(`${productoPorId[id].n} agregado`, true);
      fly(el, bump);
    },
    comprarAhora(id: string, n = 1) {
      add(id, n);
      router.push("/checkout");
    },
  };
}

export function AddButton({ id, className, label = "Agregar" }: { id: string; className: string; label?: string }) {
  const { agregar } = useBuyActions();
  return (
    <button className={className} onClick={(e) => agregar(id, e.currentTarget)} aria-label={`Agregar ${productoPorId[id].n} al carrito`}>
      {label}
    </button>
  );
}
