import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/lib/use-admin-session";
import { money } from "@/lib/format";

export const Route = createFileRoute("/admin/pedidos/novo")({
  head: () => ({ meta: [{ title: "Novo pedido | Ateliê da JHE" }] }),
  component: NovoPedidoPage,
});

type DraftItem = {
  key: string;
  productId: string;
  productName: string;
  unitPrice: number;
  productionDays: number;
  quantity: number;
  color: string;
  customization: string;
};

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

function NovoPedidoPage() {
  const session = useAdminSession();
  const navigate = useNavigate();

  const productsQuery = useQuery({
    queryKey: ["admin-active-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, production_days")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: session.status === "authorized",
  });

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState("");
  const [customization, setCustomization] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"retirada" | "entrega">("retirada");
  const [address, setAddress] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [items]);

  function addItem() {
    const product = productsQuery.data?.find((p) => p.id === selectedProductId);
    if (!product) return;
    setItems((prev) => [
      ...prev,
      {
        key: `${product.id}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        unitPrice: Number(product.price),
        productionDays: product.production_days,
        quantity,
        color: color.trim(),
        customization: customization.trim(),
      },
    ]);
    setSelectedProductId("");
    setQuantity(1);
    setColor("");
    setCustomization("");
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  if (session.status !== "authorized") return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Adicione ao menos um produto ao pedido.");
      return;
    }
    if (deliveryMethod === "entrega" && !address.trim()) {
      setError("Endereço é obrigatório para entrega.");
      return;
    }

    setSubmitting(true);

    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
      new Date(),
    );
    const maxDays = Math.max(0, ...items.map((i) => i.productionDays));
    const expected = new Date(`${today}T12:00:00`);
    expected.setDate(expected.getDate() + maxDays);
    const expectedISO = expected.toISOString().slice(0, 10);
    const orderTotal = Number(total.toFixed(2));

    const { data: customer } = await supabase
      .from("customers")
      .insert({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: address.trim() || null,
        complement: complement.trim() || null,
        neighborhood: neighborhood.trim() || null,
        city: city.trim() || null,
        zip_code: zipCode.trim() || null,
      })
      .select("id")
      .single();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customer?.id ?? null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        address: address.trim() || null,
        complement: complement.trim() || null,
        neighborhood: neighborhood.trim() || null,
        city: city.trim() || null,
        zip_code: zipCode.trim() || null,
        delivery_method: deliveryMethod,
        notes: notes.trim() || null,
        origin: "manual",
        status: "novo",
        total: orderTotal,
        order_date: today,
        expected_date: expectedISO,
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) {
      setSubmitting(false);
      setError("Não foi possível criar o pedido.");
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        product_name: i.productName,
        unit_price: i.unitPrice,
        quantity: i.quantity,
        subtotal: Number((i.unitPrice * i.quantity).toFixed(2)),
        color: i.color || null,
        customization: i.customization || null,
      })),
    );

    if (itemsError) {
      setSubmitting(false);
      setError("Pedido criado, mas houve um erro ao salvar os itens.");
      return;
    }

    await supabase
      .from("order_status_history")
      .insert({ order_id: order.id, status: "novo", note: "Pedido criado manualmente" });

    setSubmitting(false);
    navigate({ to: "/admin/pedidos/$id", params: { id: order.id } });
  }

  return (
    <AdminShell>
      <h1 className="text-display text-2xl font-semibold">Novo pedido</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Cliente</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Nome completo
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm font-medium">
                Telefone / WhatsApp
                <input
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className={fieldClass}
                />
              </label>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium">Forma de recebimento</p>
              <div className="mt-2 flex gap-2">
                {(["retirada", "entrega"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDeliveryMethod(m)}
                    className={
                      "rounded-full border px-4 py-1.5 text-sm font-medium " +
                      (deliveryMethod === m
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-secondary")
                    }
                  >
                    {m === "retirada" ? "Retirada" : "Entrega"}
                  </button>
                ))}
              </div>
            </div>

            {deliveryMethod === "entrega" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium sm:col-span-2">
                  Endereço
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Complemento
                  <input
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Bairro
                  <input
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Cidade
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm font-medium">
                  CEP
                  <input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className={fieldClass}
                  />
                </label>
              </div>
            )}

            <label className="mt-4 block text-sm font-medium">
              Observações
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={fieldClass}
              />
            </label>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Produtos</h2>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_100px_1fr]">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className={fieldClass + " mt-0"}
              >
                <option value="">Selecione um produto</option>
                {(productsQuery.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {money(p.price)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className={fieldClass + " mt-0"}
              />
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Cor (opcional)"
                className={fieldClass + " mt-0"}
              />
            </div>
            <textarea
              value={customization}
              onChange={(e) => setCustomization(e.target.value)}
              rows={2}
              placeholder="Personalização (opcional)"
              className={fieldClass + " mt-2"}
            />
            <button
              type="button"
              onClick={addItem}
              disabled={!selectedProductId}
              className="mt-3 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
            >
              Adicionar item
            </button>

            {items.length > 0 && (
              <ul className="mt-4 divide-y divide-border">
                {items.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {item.quantity}x {item.productName}
                        {item.color ? ` · ${item.color}` : ""}
                      </p>
                      {item.customization && (
                        <p className="text-xs text-muted-foreground">{item.customization}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{money(item.unitPrice * item.quantity)}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "Criando..." : "Criar pedido"}
          </button>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold">Resumo</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {items.map((item) => (
              <li key={item.key} className="flex justify-between gap-2">
                <span>
                  {item.quantity}x {item.productName}
                </span>
                <span>{money(item.unitPrice * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-semibold text-primary">{money(total)}</span>
          </div>
        </aside>
      </form>
    </AdminShell>
  );
}
