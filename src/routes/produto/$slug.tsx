import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { toast } from "sonner";

import { SiteLayout } from "@/components/site-layout";
import { productQuery } from "@/lib/storefront-query";
import { money } from "@/lib/format";
import { imageSrc } from "@/lib/img";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} | Ateliê da JHE` },
          { name: "description", content: loaderData.short_description ?? loaderData.name },
        ]
      : [],
  }),
  component: ProdutoPage,
});

function ProdutoPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(slug));
  const { addItem } = useCart();

  const [activeImage, setActiveImage] = useState(0);
  const [color, setColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customization, setCustomization] = useState("");

  const images = product?.images ?? [];
  const mainSrc = imageSrc(images[activeImage]?.url ?? images[0]?.url);

  const selectedColor = useMemo(() => {
    if (!product?.colors.length) return null;
    return color ?? product.colors[0]?.name ?? null;
  }, [color, product]);

  if (!product) return null;
  const p = product;

  function handleAddToCart() {
    addItem({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      quantity,
      color: p.colors.length ? selectedColor : null,
      customization: p.allow_customization && customization.trim() ? customization.trim() : null,
      imageUrl: images[0]?.url ?? null,
    });
    toast.success("Produto adicionado ao carrinho");
  }

  return (
    <SiteLayout>
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="aspect-square overflow-hidden rounded-3xl bg-secondary">
              {mainSrc ? (
                <img src={mainSrc} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-display text-sm text-muted-foreground">
                  Ateliê da JHE
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={img.url + i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={
                      "h-16 w-16 overflow-hidden rounded-xl border-2 transition-colors " +
                      (i === activeImage ? "border-primary" : "border-transparent")
                    }
                  >
                    <img
                      src={imageSrc(img.url) ?? undefined}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-display text-3xl font-semibold">{product.name}</h1>
            <p className="mt-2 text-2xl font-semibold text-primary">{money(product.price)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Prazo estimado de produção: {product.production_days} dias
            </p>

            {product.description && (
              <p className="mt-4 whitespace-pre-line text-sm text-foreground/90">
                {product.description}
              </p>
            )}

            {product.colors.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold">Cor</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setColor(c.name)}
                      className={
                        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors " +
                        (selectedColor === c.name
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary")
                      }
                    >
                      {c.hex && (
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-border"
                          style={{ backgroundColor: c.hex }}
                        />
                      )}
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <p className="text-sm font-semibold">Quantidade</p>
              <div className="mt-2 inline-flex items-center gap-3 rounded-full border border-border bg-card px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="text-lg font-semibold text-muted-foreground hover:text-foreground"
                  aria-label="Diminuir quantidade"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  className="text-lg font-semibold text-muted-foreground hover:text-foreground"
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>
              </div>
            </div>

            {product.allow_customization && (
              <div className="mt-6">
                <label htmlFor="customization" className="text-sm font-semibold">
                  Você gostaria de alterar alguma coisa?
                </label>
                <textarea
                  id="customization"
                  value={customization}
                  onChange={(e) => setCustomization(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Ex.: gostaria da alça mais longa, iniciais bordadas..."
                  className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleAddToCart}
              className="mt-8 w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 md:w-auto"
            >
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
