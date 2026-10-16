import Link from "next/link";

export function Crumbs({ items }: { items: [string, string | null][] }) {
  return (
    <nav className="crumb" aria-label="Ruta">
      {items.map(([label, href], i) => (
        <span key={label} style={{ display: "contents" }}>
          {i > 0 && <span>/</span>}
          {href ? <Link href={href}>{label}</Link> : <span>{label}</span>}
        </span>
      ))}
    </nav>
  );
}
