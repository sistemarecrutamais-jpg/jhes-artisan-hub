import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import logo from "@/assets/logo-jhe.png";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { siteSettingsQuery } from "@/lib/storefront-query";
import { whatsappLink } from "@/lib/whatsapp";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/produtos", label: "Produtos" },
  { href: "/#sobre", label: "Sobre o Ateliê" },
  { href: "/#contato", label: "Contato" },
] as const;

/** Plain routes use the router Link (SPA nav); "/#hash" targets use a native
 * anchor so it both jumps to the section on the home page and still works
 * as a normal link from any other page. */
function NavLink({
  href,
  className,
  onClick,
  children,
}: {
  href: string;
  className: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  if (href.includes("#")) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link
      to={href}
      className={className}
      onClick={onClick}
      activeProps={{ className: `${className} text-primary` }}
      activeOptions={{ exact: href === "/" }}
    >
      {children}
    </Link>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const settingsQuery = useQuery(siteSettingsQuery);
  const settings = settingsQuery.data;
  const wa = whatsappLink(
    settings?.whatsapp ?? null,
    "Olá! Vim pelo site do Ateliê da JHE e gostaria de saber mais.",
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="Ateliê da JHE"
              className="h-11 w-11 shrink-0 rounded-full border border-border/60 object-cover shadow-sm md:h-12 md:w-12"
            />
            <span className="leading-tight">
              <span className="block text-display text-lg font-semibold text-deep">
                Ateliê da JHE
              </span>
              <span className="block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Costura • Crochê • Artesanato
              </span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-7 md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.label}
                href={n.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <Link
            to="/carrinho"
            className="relative ml-auto inline-flex items-center justify-center rounded-full border border-border bg-card p-2.5 text-deep transition-colors hover:border-primary/40 md:ml-4"
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
            className="rounded-full border border-border bg-card p-2.5 text-deep md:hidden"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div className={cn("border-t border-border/70 md:hidden", open ? "block" : "hidden")}>
          <nav className="mx-auto flex w-full max-w-6xl flex-col px-4 py-2">
            {NAV.map((n) => (
              <NavLink
                key={n.label}
                href={n.href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm font-medium text-muted-foreground"
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer id="contato" className="mt-20 border-t border-border bg-secondary/50">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Ateliê da JHE"
                className="h-10 w-10 rounded-full border border-border/60 object-cover"
              />
              <div>
                <p className="text-display text-base font-semibold text-deep">Ateliê da JHE</p>
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Costura • Crochê • Artesanato
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Peças artesanais feitas à mão, com carinho, delicadeza e personalização.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Navegação</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/" className="hover:text-primary">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/produtos" className="hover:text-primary">
                  Produtos
                </Link>
              </li>
              <li>
                <Link to="/" hash="sobre" className="hover:text-primary">
                  Sobre
                </Link>
              </li>
              <li>
                <Link to="/carrinho" className="hover:text-primary">
                  Meu carrinho
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Atendimento</p>
            <div className="mt-3 space-y-1.5">
              {settings?.address && <p>{settings.address}</p>}
              {settings?.opening_hours && <p>{settings.opening_hours}</p>}
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" className="block hover:text-primary">
                  Fale pelo WhatsApp
                </a>
              )}
              {settings?.instagram && (
                <a
                  href={`https://instagram.com/${settings.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:text-primary"
                >
                  Instagram
                </a>
              )}
            </div>
            <p className="mt-5 text-xs">
              © {new Date().getFullYear()} Ateliê da JHE. Todos os direitos reservados.
            </p>
            <p className="mt-1 text-xs">
              <Link to="/admin/login" className="hover:text-foreground hover:underline">
                Área administrativa
              </Link>
            </p>
          </div>
        </div>
      </footer>

      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          aria-label="Falar no WhatsApp"
          className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow-soft)] transition-transform hover:scale-105"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.83 14.06c-.24.68-1.4 1.31-1.93 1.38-.5.07-1.11.1-1.79-.11-.41-.13-.95-.31-1.63-.61-2.87-1.24-4.74-4.15-4.88-4.34-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.14.11.31.02.5-.09.19-.14.31-.27.47-.14.17-.29.37-.41.5-.14.14-.28.29-.12.57.16.28.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.61-.07.16-.19.7-.81.89-1.09.19-.28.37-.23.63-.14.26.1 1.66.78 1.94.92.28.14.47.21.53.33.07.12.07.68-.17 1.36z" />
          </svg>
        </a>
      )}
    </div>
  );
}
