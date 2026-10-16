import type { Metadata } from "next";
import { DoneView } from "@/components/DoneView";

export const metadata: Metadata = { title: "Pedido", robots: { index: false } };

export default function Pedido() {
  return <DoneView />;
}
