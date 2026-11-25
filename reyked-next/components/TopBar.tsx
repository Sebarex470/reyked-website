import { STORE_HOURS, WHATSAPP_NUMBER, WHATSAPP_URL } from "@/lib/site";

export function TopBar() {
  return (
    <div className="top">
      <div className="wrap top-inner">
        <div className="top-hours">
          <strong>Retiro en Concepción</strong>
          <span>{STORE_HOURS}</span>
        </div>
        <div className="top-links">
          <a href="tel:+56412604612">Tel. 41 260 4612</a>
          <a className="top-whatsapp" href={WHATSAPP_URL}>WhatsApp {WHATSAPP_NUMBER}</a>
        </div>
      </div>
    </div>
  );
}
