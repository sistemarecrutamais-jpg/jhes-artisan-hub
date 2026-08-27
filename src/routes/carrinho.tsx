import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";

import { SiteLayout } from "@/components/site-layout";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import { imageSrc } from "@/lib/img";

export const Route = createFileRoute("/carrinho")({
  head: () => ({ meta: [{ title: "Carrinho | Ateliê da JHE" }] }),
  component: CarrinhoPage,
});

function CarrinhoPage() {
  const { items, total, ready, updateQuantity, removeItem } = useCart();

  if (!ready) return null;

  return (
    <SiteLayout>
      <section className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="text-display text-3xl font-semibold">Seu carrinho</h1>

        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
            <Link
              to="/produtos"
              className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Ver produtos
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <ul className="space-y-4">
              {items.map((item) => {
                const src = imageSrc(item.imageUrl);
                return (
                  <li
                    key={item.key}
                    className="flex gap-4 rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                      {src ? (
                        <img src={src} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                          Ateliê da JHE
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            to="/produto/$slug"
                            params={{ slug: item.slug }}
                            className="text-sm font-semibold hover:underline"
                          >
                            {item.name}
                          </Link>
                          {item.color && (
                            <p className="text-xs text-muted-foreground">Cor: {item.color}</p>
                          )}
                          {item.customization && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Personalização: {item.customization}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Remover item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            aria-label="Diminuir quantidade"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-5 text-center text-sm">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            aria-label="Aumentar quantidade"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-primary">
                          {money(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="h-fit rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-lg font-semibold text-primary">{money(total)}</span>
              </div>
              <Link
                to="/checkout"
                className="mt-4 block rounded-full bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Finalizar pedido
              </Link>
              <Link
                to="/produtos"
                className="mt-2 block rounded-full border border-border bg-background px-4 py-2.5 text-center text-sm font-medium hover:bg-secondary"
              >
                Continuar comprando
              </Link>
            </aside>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
