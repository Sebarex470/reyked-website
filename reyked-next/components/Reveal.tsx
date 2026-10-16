"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Entrada suave de tarjetas al hacer scroll (.card, .perk, .rv). Observa el DOM para cubrir listas filtradas. */
export function Reveal() {
  const pathname = usePathname();
  useEffect(() => {
    const main = document.getElementById("view");
    if (!main) return;
    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (es) =>
              es.forEach((x) => {
                if (x.isIntersecting) {
                  x.target.classList.add("in");
                  io?.unobserve(x.target);
                }
              }),
            { rootMargin: "0px 0px -6% 0px" },
          )
        : null;
    const run = () =>
      document.querySelectorAll<HTMLElement>(".card,.perk,.rv").forEach((n) => {
        if (n.dataset.rv) return;
        n.dataset.rv = "1";
        n.classList.add("rv");
        if (io) io.observe(n);
        else n.classList.add("in");
      });
    run();
    const mo = new MutationObserver(run);
    mo.observe(main, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io?.disconnect();
    };
  }, [pathname]);
  return null;
}
