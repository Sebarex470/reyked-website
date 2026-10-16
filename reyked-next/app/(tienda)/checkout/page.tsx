import type { Metadata } from "next";
import { CheckoutView } from "@/components/CheckoutView";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default function Checkout() {
  return <CheckoutView />;
}
