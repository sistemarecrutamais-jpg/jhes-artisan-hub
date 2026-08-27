import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/lib/use-admin-session";

const NAV = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/pedidos", label: "Pedidos" },
  { to: "/admin/agenda", label: "Agenda" },
  { to: "/admin/produtos", label: "Produtos" },
  { to: "/admin/categorias", label: "Categorias" },
  { to: "/admin/materiais", label: "Materiais" },
  { to: "/admin/financeiro", label: "Financeiro" },
  { to: "/admin/relatorios", label: "Relatórios" },
  { to: "/admin/configuracoes", label: "Configurações" },
  { to: "/admin/change-password", label: "Minha conta" },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const session = useAdminSession();

  if (session.status !== "authorized") return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-display text-lg font-semibold">Ateliê da JHE</p>
            <p className="text-xs text-muted-foreground">Painel administrativo</p>
          </div>

          <nav className="hidden items-center gap-5 sm:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
                activeOptions={{ exact: n.to === "/admin" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() =>
              supabase.auth.signOut().then(() => window.location.assign("/admin/login"))
            }
            className="shrink-0 rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-secondary"
          >
            Sair
          </button>
        </div>

        <nav className="mx-auto mt-3 flex w-full max-w-6xl gap-4 overflow-x-auto sm:hidden">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="whitespace-nowrap text-sm font-medium text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: n.to === "/admin" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
