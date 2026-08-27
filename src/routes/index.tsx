import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, HeartHandshake, PackageCheck } from "lucide-react";

import hero from "@/assets/hero-atelie.jpg";
import { ProductCard } from "@/components/product-card";
import { SiteLayout } from "@/components/site-layout";
import { storefrontQuery } from "@/lib/storefront-query";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  head: () => ({
    meta: [
      { title: "Ateliê da JHE | Costura, Crochê e Artesanato" },
      {
        name: "description",
        content:
          "Peças artesanais em costura e crochê, feitas à mão e personalizadas. Escolha, personalize e faça seu pedido pelo site.",
      },
      { property: "og:title", content: "Ateliê da JHE | Costura, Crochê e Artesanato" },
      {
        property: "og:description",
        content: "Peças artesanais feitas à mão, com personalização e prazo combinado.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const featured = data.products.filter((p) => p.featured).slice(0, 8);
  const list = (featured.length ? featured : data.products).slice(0, 8);

  return (
    <SiteLayout>
      <section className="bg-hero-gradient">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Feito à mão em cada detalhe
            </p>
            <h1 className="mt-3 text-display text-4xl font-semibold leading-tight md:text-5xl">
              Artesanato que combina com a sua história
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              {data.settings?.description ??
                "Costura, crochê e peças personalizadas produzidas sob encomenda no Ateliê da JHE."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/produtos"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Ver produtos
              </Link>
              <Link
                to="/carrinho"
                className="inline-flex items-center justify-center rounded-full border border-primary/30 bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                Meu carrinho
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl shadow-[var(--shadow-soft)]">
            <img
              src={hero}
              alt="Espaço de trabalho do Ateliê da JHE com linhas, tecidos e peças em crochê"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-12 sm:grid-cols-3">
        {[
          { icon: Sparkles, title: "Personalização", text: "Escolha cores e detalhes da sua peça." },
          {
            icon: HeartHandshake,
            title: "Atendimento direto",
            text: "Combinamos tudo pelo WhatsApp, sem burocracia.",
          },
          {
            icon: PackageCheck,
            title: "Prazo transparente",
            text: "Cada produto mostra o prazo de produção.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
            <f.icon className="h-6 w-6 text-primary" />
            <h2 className="mt-3 text-display text-lg font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-4">
        <div className="flex items-end justify-between">
          <h2 className="text-display text-2xl font-semibold">Destaques do ateliê</h2>
          <Link to="/produtos" className="text-sm font-medium text-primary hover:underline">
            Ver catálogo completo
          </Link>
        </div>
        {list.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Os produtos estão sendo preparados. Volte em breve!
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
