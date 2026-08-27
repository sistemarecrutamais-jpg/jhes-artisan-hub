import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import logo from "@/assets/logo-jhe.png";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/produtos", label: "Produtos" },
  { to: "/carrinho", label: "Carrinho" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Ateliê da JHE" className="h-11 w-11 rounded-full object-cover" />
            <span className="leading-tight">
              <span className="block text-display text-lg font-semibold">Ateliê da JHE</span>
              <span className="block text-xs text-muted-foreground">
                Costura • Crochê • Artesanato
              </span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-6 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <Link
            to="/carrinho"
            className="relative ml-auto inline-flex items-center justify-center rounded-full border border-border bg-card p-2.5 md:ml-4"
            aria-label="Abrir carrinho"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="rounded-full border border-border bg-card p-2.5 md:hidden"
            aria-label="Abrir menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className={cn("border-t border-border/70 md:hidden", open ? "block" : "hidden")}>
          <nav className="mx-auto flex w-full max-w-6xl flex-col px-4 py-2">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-muted-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-border bg-secondary/60">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
          <div>
            <p className="text-display text-lg font-semibold">Ateliê da JHE</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Peças artesanais feitas à mão, com carinho e personalização.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Navegação</p>
            <ul className="mt-2 space-y-1">
              <li>
                <Link to="/produtos">Produtos</Link>
              </li>
              <li>
                <Link to="/carrinho">Carrinho</Link>
              </li>
              <li>
                <Link to="/checkout">Finalizar pedido</Link>
              </li>
            </ul>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Atendimento</p>
            <p className="mt-2">Pedidos personalizados sob encomenda.</p>
            <p className="mt-4 text-xs">
              © {new Date().getFullYear()} Ateliê da JHE. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
