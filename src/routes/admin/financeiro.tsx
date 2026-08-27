import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { StatCard } from "@/components/stat-card";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/lib/use-admin-session";
import { money, percent, formatDate, todayISO, monthBoundsISO, PAYMENT_LABEL } from "@/lib/format";
import { periodRange, PERIOD_OPTIONS, type Period } from "@/lib/period";

export const Route = createFileRoute("/admin/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro | Ateliê da JHE" }] }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const session = useAdminSession();
  const [period, setPeriod] = useState<Period>("mes");
  const [customStart, setCustomStart] = useState(monthBoundsISO(0).start);
  const [customEnd, setCustomEnd] = useState(todayISO());

  const { start, end } = periodRange(period, customStart, customEnd);

  const ordersQuery = useQuery({
    queryKey: ["admin-financeiro-orders", start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, customer_name, status, total, materials_cost, amount_paid, payment_status, order_date",
        )
        .gte("order_date", start)
        .lte("order_date", end)
        .order("order_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: session.status === "authorized",
  });

  const stats = useMemo(() => {
    const rows = ordersQuery.data ?? [];
    const valid = rows.filter((o) => o.status !== "cancelado");
    const cancelled = rows.filter((o) => o.status === "cancelado");

    const revenue = valid.reduce((sum, o) => sum + o.total, 0);
    const costs = valid.reduce((sum, o) => sum + o.materials_cost, 0);
    const grossProfit = revenue - costs;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : null;
    const avgTicket = valid.length > 0 ? revenue / valid.length : null;
    const pendingReceivable = valid.reduce(
      (sum, o) => sum + Math.max(0, o.total - o.amount_paid),
      0,
    );

    return {
      valid,
      cancelledCount: cancelled.length,
      revenue,
      costs,
      grossProfit,
      margin,
      avgTicket,
      pendingReceivable,
    };
  }, [ordersQuery.data]);

  if (session.status !== "authorized") return null;

  return (
    <AdminShell>
      <h1 className="text-display text-2xl font-semibold">Financeiro</h1>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {PERIOD_OPTIONS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            className={
              "rounded-full border px-3.5 py-1.5 text-xs font-medium " +
              (period === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-secondary")
            }
          >
            {label}
          </button>
        ))}
      </div>

      {period === "personalizado" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <span className="text-sm text-muted-foreground">até</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
        </div>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        Período: {formatDate(start)} até {formatDate(end)}
      </p>

      {ordersQuery.isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Faturamento" value={money(stats.revenue)} />
            <StatCard label="Custos (materiais)" value={money(stats.costs)} />
            <StatCard
              label="Lucro bruto"
              value={money(stats.grossProfit)}
              tone={stats.grossProfit >= 0 ? "positive" : "negative"}
            />
            <StatCard
              label="Margem bruta"
              value={stats.margin === null ? "—" : percent(stats.margin)}
            />
            <StatCard
              label="Ticket médio"
              value={stats.avgTicket === null ? "—" : money(stats.avgTicket)}
            />
            <StatCard label="Pedidos válidos" value={String(stats.valid.length)} />
            <StatCard label="Cancelados no período" value={String(stats.cancelledCount)} />
            <StatCard label="A receber" value={money(stats.pendingReceivable)} />
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            "Lucro bruto" considera apenas o custo de materiais registrado nos pedidos. Ainda não é
            lucro líquido — outras despesas do ateliê (aluguel, energia, etc.) não entram nesse
            cálculo.
          </p>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Custo materiais</th>
                  <th className="px-4 py-3">Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {(ordersQuery.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum pedido no período.
                    </td>
                  </tr>
                ) : (
                  (ordersQuery.data ?? []).map((o) => (
                    <tr key={o.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          to="/admin/pedidos/$id"
                          params={{ id: o.id }}
                          className="font-semibold text-primary hover:underline"
                        >
                          #{o.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{o.customer_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(o.order_date)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {o.status === "cancelado" ? (
                          <span className="text-muted-foreground line-through">
                            {money(o.total)}
                          </span>
                        ) : (
                          money(o.total)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {money(o.materials_cost)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {PAYMENT_LABEL[o.payment_status]}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminShell>
  );
}
