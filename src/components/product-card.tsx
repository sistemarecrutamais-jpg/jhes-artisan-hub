import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import type { PublicProduct } from "@/lib/catalog.functions";
import { money } from "@/lib/format";
import { imageSrc } from "@/lib/img";

export function ProductCard({ product }: { product: PublicProduct }) {
  const src = imageSrc(product.images[0]?.url);
  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
    >
      <div className="aspect-square w-full overflow-hidden bg-secondary">
        {src ? (
          <img
            src={src}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-hero-gradient text-display text-sm text-muted-foreground">
            Ateliê da JHE
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-display text-base font-semibold text-deep">{product.name}</h3>
        {product.short_description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.short_description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-base font-semibold text-primary">{money(product.price)}</span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary opacity-80 transition-opacity group-hover:opacity-100">
            Ver produto
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
