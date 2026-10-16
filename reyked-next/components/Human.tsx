import { WA } from "@/data/productos";

export function Human() {
  return (
    <div className="human">
      <div>
        <b>¿Dudas con qué elegir?</b>
        <span>Escríbenos y te responde una persona del equipo.</span>
      </div>
      <a className="btn signal" target="_blank" rel="noopener"
        href={`https://wa.me/${WA}?text=Hola%20Reyked%2C%20necesito%20ayuda%20para%20elegir%20un%20producto.`}>
        Hablar por WhatsApp
      </a>
    </div>
  );
}
