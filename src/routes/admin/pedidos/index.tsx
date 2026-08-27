import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/lib/use-admin-session";
import { money, formatDate, isLate, STATUS_LABEL, STATUS_ORDER } from "@/lib/format";
import { whatsappLink, formatBrPhone } from "@/lib/whatsapp";

export const Route = createFileRoute("/admin/pedidos/")({
  head: () => ({ meta: [{ title: "Pedidos | Ateliê da JHE" }] }),
  component: PedidosPage,
});

const STATUS_FILTERS = ["todos", ...STATUS_ORDER] as const;
const ORIGIN_FILTERS = ["todas", "site", "manual"] as const;

type SortKey =
  "recentes" | "antigos" | "entrega_proxima" | "maior_valor" | "menor_valor" | "atrasados";

function PedidosPage() {
  const session = useAdminSession();
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("todos");
  const [origin, setOrigin] = useState<(typeof ORIGIN_FILTERS)[number]>("todas");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recentes");

  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
    enabled: session.status === "authorized",
  });

  const filtered = useMemo(() => {
    let rows = ordersQuery.data ?? [];

    if (status !== "todos") rows = rows.filter((o) => o.status === status);
    if (origin !== "todas") rows = rows.filter((o) => o.origin === origin);

    const term = search.trim().toLowerCase();
    if (term) {
      const digits = term.replace(/\D/g, "");
      rows = rows.filter(
        (o) =>
          String(o.order_number).includes(term) ||
          o.customer_name.toLowerCase().includes(term) ||
          (digits && o.customer_phone.replace(/\D/g, "").includes(digits)),
      );
    }

    const sorted = [...rows];
    switch (sort) {
      case "recentes":
        sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
        break;
      case "antigos":
        sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
        break;
      case "entrega_proxima":
        sorted.sort((a, b) =>
          (a.expected_date ?? "9999-99-99").localeCompare(b.expected_date ?? "9999-99-99"),
        );
        break;
      case "maior_valor":
        sorted.sort((a, b) => b.total - a.total);
        break;
      case "menor_valor":
        sorted.sort((a, b) => a.total - b.total);
        break;
      case "atrasados":
        sorted.sort((a, b) => Number(isLate(b)) - Number(isLate(a)));
        break;
    }
    return sorted;
  }, [ordersQuery.data, status, origin, search, sort]);

  if (session.status !== "authorized") return null;

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display text-2xl font-semibold">Pedidos</h1>
        <Link
          to="/admin/pedidos/novo"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Novo pedido
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <FilterPill key={s} active={status === s} onClick={() => setStatus(s)}>
            {s === "todos" ? "Todos" : STATUS_LABEL[s]}
          </FilterPill>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {ORIGIN_FILTERS.map((o) => (
          <FilterPill key={o} active={origin === o} onClick={() => setOrigin(o)}>
            {o === "todas" ? "Todas as origens" : o === "site" ? "Site" : "Manual"}
          </FilterPill>
        ))}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número, nome ou telefone"
          className="ml-auto min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-1.5 text-sm outline-none focus:border-primary sm:max-w-xs"
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-sm outline-none focus:border-primary"
        >
          <option value="recentes">Mais recentes</option>
          <option value="antigos">Mais antigos</option>
          <option value="entrega_proxima">Entrega mais próxima</option>
          <option value="maior_valor">Maior valor</option>
          <option value="menor_valor">Menor valor</option>
          <option value="atrasados">Atrasados primeiro</option>
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Origem</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Previsão</th>
              <th className="px-4 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {ordersQuery.isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((o) => {
                const late = isLate(o);
                const wa = whatsappLink(o.customer_phone);
                return (
                  <tr
                    key={o.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to="/admin/pedidos/$id"
                        params={{ id: o.id }}
                        className="font-semibold text-primary hover:underline"
                      >
                        #{o.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.customer_name}</p>
                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary hover:underline"
                        >
                          {formatBrPhone(o.customer_phone)}
                        </a>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {formatBrPhone(o.customer_phone)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {o.origin === "site" ? "Site" : "Manual"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                        {STATUS_LABEL[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          late ? "font-semibold text-destructive" : "text-muted-foreground"
                        }
                      >
                        {formatDate(o.expected_date)}
                        {late ? " · Atrasado" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{money(o.total)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors " +
        (active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-secondary")
      }
    >
      {children}
    </button>
  );
}
