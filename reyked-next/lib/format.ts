import { IVA } from "@/data/productos";

const CLP = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
export const clp = (n: number) => CLP.format(n);
export const conIva = (neto: number) => Math.round(neto * (1 + IVA));
