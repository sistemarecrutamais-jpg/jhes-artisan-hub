import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminShell } from "@/components/admin-shell";
import { StatCard } from "@/components/stat-card";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/lib/use-admin-session";
import {
  money,
  formatDate,
  daysBetween,
  daysInRangeISO,
  isLate,
  STATUS_LABEL,
  STATUS_ORDER,
  monthBoundsISO,
  todayISO,
} from "@/lib/format";
import { periodRange, PERIOD_OPTIONS, type Period } from "@/lib/period";
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_INK_SECONDARY,
  FINANCE_COLOR,
  STATUS_COLOR,
} from "@/lib/chart-colors";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Painel | Ateliê da JHE" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const session = useAdminSession();
  const [period, setPeriod] = useState<Period>("mes");
  const [customStart, setCustomStart] = useState(monthBoundsISO(0).start);
  const [customEnd, setCustomEnd] = useState(todayISO());
  const [showStatusTable, setShowStatusTable] = useState(false);

  const { start, end } = periodRange(period, customStart, customEnd);

  const ordersQuery = useQuery({
    queryKey: ["admin-dashboard-orders", start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, status, total, materials_cost, order_date, expected_date, delivered_at, order_items(product_id, product_name, quantity)",
        )
        .gte("order_date", start)
        .lte("order_date", end);
      if (error) throw error;
      return data ?? [];
    },
    enabled: session.status === "authorized",
  });

  const productsQuery = useQuery({
    queryKey: ["admin-products-category-map"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, category_id");
      if (error) throw error;
      return data ?? [];
    },
    enabled: session.status === "authorized",
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: session.status === "authorized",
  });

  const stats = useMemo(() => {
    const rows = ordersQuery.data ?? [];
    const valid = rows.filter((o) => o.status !== "cancelado");
    const delivered = rows.filter((o) => o.status === "entregue" && o.delivered_at);

    const revenue = valid.reduce((sum, o) => sum + o.total, 0);
    const costs = valid.reduce((sum, o) => sum + o.materials_cost, 0);
    const grossProfit = revenue - costs;
    const avgTicket = valid.length > 0 ? revenue / valid.length : null;
    const avgProductionDays =
      delivered.length > 0
        ? delivered.reduce((sum, o) => sum + daysBetween(o.order_date, o.delivered_at!), 0) /
          delivered.length
        : null;

    return {
      total: rows.length,
      concluidos: rows.filter((o) => o.status === "entregue").length,
      emProducao: rows.filter((o) => o.status === "em_producao").length,
      atrasados: rows.filter((o) => isLate(o)).length,
      revenue,
      costs,
      grossProfit,
      avgTicket,
      avgProductionDays,
    };
  }, [ordersQuery.data]);

  const ordersPerDay = useMemo(() => {
    const rows = ordersQuery.data ?? [];
    const days = daysInRangeISO(start, end);
    return days.map((day) => ({
      day,
      label: formatDate(day).slice(0, 5),
      pedidos: rows.filter((o) => o.order_date === day).length,
    }));
  }, [ordersQuery.data, start, end]);

  const financePerDay = useMemo(() => {
    const rows = (ordersQuery.data ?? []).filter((o) => o.status !== "cancelado");
    const days = daysInRangeISO(start, end);
    return days.map((day) => {
      const dayRows = rows.filter((o) => o.order_date === day);
      const revenue = dayRows.reduce((sum, o) => sum + o.total, 0);
      const costs = dayRows.reduce((sum, o) => sum + o.materials_cost, 0);
      return {
        day,
        label: formatDate(day).slice(0, 5),
        Faturamento: revenue,
        Custos: costs,
        Lucro: revenue - costs,
      };
    });
  }, [ordersQuery.data, start, end]);

  const statusBreakdown = useMemo(() => {
    const rows = ordersQuery.data ?? [];
    return STATUS_ORDER.map((s) => ({
      status: s,
      name: STATUS_LABEL[s],
      value: rows.filter((o) => o.status === s).length,
      color: STATUS_COLOR[s],
    })).filter((s) => s.value > 0);
  }, [ordersQuery.data]);

  const topProducts = useMemo(() => {
    const rows = (ordersQuery.data ?? []).filter((o) => o.status !== "cancelado");
    const totals = new Map<string, number>();
    for (const order of rows) {
      for (const item of order.order_items ?? []) {
        totals.set(item.product_name, (totals.get(item.product_name) ?? 0) + item.quantity);
      }
    }
    return [...totals.entries()]
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  }, [ordersQuery.data]);

  const topCategories = useMemo(() => {
    const categoryByProduct = new Map((productsQuery.data ?? []).map((p) => [p.id, p.category_id]));
    const categoryName = new Map((categoriesQuery.data ?? []).map((c) => [c.id, c.name]));
    const rows = (ordersQuery.data ?? []).filter((o) => o.status !== "cancelado");
    const totals = new Map<string, number>();

    for (const order of rows) {
      for (const item of order.order_items ?? []) {
        const categoryId = item.product_id ? categoryByProduct.get(item.product_id) : null;
        const name = categoryId
          ? (categoryName.get(categoryId) ?? "Sem categoria")
          : "Sem categoria";
        totals.set(name, (totals.get(name) ?? 0) + item.quantity);
      }
    }
    return [...totals.entries()]
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  }, [ordersQuery.data, productsQuery.data, categoriesQuery.data]);

  if (session.status !== "authorized") return null;

  const isLoading = ordersQuery.isLoading;
  const maxRankingQty = Math.max(
    1,
    ...topProducts.map((p) => p.quantity),
    ...topCategories.map((c) => c.quantity),
  );

  return (
    <AdminShell>
      <h1 className="text-display text-2xl font-semibold">Dashboard</h1>

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

      {isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <StatCard label="Pedidos" value={String(stats.total)} />
            <StatCard label="Concluídos" value={String(stats.concluidos)} />
            <StatCard label="Em produção" value={String(stats.emProducao)} />
            <StatCard
              label="Atrasados"
              value={String(stats.atrasados)}
              tone={stats.atrasados > 0 ? "negative" : undefined}
            />
            <StatCard label="Faturamento" value={money(stats.revenue)} />
            <StatCard label="Gastos" value={money(stats.costs)} />
            <StatCard
              label="Lucro bruto"
              value={money(stats.grossProfit)}
              tone={stats.grossProfit >= 0 ? "positive" : "negative"}
            />
            <StatCard
              label="Ticket médio"
              value={stats.avgTicket === null ? "—" : money(stats.avgTicket)}
            />
            <StatCard
              label="Tempo médio de produção"
              value={
                stats.avgProductionDays === null
                  ? "—"
                  : `${stats.avgProductionDays.toFixed(1)} dias`
              }
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <ChartCard title="Pedidos por período">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ordersPerDay} barCategoryGap="20%">
                  <CartesianGrid vertical={false} stroke={CHART_GRID} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: CHART_INK_SECONDARY }}
                    axisLine={{ stroke: CHART_AXIS }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: CHART_INK_SECONDARY }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    formatter={(v: number) => [String(v), "Pedidos"]}
                    labelFormatter={(l) => l}
                  />
                  <Bar
                    dataKey="pedidos"
                    fill={FINANCE_COLOR.revenue}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Pedidos por status"
              action={
                <button
                  type="button"
                  onClick={() => setShowStatusTable((v) => !v)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {showStatusTable ? "Ver gráfico" : "Ver tabela"}
                </button>
              }
            >
              {showStatusTable ? (
                <table className="w-full text-sm">
                  <tbody>
                    {statusBreakdown.map((s) => (
                      <tr key={s.status} className="border-b border-border last:border-0">
                        <td className="flex items-center gap-2 py-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.name}
                        </td>
                        <td className="py-2 text-right font-medium">{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : statusBreakdown.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Sem pedidos no período.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusBreakdown.map((s) => (
                        <Cell key={s.status} fill={s.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="mt-6">
            <ChartCard title="Faturamento, custos e lucro">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={financePerDay}>
                  <CartesianGrid vertical={false} stroke={CHART_GRID} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: CHART_INK_SECONDARY }}
                    axisLine={{ stroke: CHART_AXIS }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: CHART_INK_SECONDARY }}
                    axisLine={false}
                    tickLine={false}
                    width={64}
                    tickFormatter={(v: number) => money(v)}
                  />
                  <Tooltip formatter={(v: number) => money(v)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Faturamento"
                    stroke={FINANCE_COLOR.revenue}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Custos"
                    stroke={FINANCE_COLOR.costs}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Lucro"
                    stroke={FINANCE_COLOR.profit}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <ChartCard title="Produtos mais vendidos">
              <RankingList items={topProducts} max={maxRankingQty} />
            </ChartCard>
            <ChartCard title="Categorias">
              <RankingList items={topCategories} max={maxRankingQty} />
            </ChartCard>
          </div>
        </>
      )}
    </AdminShell>
  );
}

function ChartCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function RankingList({ items, max }: { items: { name: string; quantity: number }[]; max: number }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Sem vendas no período.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={item.name}>
          <div className="flex items-center justify-between text-sm">
            <span className="truncate font-medium">
              {i + 1}. {item.name}
            </span>
            <span className="shrink-0 text-muted-foreground">{item.quantity}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(4, (item.quantity / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
