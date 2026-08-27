import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { StatCard } from "@/components/stat-card";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/lib/use-admin-session";
import { money, percent, todayISO, daysBetween } from "@/lib/format";

export const Route = createFileRoute("/admin/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios | Ateliê da JHE" }] }),
  component: RelatoriosPage,
});

function monthBoundsFromKey(key: string): { start: string; end: string } {
  const [y, m] = key.split("-").map(Number);
  const first = new Date(y!, (m ?? 1) - 1, 1);
  const last = new Date(y!, m ?? 1, 0);
  const toISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: toISO(first), end: toISO(last) };
}

function previousMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const prev = new Date(y!, (m ?? 1) - 2, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(y!, (m ?? 1) - 1, 1),
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

type MonthStats = {
  total: number;
  concluidos: number;
  cancelados: number;
  pendentes: number;
  atrasados: number;
  revenue: number;
  costs: number;
  grossProfit: number;
  margin: number | null;
  avgTicket: number | null;
  avgProductionDays: number | null;
  topSellingProduct: { name: string; quantity: number } | null;
  topRevenueProduct: { name: string; revenue: number } | null;
  topCategory: { name: string; quantity: number } | null;
};

function useMonthStats(monthKey: string, enabled: boolean) {
  const { start, end } = monthBoundsFromKey(monthKey);

  return useQuery({
    queryKey: ["admin-report-month", monthKey],
    queryFn: async (): Promise<MonthStats> => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(
          "id, status, total, materials_cost, order_date, expected_date, delivered_at, order_items(product_id, product_name, quantity, subtotal)",
        )
        .gte("order_date", start)
        .lte("order_date", end);
      if (error) throw error;

      const { data: products } = await supabase.from("products").select("id, category_id");
      const { data: categories } = await supabase.from("categories").select("id, name");
      const categoryByProduct = new Map((products ?? []).map((p) => [p.id, p.category_id]));
      const categoryName = new Map((categories ?? []).map((c) => [c.id, c.name]));

      const rows = orders ?? [];
      const today = todayISO();
      const valid = rows.filter((o) => o.status !== "cancelado");
      const delivered = rows.filter((o) => o.status === "entregue" && o.delivered_at);
      const pendentes = rows.filter(
        (o) => o.status !== "entregue" && o.status !== "cancelado",
      ).length;
      const atrasados = rows.filter(
        (o) =>
          o.status !== "entregue" &&
          o.status !== "cancelado" &&
          o.expected_date &&
          o.expected_date < today,
      ).length;

      const revenue = valid.reduce((sum, o) => sum + o.total, 0);
      const costs = valid.reduce((sum, o) => sum + o.materials_cost, 0);
      const grossProfit = revenue - costs;
      const margin = revenue > 0 ? (grossProfit / revenue) * 100 : null;
      const avgTicket = valid.length > 0 ? revenue / valid.length : null;
      const avgProductionDays =
        delivered.length > 0
          ? delivered.reduce((sum, o) => sum + daysBetween(o.order_date, o.delivered_at!), 0) /
            delivered.length
          : null;

      const qtyByProduct = new Map<string, number>();
      const revenueByProduct = new Map<string, number>();
      const qtyByCategory = new Map<string, number>();

      for (const order of valid) {
        for (const item of order.order_items ?? []) {
          qtyByProduct.set(
            item.product_name,
            (qtyByProduct.get(item.product_name) ?? 0) + item.quantity,
          );
          revenueByProduct.set(
            item.product_name,
            (revenueByProduct.get(item.product_name) ?? 0) + item.subtotal,
          );
          const categoryId = item.product_id ? categoryByProduct.get(item.product_id) : null;
          const catName = categoryId
            ? (categoryName.get(categoryId) ?? "Sem categoria")
            : "Sem categoria";
          qtyByCategory.set(catName, (qtyByCategory.get(catName) ?? 0) + item.quantity);
        }
      }

      const topOf = <T,>(
        map: Map<string, number>,
        build: (name: string, value: number) => T,
      ): T | null => {
        let bestName: string | null = null;
        let bestValue = -Infinity;
        for (const [name, value] of map) {
          if (value > bestValue) {
            bestValue = value;
            bestName = name;
          }
        }
        return bestName ? build(bestName, bestValue) : null;
      };

      return {
        total: rows.length,
        concluidos: rows.filter((o) => o.status === "entregue").length,
        cancelados: rows.filter((o) => o.status === "cancelado").length,
        pendentes,
        atrasados,
        revenue,
        costs,
        grossProfit,
        margin,
        avgTicket,
        avgProductionDays,
        topSellingProduct: topOf(qtyByProduct, (name, quantity) => ({ name, quantity })),
        topRevenueProduct: topOf(revenueByProduct, (name, revenue) => ({ name, revenue })),
        topCategory: topOf(qtyByCategory, (name, quantity) => ({ name, quantity })),
      };
    },
    enabled,
  });
}

function Delta({ current, previous }: { current: number; previous: number | null | undefined }) {
  if (previous === null || previous === undefined || previous === 0) {
    return <span className="text-xs text-muted-foreground">sem mês anterior</span>;
  }
  const change = ((current - previous) / previous) * 100;
  const up = change >= 0;
  return (
    <span className={"text-xs font-medium " + (up ? "text-primary" : "text-destructive")}>
      {up ? "▲" : "▼"} {percent(Math.abs(change))} vs. mês anterior
    </span>
  );
}

function RelatoriosPage() {
  const session = useAdminSession();
  const [monthKey, setMonthKey] = useState(todayISO().slice(0, 7));
  const prevKey = previousMonthKey(monthKey);

  const currentQuery = useMonthStats(monthKey, session.status === "authorized");
  const previousQuery = useMonthStats(prevKey, session.status === "authorized");

  const hasPrevious = useMemo(
    () => !previousQuery.isLoading && (previousQuery.data?.total ?? 0) > 0,
    [previousQuery.isLoading, previousQuery.data],
  );

  if (session.status !== "authorized") return null;

  const stats = currentQuery.data;
  const prev = previousQuery.data;

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display text-2xl font-semibold">Relatórios</h1>
        <input
          type="month"
          value={monthKey}
          onChange={(e) => setMonthKey(e.target.value)}
          max={todayISO().slice(0, 7)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{monthLabel(monthKey)}</p>

      {currentQuery.isLoading || !stats ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando...</p>
      ) : stats.total === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum pedido registrado em {monthLabel(monthKey)}.
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <StatCard label="Pedidos" value={String(stats.total)} />
              {hasPrevious && <Delta current={stats.total} previous={prev?.total} />}
            </div>
            <StatCard label="Concluídos" value={String(stats.concluidos)} />
            <StatCard label="Cancelados" value={String(stats.cancelados)} />
            <StatCard label="Pendentes" value={String(stats.pendentes)} />
            <StatCard
              label="Atrasados"
              value={String(stats.atrasados)}
              tone={stats.atrasados > 0 ? "negative" : undefined}
            />
            <div>
              <StatCard label="Faturamento" value={money(stats.revenue)} />
              {hasPrevious && <Delta current={stats.revenue} previous={prev?.revenue} />}
            </div>
            <StatCard label="Custos" value={money(stats.costs)} />
            <div>
              <StatCard
                label="Lucro"
                value={money(stats.grossProfit)}
                tone={stats.grossProfit >= 0 ? "positive" : "negative"}
              />
              {hasPrevious && <Delta current={stats.grossProfit} previous={prev?.grossProfit} />}
            </div>
            <StatCard label="Margem" value={stats.margin === null ? "—" : percent(stats.margin)} />
            <div>
              <StatCard
                label="Ticket médio"
                value={stats.avgTicket === null ? "—" : money(stats.avgTicket)}
              />
              {hasPrevious && stats.avgTicket !== null && (
                <Delta current={stats.avgTicket} previous={prev?.avgTicket ?? null} />
              )}
            </div>
            <StatCard
              label="Tempo médio de produção"
              value={
                stats.avgProductionDays === null
                  ? "—"
                  : `${stats.avgProductionDays.toFixed(1)} dias`
              }
            />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Produto mais vendido</p>
              <p className="mt-1 text-lg font-semibold">
                {stats.topSellingProduct ? stats.topSellingProduct.name : "—"}
              </p>
              {stats.topSellingProduct && (
                <p className="text-xs text-muted-foreground">
                  {stats.topSellingProduct.quantity} unidades
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Produto que mais faturou</p>
              <p className="mt-1 text-lg font-semibold">
                {stats.topRevenueProduct ? stats.topRevenueProduct.name : "—"}
              </p>
              {stats.topRevenueProduct && (
                <p className="text-xs text-muted-foreground">
                  {money(stats.topRevenueProduct.revenue)}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Categoria mais vendida</p>
              <p className="mt-1 text-lg font-semibold">
                {stats.topCategory ? stats.topCategory.name : "—"}
              </p>
              {stats.topCategory && (
                <p className="text-xs text-muted-foreground">
                  {stats.topCategory.quantity} unidades
                </p>
              )}
            </div>
          </div>

          {!hasPrevious && (
            <p className="mt-6 text-xs text-muted-foreground">
              Sem pedidos em {monthLabel(prevKey)} para comparar.
            </p>
          )}
        </>
      )}
    </AdminShell>
  );
}
