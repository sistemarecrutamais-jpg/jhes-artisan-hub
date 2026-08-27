import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/lib/use-admin-session";
import { money, formatDate, isLate, STATUS_LABEL, STATUS_ORDER, PAYMENT_LABEL } from "@/lib/format";
import { whatsappLink, formatBrPhone } from "@/lib/whatsapp";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export const Route = createFileRoute("/admin/pedidos/$id")({
  head: () => ({ meta: [{ title: "Pedido | Ateliê da JHE" }] }),
  component: PedidoDetailPage,
});

function PedidoDetailPage() {
  const { id } = Route.useParams();
  const session = useAdminSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [quantityUsed, setQuantityUsed] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualCost, setManualCost] = useState("");
  const [materialsError, setMaterialsError] = useState<string | null>(null);

  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const orderQuery = useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), order_status_history(*), order_materials(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: session.status === "authorized",
  });

  const materialsQuery = useQuery({
    queryKey: ["admin-materials-picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("id, name, unit, quantity, total_paid")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: session.status === "authorized",
  });

  if (session.status !== "authorized") return null;

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
    await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  async function changeStatus(newStatus: OrderStatus) {
    setBusy(true);
    setActionError(null);

    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
      new Date(),
    );
    const patch: { status: OrderStatus; delivered_at?: string } = { status: newStatus };
    if (newStatus === "entregue") patch.delivered_at = today;

    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (!error) {
      await supabase.from("order_status_history").insert({ order_id: id, status: newStatus });
    }
    setBusy(false);
    if (error) {
      setActionError("Não foi possível atualizar o status.");
      return;
    }
    await refresh();
  }

  async function confirmCancel() {
    if (!cancelReason.trim()) {
      setActionError("Informe o motivo do cancelamento.");
      return;
    }
    setBusy(true);
    setActionError(null);
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelado", cancel_reason: cancelReason.trim() })
      .eq("id", id);
    if (!error) {
      await supabase
        .from("order_status_history")
        .insert({ order_id: id, status: "cancelado", note: cancelReason.trim() });
    }
    setBusy(false);
    if (error) {
      setActionError("Não foi possível cancelar o pedido.");
      return;
    }
    setCancelling(false);
    setCancelReason("");
    await refresh();
  }

  async function duplicateOrder() {
    const order = orderQuery.data;
    if (!order) return;
    setBusy(true);
    setActionError(null);

    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
      new Date(),
    );

    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: order.customer_id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_email: order.customer_email,
        address: order.address,
        complement: order.complement,
        neighborhood: order.neighborhood,
        city: order.city,
        zip_code: order.zip_code,
        delivery_method: order.delivery_method,
        notes: order.notes,
        origin: "manual",
        status: "novo",
        total: order.total,
        order_date: today,
        expected_date: order.expected_date,
      })
      .select("id, order_number")
      .single();

    if (orderError || !newOrder) {
      setBusy(false);
      setActionError("Não foi possível duplicar o pedido.");
      return;
    }

    const items = (order.order_items ?? []).map((item) => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      product_name: item.product_name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      subtotal: item.subtotal,
      color: item.color,
      customization: item.customization,
      image_url: item.image_url,
    }));

    if (items.length > 0) {
      await supabase.from("order_items").insert(items);
    }
    await supabase.from("order_status_history").insert({
      order_id: newOrder.id,
      status: "novo",
      note: `Duplicado do pedido #${order.order_number}`,
    });

    setBusy(false);
    navigate({ to: "/admin/pedidos/$id", params: { id: newOrder.id } });
  }

  async function addMaterialUsage() {
    setMaterialsError(null);
    const material = materialsQuery.data?.find((m) => m.id === selectedMaterialId);
    const quantity = Number(quantityUsed.replace(",", "."));

    if (!material || !Number.isFinite(quantity) || quantity <= 0) {
      setMaterialsError("Selecione um material e informe uma quantidade válida.");
      return;
    }

    const cost = material.quantity > 0 ? (material.total_paid / material.quantity) * quantity : 0;

    const { error } = await supabase.from("order_materials").insert({
      order_id: id,
      material_id: material.id,
      description: `${material.name} (${quantity} ${material.unit})`,
      quantity_used: quantity,
      unit_cost: material.quantity > 0 ? material.total_paid / material.quantity : 0,
      cost: Number(cost.toFixed(2)),
    });

    if (error) {
      setMaterialsError("Não foi possível registrar o uso do material.");
      return;
    }
    setSelectedMaterialId("");
    setQuantityUsed("");
    await refresh();
  }

  async function addManualCost() {
    setMaterialsError(null);
    const cost = Number(manualCost.replace(",", "."));
    if (!manualDescription.trim() || !Number.isFinite(cost) || cost < 0) {
      setMaterialsError("Informe uma descrição e um custo válido.");
      return;
    }

    const { error } = await supabase.from("order_materials").insert({
      order_id: id,
      material_id: null,
      description: manualDescription.trim(),
      quantity_used: 0,
      unit_cost: 0,
      cost,
    });

    if (error) {
      setMaterialsError("Não foi possível registrar o custo manual.");
      return;
    }
    setManualDescription("");
    setManualCost("");
    await refresh();
  }

  async function removeMaterialUsage(usageId: string) {
    await supabase.from("order_materials").delete().eq("id", usageId);
    await refresh();
  }

  async function handlePaymentSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPaymentError(null);
    const form = new FormData(e.currentTarget);
    const amountPaid = Number(String(form.get("amount_paid")).replace(",", "."));

    if (!Number.isFinite(amountPaid) || amountPaid < 0) {
      setPaymentError("Valor pago inválido.");
      return;
    }

    setSavingPayment(true);
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: form.get("payment_status") as Database["public"]["Enums"]["payment_status"],
        amount_paid: amountPaid,
      })
      .eq("id", id);

    setSavingPayment(false);
    if (error) {
      setPaymentError("Não foi possível salvar o pagamento.");
      return;
    }
    await refresh();
  }

  if (orderQuery.isLoading) {
    return (
      <AdminShell>
        <p className="text-sm text-muted-foreground">Carregando pedido...</p>
      </AdminShell>
    );
  }

  const order = orderQuery.data;
  if (!order) {
    return (
      <AdminShell>
        <p className="text-sm text-muted-foreground">Pedido não encontrado.</p>
        <Link
          to="/admin/pedidos"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Voltar para pedidos
        </Link>
      </AdminShell>
    );
  }

  const wa = whatsappLink(order.customer_phone);
  const late = isLate(order);
  const history = [...(order.order_status_history ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  return (
    <AdminShell>
      <Link to="/admin/pedidos" className="text-sm text-muted-foreground hover:text-foreground">
        ← Voltar para pedidos
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-display text-2xl font-semibold">Pedido #{order.order_number}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.origin === "site" ? "Pedido pelo site" : "Pedido manual"} ·{" "}
            {formatDate(order.order_date)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={duplicateOrder}
            disabled={busy}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
          >
            Duplicar pedido
          </button>
          {order.status !== "cancelado" && (
            <button
              type="button"
              onClick={() => setCancelling((v) => !v)}
              disabled={busy}
              className="rounded-full border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              Cancelar pedido
            </button>
          )}
        </div>
      </div>

      {cancelling && (
        <div className="mt-4 rounded-2xl border border-destructive/30 bg-card p-4">
          <p className="text-sm font-medium">Motivo do cancelamento</p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
            placeholder="Ex.: cliente desistiu, falta de material, prazo, outro"
            className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={confirmCancel}
              disabled={busy}
              className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-60"
            >
              Confirmar cancelamento
            </button>
            <button
              type="button"
              onClick={() => setCancelling(false)}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      {actionError && <p className="mt-3 text-sm text-destructive">{actionError}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Itens do pedido</h2>
            <ul className="mt-3 divide-y divide-border">
              {(order.order_items ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {item.quantity}x {item.product_name}
                      {item.color ? ` · ${item.color}` : ""}
                    </p>
                    {item.customization && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Personalização: {item.customization}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold">{money(item.subtotal)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
              <span>Total</span>
              <span className="text-primary">{money(order.total)}</span>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Materiais utilizados</h2>
              <span className="text-sm font-semibold text-primary">
                Custo: {money(order.materials_cost)}
              </span>
            </div>

            {(order.order_materials ?? []).length > 0 && (
              <ul className="mt-3 divide-y divide-border">
                {(order.order_materials ?? []).map((usage) => (
                  <li
                    key={usage.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span>{usage.description}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{money(usage.cost)}</span>
                      <button
                        type="button"
                        onClick={() => removeMaterialUsage(usage.id)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_100px_auto]">
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Selecione um material</option>
                {(materialsQuery.data ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <input
                value={quantityUsed}
                onChange={(e) => setQuantityUsed(e.target.value)}
                placeholder="Qtd."
                inputMode="decimal"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={addMaterialUsage}
                disabled={!selectedMaterialId}
                className="rounded-xl border border-border bg-background px-4 text-sm font-medium hover:bg-secondary disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px_auto]">
              <input
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="Custo manual — descrição"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <input
                value={manualCost}
                onChange={(e) => setManualCost(e.target.value)}
                placeholder="R$"
                inputMode="decimal"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={addManualCost}
                disabled={!manualDescription.trim()}
                className="rounded-xl border border-border bg-background px-4 text-sm font-medium hover:bg-secondary disabled:opacity-50"
              >
                Lançar
              </button>
            </div>

            {materialsError && <p className="mt-2 text-sm text-destructive">{materialsError}</p>}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Histórico de status</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-3 text-muted-foreground"
                >
                  <span>
                    {STATUS_LABEL[h.status]}
                    {h.note ? ` — ${h.note}` : ""}
                  </span>
                  <span className="shrink-0 text-xs">{formatDate(h.created_at)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Cliente</h2>
            <p className="mt-2 text-sm">{order.customer_name}</p>
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {formatBrPhone(order.customer_phone)}
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">{formatBrPhone(order.customer_phone)}</p>
            )}
            {order.delivery_method === "entrega" && (
              <p className="mt-2 text-sm text-muted-foreground">
                {order.address}
                {order.complement ? `, ${order.complement}` : ""}
                {order.neighborhood ? ` — ${order.neighborhood}` : ""}
                {order.city ? `, ${order.city}` : ""}
                {order.zip_code ? ` (${order.zip_code})` : ""}
              </p>
            )}
            {order.notes && (
              <p className="mt-2 text-sm text-muted-foreground">Obs: {order.notes}</p>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Status</h2>
            <p className="mt-2 text-sm">
              Atual: <span className="font-medium">{STATUS_LABEL[order.status]}</span>
              {late && <span className="ml-2 text-destructive">· Atrasado</span>}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Previsão: {formatDate(order.expected_date)}
              {order.delivered_at ? ` · Entregue em ${formatDate(order.delivered_at)}` : ""}
            </p>

            {order.status !== "cancelado" && (
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUS_ORDER.filter((s) => s !== "cancelado" && s !== order.status).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={busy}
                    onClick={() => changeStatus(s)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-50"
                  >
                    Marcar como {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Pagamento</h2>
            <form
              key={`${order.payment_status}-${order.amount_paid}`}
              onSubmit={handlePaymentSave}
              className="mt-3 space-y-3"
            >
              <label className="block text-sm font-medium">
                Status
                <select
                  name="payment_status"
                  defaultValue={order.payment_status}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="pendente">{PAYMENT_LABEL["pendente"]}</option>
                  <option value="parcial">{PAYMENT_LABEL["parcial"]}</option>
                  <option value="pago">{PAYMENT_LABEL["pago"]}</option>
                  <option value="reembolsado">{PAYMENT_LABEL["reembolsado"]}</option>
                </select>
              </label>
              <label className="block text-sm font-medium">
                Valor pago (R$)
                <input
                  name="amount_paid"
                  inputMode="decimal"
                  defaultValue={order.amount_paid}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Total: {money(order.total)} · Restante:{" "}
                {money(Math.max(0, order.total - order.amount_paid))}
              </p>
              {paymentError && <p className="text-sm text-destructive">{paymentError}</p>}
              <button
                type="submit"
                disabled={savingPayment}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {savingPayment ? "Salvando..." : "Salvar pagamento"}
              </button>
            </form>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}
