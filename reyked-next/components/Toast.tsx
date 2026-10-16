"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export function Toast() {
  const { toast } = useCart();
  return (
    <div className={"toast" + (toast.on ? " on" : "")} id="toast" role="status" aria-live="polite">
      {toast.msg && <span>{toast.msg}</span>}
      {toast.msg && toast.link && <Link href="/carrito">Ver carrito</Link>}
    </div>
  );
}
