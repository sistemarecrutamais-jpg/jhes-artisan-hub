import { Link } from "@tanstack/react-router";

import type { PublicProduct } from "@/lib/catalog.functions";
import { money } from "@/lib/format";
import { imageSrc } from "@/lib/img";

export function ProductCard({ product }: { product: PublicProduct }) {
  const src = imageSrc(product.images[0]?.url);
  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
    >
      <div className="aspect-square w-full overflow-hidden bg-secondary">
        {src ? (
          <img
            src={src}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-hero-gradient text-display text-sm text-muted-foreground">
            Ateliê da JHE
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-display text-base font-semibold">{product.name}</h3>
        {product.short_description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.short_description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-base font-semibold text-primary">{money(product.price)}</span>
          <span className="text-xs text-muted-foreground">
            {product.production_days} dias de produção
          </span>
        </div>
      </div>
    </Link>
  );
}
