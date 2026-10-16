"use client";

import { useCallback, useEffect, useState } from "react";
import type { DatosAdmin } from "@/lib/tipos";
import { api, NoAutenticado } from "./api";
import { Resumen } from "./Resumen";
import { Pedidos } from "./Pedidos";
import { Dinero } from "./Dinero";
import { Facturas } from "./Facturas";
import { Clientes } from "./Clientes";
import { Productos } from "./Productos";

const TABS = [
  ["resumen", "Resumen"],
  ["pedidos", "Pedidos"],
  ["dinero", "Dinero"],
  ["facturas", "Facturas"],
  ["clientes", "Clientes"],
  ["productos", "Productos"],
] as const;
type Tab = (typeof TABS)[number][0];

export interface VistaProps {
  datos: DatosAdmin;
  recargar: () => Promise<void>;
  avisar: (m: string) => void;
}

export function AdminApp() {
  const [estado, setEstado] = useState<"cargando" | "fuera" | "dentro">("cargando");
  const [datos, setDatos] = useState<DatosAdmin | null>(null);
  const [tab, setTab] = useState<Tab>("resumen");
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");

  const recargar = useCallback(async () => {
    try {
      setDatos(await api<DatosAdmin>("datos"));
      setEstado("dentro");
      setError("");
    } catch (e) {
      if (e instanceof NoAutenticado) setEstado("fuera");
      else { setError(e instanceof Error ? e.message : "Error"); setEstado((s) => (s === "cargando" ? "fuera" : s)); }
    }
  }, []);

  useEffect(() => { void recargar(); }, [recargar]);

  const avisar = (m: string) => {
    setAviso(m);
    setTimeout(() => setAviso(""), 2500);
  };

  if (estado === "cargando") return <div className="adm-wrap"><p>Cargando…</p></div>;
  if (estado === "fuera") return <Login onOk={recargar} errorInicial={error} />;

  const props: VistaProps = { datos: datos!, recargar, avisar };
  return (
    <div className="adm-wrap">
      <header className="adm-head">
        <div className="logo">REY<b>KED</b><small>Administración</small></div>
        <div className="btnrow">
          <a className="btn" href="/">Ver tienda</a>
          <button className="btn" onClick={async () => { await api("logout", "POST").catch(() => {}); setEstado("fuera"); }}>Cerrar sesión</button>
        </div>
      </header>
      <nav className="adm-tabs" aria-label="Secciones">
        {TABS.map(([k, n]) => (
          <button key={k} className={tab === k ? "on" : ""} aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}>{n}</button>
        ))}
      </nav>
      {error && <p className="err">{error}</p>}
      {tab === "resumen" && <Resumen {...props} />}
      {tab === "pedidos" && <Pedidos {...props} />}
      {tab === "dinero" && <Dinero {...props} />}
      {tab === "facturas" && <Facturas {...props} />}
      {tab === "clientes" && <Clientes {...props} />}
      {tab === "productos" && <Productos {...props} />}
      <div className={"toast" + (aviso ? " on" : "")} role="status" aria-live="polite">{aviso}</div>
    </div>
  );
}

function Login({ onOk, errorInicial }: { onOk: () => Promise<void>; errorInicial: string }) {
  const [err, setErr] = useState(errorInicial);
  const [busy, setBusy] = useState(false);
  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setErr("");
    try {
      await api("login", "POST", { user: f.get("user"), password: f.get("password") });
      await onOk();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="adm-login">
      <form className="box" onSubmit={enviar}>
        <div className="logo">REY<b>KED</b><small>Administración</small></div>
        <h1>Iniciar sesión</h1>
        <label className="f">Usuario<input name="user" autoComplete="username" required /></label>
        <label className="f">Contraseña<input name="password" type="password" autoComplete="current-password" required /></label>
        <div className="err" role="alert">{err}</div>
        <button className="btn primary" type="submit" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </div>
  );
}
