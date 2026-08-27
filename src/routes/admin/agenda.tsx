import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/lib/use-admin-session";
import { money, formatDate, todayISO, addDaysISO, isLate, STATUS_LABEL } from "@/lib/format";
import { whatsappLink, formatBrPhone } from "@/lib/whatsapp";
import type { Database } from "@/integrations/supabase/types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type ViewMode = "dia" | "semana" | "mes";

export const Route = createFileRoute("/admin/agenda")({
  head: () => ({ meta: [{ title: "Agenda | Ateliê da JHE" }] }),
  component: AgendaPage,
});

function AgendaPage() {
  const session = useAdminSession();
  const [view, setView] = useState<ViewMode>("semana");

  const ordersQuery = useQuery({
    queryKey: ["admin-agenda-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .not("status", "in", "(entregue,cancelado)")
        .order("expected_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: session.status === "authorized",
  });

  const { overdue, upcoming } = useMemo(() => {
    const rows = ordersQuery.data ?? [];
    const today = todayISO();
    const rangeEnd =
      view === "dia" ? today : view === "semana" ? addDaysISO(today, 7) : addDaysISO(today, 30);

    const overdueRows = rows.filter((o) => isLate(o));
    const upcomingRows = rows.filter(
      (o) =>
        !isLate(o) && o.expected_date && o.expected_date >= today && o.expected_date <= rangeEnd,
    );
    return { overdue: overdueRows, upcoming: upcomingRows };
  }, [ordersQuery.data, view]);

  if (session.status !== "authorized") return null;

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display text-2xl font-semibold">Agenda</h1>
        <div className="flex gap-2">
          {(["dia", "semana", "mes"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={
                "rounded-full border px-4 py-1.5 text-sm font-medium " +
                (view === v
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-secondary")
              }
            >
              {v === "dia" ? "Hoje" : v === "semana" ? "Esta semana" : "Este mês"}
            </button>
          ))}
        </div>
      </div>

      {ordersQuery.isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="mt-6 space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-destructive">
              Atrasados {overdue.length > 0 ? `(${overdue.length})` : ""}
            </h2>
            {overdue.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nenhum pedido atrasado.</p>
            ) : (
              <AgendaList orders={overdue} highlight />
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold">
              Próximas entregas —{" "}
              {view === "dia" ? "hoje" : view === "semana" ? "próximos 7 dias" : "próximos 30 dias"}
            </h2>
            {upcoming.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhuma entrega prevista nesse período.
              </p>
            ) : (
              <AgendaList orders={upcoming} />
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function AgendaList({ orders, highlight }: { orders: OrderRow[]; highlight?: boolean }) {
  return (
    <ul className="mt-3 space-y-2">
      {orders.map((o) => {
        const wa = whatsappLink(o.customer_phone);
        return (
          <li
            key={o.id}
            className={
              "flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 " +
              (highlight ? "border-destructive/30 bg-destructive/5" : "border-border bg-card")
            }
          >
            <div>
              <Link
                to="/admin/pedidos/$id"
                params={{ id: o.id }}
                className="font-semibold text-primary hover:underline"
              >
                #{o.order_number}
              </Link>
              <span className="ml-2 text-sm">{o.customer_name}</span>
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 text-xs text-muted-foreground hover:text-primary hover:underline"
                >
                  {formatBrPhone(o.customer_phone)}
                </a>
              )}
            </div>
            <div className="text-right text-sm">
              <p className="font-medium">{formatDate(o.expected_date)}</p>
              <p className="text-xs text-muted-foreground">
                {STATUS_LABEL[o.status]} · {money(o.total)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
