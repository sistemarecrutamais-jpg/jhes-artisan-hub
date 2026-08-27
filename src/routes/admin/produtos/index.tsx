import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/lib/use-admin-session";
import { money } from "@/lib/format";
import { imageSrc } from "@/lib/img";

export const Route = createFileRoute("/admin/produtos/")({
  head: () => ({ meta: [{ title: "Produtos | Ateliê da JHE" }] }),
  component: ProdutosAdminPage,
});

type StatusFilter = "todos" | "ativos" | "inativos";

function ProdutosAdminPage() {
  const session = useAdminSession();
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [search, setSearch] = useState("");

  const productsQuery = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, active, featured, category_id, product_images(url, is_primary)")
        .order("created_at", { ascending: false });
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

  const categoryName = useMemo(() => {
    const map = new Map((categoriesQuery.data ?? []).map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "Sem categoria");
  }, [categoriesQuery.data]);

  const filtered = useMemo(() => {
    let rows = productsQuery.data ?? [];
    if (status === "ativos") rows = rows.filter((p) => p.active);
    if (status === "inativos") rows = rows.filter((p) => !p.active);
    const term = search.trim().toLowerCase();
    if (term) rows = rows.filter((p) => p.name.toLowerCase().includes(term));
    return rows;
  }, [productsQuery.data, status, search]);

  if (session.status !== "authorized") return null;

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display text-2xl font-semibold">Produtos</h1>
        <Link
          to="/admin/produtos/novo"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Novo produto
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(["todos", "ativos", "inativos"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={
              "rounded-full border px-3.5 py-1.5 text-xs font-medium " +
              (status === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-secondary")
            }
          >
            {s === "todos" ? "Todos" : s === "ativos" ? "Ativos" : "Inativos"}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome"
          className="ml-auto min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-1.5 text-sm outline-none focus:border-primary sm:max-w-xs"
        />
      </div>

      {productsQuery.isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum produto encontrado.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const primary = p.product_images?.find((i) => i.is_primary) ?? p.product_images?.[0];
            const src = imageSrc(primary?.url);
            return (
              <Link
                key={p.id}
                to="/admin/produtos/$id"
                params={{ id: p.id }}
                className="flex gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-secondary/40"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
                  {src ? (
                    <img src={src} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[9px] text-muted-foreground">
                      Sem foto
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{categoryName(p.category_id)}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">{money(p.price)}</span>
                    {!p.active && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                        Inativo
                      </span>
                    )}
                    {p.featured && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
                        Destaque
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
