import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ProductCard } from "@/components/product-card";
import { SiteLayout } from "@/components/site-layout";
import { storefrontQuery } from "@/lib/storefront-query";

export const Route = createFileRoute("/produtos")({
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  head: () => ({
    meta: [
      { title: "Produtos | Ateliê da JHE" },
      {
        name: "description",
        content: "Catálogo completo de peças artesanais em costura e crochê do Ateliê da JHE.",
      },
    ],
  }),
  component: ProdutosPage,
});

const ALL = "__all__";

function ProdutosPage() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const [categoryId, setCategoryId] = useState<string>(ALL);

  const filtered = useMemo(() => {
    if (categoryId === ALL) return data.products;
    return data.products.filter((p) => p.category_id === categoryId);
  }, [data.products, categoryId]);

  return (
    <SiteLayout>
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Catálogo</p>
          <h1 className="mt-2 text-display text-3xl font-semibold md:text-4xl">
            Todos os produtos
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Peças feitas à mão, com prazo de produção combinado e opções de personalização.
          </p>
        </div>

        {data.categories.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryId(ALL)}
              className={
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
                (categoryId === ALL
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary")
              }
            >
              Todas
            </button>
            {data.categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
                  (categoryId === c.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-secondary")
                }
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {data.products.length === 0
              ? "Os produtos estão sendo preparados. Volte em breve!"
              : "Nenhum produto encontrado nessa categoria."}
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
