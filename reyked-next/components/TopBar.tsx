import { STORE_HOURS, WHATSAPP_NUMBER } from "@/lib/site";

export function TopBar() {
  return (
    <div className="top">
      <div className="wrap">
        <span>Concepción · {STORE_HOURS}</span>
        <span>Tel. 41 260 4612 · WhatsApp {WHATSAPP_NUMBER}</span>
      </div>
    </div>
  );
}
