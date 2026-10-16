import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap page">
      <h1>No encontramos esa página</h1>
      <p className="sub">Puede que el enlace haya cambiado. Prueba desde la tienda o escríbenos.</p>
      <div className="btnrow">
        <Link className="btn primary" href="/tienda">Ir a la tienda</Link>
        <Link className="btn" href="/">Volver al inicio</Link>
      </div>
    </div>
  );
}
