import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/lib/use-admin-session";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/admin/produtos/novo")({
  head: () => ({ meta: [{ title: "Novo produto | Ateliê da JHE" }] }),
  component: NovoProdutoPage,
});

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

function NovoProdutoPage() {
  const session = useAdminSession();
  const navigate = useNavigate();

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    enabled: session.status === "authorized",
  });

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [productionDays, setProductionDays] = useState("7");
  const [allowCustomization, setAllowCustomization] = useState(true);
  const [featured, setFeatured] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session.status !== "authorized") return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const priceValue = Number(price.replace(",", "."));
    if (!name.trim() || !Number.isFinite(priceValue) || priceValue < 0) {
      setError("Preencha nome e um preço válido.");
      return;
    }

    setSubmitting(true);
    const { data, error: insertError } = await supabase
      .from("products")
      .insert({
        name: name.trim(),
        slug: slugify(name),
        category_id: categoryId || null,
        short_description: shortDescription.trim() || null,
        description: description.trim() || null,
        price: priceValue,
        production_days: Math.max(0, Number(productionDays) || 0),
        allow_customization: allowCustomization,
        featured,
        active: true,
      })
      .select("id")
      .single();

    setSubmitting(false);
    if (insertError || !data) {
      setError(
        insertError?.code === "23505"
          ? "Já existe um produto com esse nome."
          : "Não foi possível criar o produto.",
      );
      return;
    }

    navigate({ to: "/admin/produtos/$id", params: { id: data.id } });
  }

  return (
    <AdminShell>
      <h1 className="text-display text-2xl font-semibold">Novo produto</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Depois de criar, você adiciona fotos e cores na tela de edição.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-5"
      >
        <label className="block text-sm font-medium">
          Nome
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Categoria
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Sem categoria</option>
              {(categoriesQuery.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Preço (R$)
            <input
              required
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="89,90"
              className={fieldClass}
            />
          </label>
        </div>

        <label className="block text-sm font-medium">
          Descrição resumida (aparece no catálogo)
          <input
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            maxLength={160}
            className={fieldClass}
          />
        </label>

        <label className="block text-sm font-medium">
          Descrição completa
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={fieldClass}
          />
        </label>

        <label className="block text-sm font-medium">
          Prazo de produção (dias)
          <input
            type="number"
            min={0}
            value={productionDays}
            onChange={(e) => setProductionDays(e.target.value)}
            className={fieldClass + " max-w-[140px]"}
          />
        </label>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={allowCustomization}
              onChange={(e) => setAllowCustomization(e.target.checked)}
            />
            Permite personalização
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Produto em destaque
          </label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? "Criando..." : "Criar produto"}
        </button>
      </form>
    </AdminShell>
  );
}
