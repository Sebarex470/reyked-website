/** Comprobante del último pedido, para mostrarlo en /pedido (solo en esta pestaña). */
export interface Comprobante {
  id: string;
  items: { n: string; q: number; p: number }[];
  sub: number;
  iva: number;
  total: number;
  del: string;
  addr: string;
  name: string;
  phone: string;
  mail: string;
  rut: string;
}
export const KEY_COMPROBANTE = "reyked-order";
