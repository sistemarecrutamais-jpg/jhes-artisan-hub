import { useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteLayout } from "@/components/site-layout";
import { useCart } from "@/lib/cart";
import { money, formatDate } from "@/lib/format";
import { createPublicOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Finalizar pedido | Ateliê da JHE" }] }),
  component: CheckoutPage,
});

type Confirmation = { orderNumber: number; total: number; expectedDate: string };

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary";

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={"block text-sm font-medium " + (className ?? "")}>
      {label}
      {required && <span className="text-destructive"> *</span>}
      {children}
    </label>
  );
}

function CheckoutPage() {
  const { items, total, ready, clear } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"retirada" | "entrega">("retirada");
  const [address, setAddress] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  if (!ready) return null;

  if (!confirmation && items.length === 0) {
    return (
      <SiteLayout>
        <section className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
          <Link
            to="/produtos"
            className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Ver produtos
          </Link>
        </section>
      </SiteLayout>
    );
  }

  if (confirmation) {
    return (
      <SiteLayout>
        <section className="mx-auto w-full max-w-lg px-4 py-16 text-center">
          <p className="text-display text-2xl font-semibold">Pedido recebido com sucesso!</p>
          <p className="mt-3 text-3xl font-bold text-primary">#{confirmation.orderNumber}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Total: {money(confirmation.total)} · Previsão de entrega:{" "}
            {formatDate(confirmation.expectedDate)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Em breve entraremos em contato pelo WhatsApp para combinar os detalhes.
          </p>
          <Link
            to="/"
            className="mt-8 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </section>
      </SiteLayout>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (deliveryMethod === "entrega" && !address.trim()) {
      setError("Endereço é obrigatório para entrega.");
      return;
    }

    setLoading(true);
    try {
      const result = await createPublicOrder({
        data: {
          customerName: name.trim(),
          customerPhone: phone.trim(),
          deliveryMethod,
          address: address.trim(),
          complement: complement.trim(),
          neighborhood: neighborhood.trim(),
          city: city.trim(),
          zipCode: zipCode.trim(),
          notes: notes.trim(),
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            color: item.color,
            customization: item.customization,
          })),
        },
      });
      clear();
      setConfirmation(result);
    } catch {
      setError("Não foi possível registrar o pedido. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <section className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-display text-3xl font-semibold">Finalizar pedido</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo" required>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Telefone / WhatsApp" required>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 91234-5678"
                  className={inputClass}
                />
              </Field>
            </div>

            <div>
              <p className="text-sm font-medium">Forma de recebimento</p>
              <div className="mt-2 flex gap-2">
                {(["retirada", "entrega"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDeliveryMethod(m)}
                    className={
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
                      (deliveryMethod === m
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-secondary")
                    }
                  >
                    {m === "retirada" ? "Retirada" : "Entrega"}
                  </button>
                ))}
              </div>
            </div>

            {deliveryMethod === "entrega" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Endereço" required className="sm:col-span-2">
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Complemento">
                  <input
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Bairro">
                  <input
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Cidade">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="CEP">
                  <input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            )}

            <Field label="Observações">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={inputClass}
              />
            </Field>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
            >
              {loading ? "Enviando..." : "Confirmar pedido"}
            </button>
          </form>

          <aside className="h-fit rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold">Resumo</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {items.map((item) => (
                <li key={item.key} className="flex justify-between gap-2">
                  <span>
                    {item.quantity}x {item.name}
                    {item.color ? ` (${item.color})` : ""}
                  </span>
                  <span>{money(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-semibold text-primary">{money(total)}</span>
            </div>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}
