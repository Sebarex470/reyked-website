/** Bolita que vuela desde el botón hasta el carrito. Devuelve false si no hay animación (movimiento reducido). */
export function fly(from: Element, onFinish: () => void): boolean {
  if (typeof document === "undefined" || !document.body.animate) return false;
  if (window.matchMedia?.("(prefers-reduced-motion:reduce)").matches) return false;
  const target = document.getElementById("cartLink");
  if (!target) return false;
  const to = target.getBoundingClientRect();
  const f = from.getBoundingClientRect();
  const sx = f.left + f.width / 2;
  const sy = f.top + f.height / 2;
  const dx = to.left + to.width / 2 - sx;
  const dy = to.top + to.height / 2 - sy;
  const d = document.createElement("div");
  d.className = "dot";
  d.style.left = sx - 9 + "px";
  d.style.top = sy - 9 + "px";
  document.body.appendChild(d);
  const a = d.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 70}px) scale(1.2)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(.3)`, opacity: 0.6 },
    ],
    { duration: 650, easing: "cubic-bezier(.5,0,.7,.4)" },
  );
  a.onfinish = () => {
    d.remove();
    onFinish();
  };
  return true;
}
