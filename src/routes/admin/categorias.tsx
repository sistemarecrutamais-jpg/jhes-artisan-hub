import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/lib/use-admin-session";
import { slugify } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

export const Route = createFileRoute("/admin/categorias")({
  head: () => ({ meta: [{ title: "Categorias | Ateliê da JHE" }] }),
  component: CategoriasPage,
});

function CategoriasPage() {
  const session = useAdminSession();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    enabled: session.status === "authorized",
  });

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session.status !== "authorized") return null;

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    const { error: insertError } = await supabase.from("categories").insert({
      name: name.trim(),
      slug: slugify(name),
    });
    setCreating(false);
    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "Já existe uma categoria com esse nome."
          : "Não foi possível criar a categoria.",
      );
      return;
    }
    setName("");
    await refresh();
  }

  async function toggleActive(category: Category) {
    await supabase.from("categories").update({ active: !category.active }).eq("id", category.id);
    await refresh();
  }

  async function rename(category: Category, newName: string) {
    if (!newName.trim() || newName === category.name) return;
    await supabase.from("categories").update({ name: newName.trim() }).eq("id", category.id);
    await refresh();
  }

  return (
    <AdminShell>
      <h1 className="text-display text-2xl font-semibold">Categorias</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Categorias inativas somem do catálogo público, mas continuam nos pedidos antigos.
      </p>

      <form onSubmit={handleCreate} className="mt-4 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da nova categoria"
          className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm outline-none focus:border-primary sm:max-w-xs"
        />
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {categoriesQuery.isLoading ? (
          <li className="p-4 text-sm text-muted-foreground">Carregando...</li>
        ) : (categoriesQuery.data ?? []).length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">Nenhuma categoria cadastrada.</li>
        ) : (
          (categoriesQuery.data ?? []).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 p-4">
              <input
                defaultValue={c.name}
                onBlur={(e) => rename(c, e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium hover:border-border focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => toggleActive(c)}
                className={
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium " +
                  (c.active ? "bg-secondary text-foreground" : "bg-destructive/10 text-destructive")
                }
              >
                {c.active ? "Ativa" : "Inativa"}
              </button>
            </li>
          ))
        )}
      </ul>
    </AdminShell>
  );
}
