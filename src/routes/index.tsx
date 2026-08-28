import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Sparkles, ShoppingBag, Gift, ArrowRight } from "lucide-react";

import hero from "@/assets/hero-atelie.jpg";
import logo from "@/assets/logo-jhe-oficial.png";
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

const STEPS = [
  {
    icon: Search,
    title: "Escolha sua peça",
    text: "Navegue pelo catálogo e encontre o que combina com você.",
  },
  {
    icon: Sparkles,
    title: "Personalize",
    text: "Escolha cor e detalhes especiais, se a peça permitir.",
  },
  {
    icon: ShoppingBag,
    title: "Faça seu pedido",
    text: "Finalize pelo site, sem precisar criar conta.",
  },
  {
    icon: Gift,
    title: "Receba sua criação",
    text: "Combinamos o prazo e a entrega direto pelo WhatsApp.",
  },
] as const;

const CATEGORY_ACCENTS = [
  "bg-sage/25 text-sage-foreground",
  "bg-rose/25 text-rose-foreground",
  "bg-mustard/25 text-mustard-foreground",
  "bg-primary/10 text-primary",
] as const;

function Home() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const featured = data.products.filter((p) => p.featured).slice(0, 8);
  const list = (featured.length ? featured : data.products).slice(0, 8);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-24">
          <div className="order-2 md:order-1 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Feito à mão em cada detalhe
            </p>
            <h1 className="mt-3 text-display text-4xl font-semibold leading-[1.1] text-deep md:text-5xl">
              Artesanato que combina com a sua história
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              {data.settings?.description ??
                "Peças artesanais feitas à mão com carinho: crochê, costura e artesanato sob medida para a sua casa e para presentear."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/produtos"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Ver produtos
              </Link>
              <Link
                to="/carrinho"
                className="inline-flex items-center justify-center rounded-full border border-primary/30 bg-card px-6 py-3 text-sm font-semibold uppercase tracking-wide text-deep hover:bg-secondary"
              >
                Meu carrinho
              </Link>
            </div>
          </div>

          {/* Decorative side: the official logo, never redrawn, with a soft glow behind it */}
          <div className="order-1 md:order-2 relative mx-auto flex w-full max-w-sm items-center justify-center py-4 md:max-w-md">
            <div className="absolute h-64 w-64 rounded-full bg-sage/20 blur-3xl md:h-80 md:w-80" />
            <div className="absolute -right-6 top-6 h-32 w-32 rounded-full bg-rose/25 blur-2xl" />
            <div className="absolute -left-4 bottom-8 h-24 w-24 rounded-full bg-mustard/20 blur-2xl" />

            <img
              src={logo}
              alt="Ateliê da JHE — costura, crochê e artesanato"
              className="relative h-64 w-64 object-contain drop-shadow-xl md:h-80 md:w-80"
            />
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      {data.categories.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-14">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Explore nossas criações
            </p>
            <h2 className="mt-2 text-display text-2xl font-semibold text-deep md:text-3xl">
              Feito para você
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.categories.map((c, i) => (
              <Link
                key={c.id}
                to="/produtos"
                search={{ categoria: c.id }}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)] transition-transform hover:-translate-y-1"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ${CATEGORY_ACCENTS[i % CATEGORY_ACCENTS.length]}`}
                >
                  {c.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm font-semibold uppercase tracking-wide text-deep">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* DESTAQUES */}
      <section className="mx-auto w-full max-w-6xl px-4 py-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Peças que encantam
            </p>
            <h2 className="mt-1 text-display text-2xl font-semibold text-deep md:text-3xl">
              Destaques do Ateliê
            </h2>
          </div>
          <Link
            to="/produtos"
            className="hidden text-sm font-medium text-primary hover:underline sm:inline"
          >
            Ver catálogo completo
          </Link>
        </div>
        {list.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Os produtos estão sendo preparados. Volte em breve!
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* SOBRE O ATELIÊ */}
      <section id="sobre" className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl shadow-[var(--shadow-soft)]">
            <img
              src={hero}
              alt="Linhas, novelos e ferramentas de crochê e costura do Ateliê da JHE"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Sobre o ateliê
            </p>
            <h2 className="mt-2 text-display text-3xl font-semibold leading-tight text-deep">
              Feito à mão, pensado para você.
            </h2>
            <p className="mt-4 text-muted-foreground">
              O Ateliê da JHE nasceu do carinho por trabalhar com as mãos. Aqui, cada peça de
              costura, crochê e artesanato é pensada com atenção aos detalhes — do fio escolhido ao
              acabamento final.
            </p>
            <p className="mt-3 text-muted-foreground">
              Trabalhamos também com peças personalizadas, feitas sob medida para combinar com o seu
              estilo, a sua casa, ou aquela pessoa especial que você quer presentear.
            </p>
          </div>
        </div>
      </section>

      {/* PERSONALIZAÇÃO */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-16 text-center">
          <Sparkles className="h-7 w-7 text-primary" aria-hidden="true" />
          <h2 className="text-display text-2xl font-semibold text-deep md:text-3xl">
            Quer algo só seu?
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Algumas peças podem ser personalizadas para combinar com seu estilo, sua casa ou aquela
            pessoa especial.
          </p>
          <Link
            to="/produtos"
            className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary/90"
          >
            Personalizar meu pedido
          </Link>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Como funciona
          </p>
          <h2 className="mt-2 text-display text-2xl font-semibold text-deep md:text-3xl">
            Do pedido até a sua casa
          </h2>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">
                {i + 1}
              </p>
              <h3 className="mt-1 text-display text-base font-semibold text-deep">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA CATÁLOGO */}
      <section className="bg-hero-gradient">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-16 text-center">
          <h2 className="text-display text-2xl font-semibold text-deep md:text-3xl">
            Encontre uma peça feita para você.
          </h2>
          <Link
            to="/produtos"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary/90"
          >
            Ver todos os produtos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
