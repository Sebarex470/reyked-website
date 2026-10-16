import Link from "next/link";
import { CATS } from "@/data/productos";

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="fg">
          <div>
            <Link className="logo" href="/" style={{ fontSize: 34 }}>REY<b>KED</b></Link>
            <p style={{ marginTop: 10 }}>Productos de aseo y seguridad industrial en Concepción, con envíos a todo Chile.</p>
          </div>
          <div>
            <h4>Tienda</h4>
            <div id="footShop">
              <Link href="/tienda">Toda la tienda</Link>
              {CATS.map((c) => (
                <Link key={c.k} href={`/tienda/${c.k}`}>{c.n}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4>Info</h4>
            <Link href="/nosotros">Nosotros</Link>
            <Link href="/envios">Envíos y retiro</Link>
            <Link href="/cambios">Cambios y devoluciones</Link>
            <Link href="/contacto">Contacto</Link>
          </div>
          <div>
            <h4>Contacto</h4>
            <p>Calle Las Heras 2241, local 7, Concepción</p>
            <p>Lun a vie, 9:00–14:00 y 15:00–19:00</p>
            <p>WhatsApp +56 9 5647 4595</p>
            <p>ventas@reyked.cl</p>
            <a href="https://www.instagram.com/rey.ked/">Instagram @rey.ked</a>
            <a href="https://www.facebook.com/profile.php?id=100078818228310">Facebook Rey Ked</a>
          </div>
        </div>
        <div className="copy">
          <span>© 2026 Comercializadora Reyked</span>
          <span>Propuesta de diseño: precios y textos de ejemplo</span>
        </div>
      </div>
    </footer>
  );
}
