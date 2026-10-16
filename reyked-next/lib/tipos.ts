export const ESTADOS_PEDIDO = ["Pendiente", "Confirmado", "Preparando", "Despachado", "Entregado", "Cancelado"] as const;
export const ESTADOS_PAGO = ["Pendiente", "Pagado", "Reembolsado"] as const;
export const TIPOS_DOC = ["boleta", "factura", "ninguno"] as const;
export const ESTADOS_DOC = ["Por emitir", "Emitido", "Anulado"] as const;
export const CATEGORIAS_GASTO = ["Mercadería", "Arriendo", "Sueldos", "Transporte", "Servicios", "Marketing", "Impuestos", "Otros"] as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];
export type EstadoPago = (typeof ESTADOS_PAGO)[number];
export type TipoDoc = (typeof TIPOS_DOC)[number];
export type EstadoDoc = (typeof ESTADOS_DOC)[number];

export interface ItemPedido {
  id: string;
  n: string;
  q: number;
  /** precio neto unitario al momento de la compra */
  p: number;
  /** costo neto unitario al momento de la compra (0 si no se ha cargado) */
  costo: number;
}

export interface Documento {
  tipo: TipoDoc;
  estado: EstadoDoc;
  numero: string;
  /** YYYY-MM-DD */
  fecha: string;
  /** enlace al PDF en el proveedor de facturación (http/https) */
  url: string;
}

export interface Pedido {
  id: string;
  fecha: string;
  estado: EstadoPedido;
  pago: EstadoPago;
  medioPago: string;
  pagadoEn: string;
  items: ItemPedido[];
  sub: number;
  iva: number;
  total: number;
  entrega: "retiro" | "envio";
  dir: string;
  cliente: { nombre: string; tel: string; mail: string; rut: string };
  documento: Documento;
  nota: string;
}

export interface Gasto {
  id: string;
  /** YYYY-MM-DD */
  fecha: string;
  categoria: string;
  descripcion: string;
  /** monto total pagado (CLP) */
  monto: number;
  /** true = el gasto tiene factura con IVA recuperable */
  conIva: boolean;
}

export interface Ajustes {
  /** presupuesto mensual de gastos (CLP) */
  presupuesto: number;
}

export interface DatosAdmin {
  pedidos: Pedido[];
  gastos: Gasto[];
  ajustes: Ajustes;
  /** costo neto por id de producto */
  costos: Record<string, number>;
}
