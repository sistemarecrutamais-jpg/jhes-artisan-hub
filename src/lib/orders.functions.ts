import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  color: z.string().trim().max(60).nullable().optional(),
  customization: z.string().trim().max(1000).nullable().optional(),
});

const orderSchema = z.object({
  customerName: z.string().trim().min(3).max(120),
  customerPhone: z.string().trim().min(8).max(30),
  customerEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
  deliveryMethod: z.enum(["retirada", "entrega"]),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  complement: z.string().trim().max(120).optional().or(z.literal("")),
  neighborhood: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  zipCode: z.string().trim().max(20).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1).max(50),
});

export type PublicOrderInput = z.infer<typeof orderSchema>;

export const createPublicOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.deliveryMethod === "entrega" && !data.address?.trim()) {
      throw new Error("Endereço é obrigatório para entrega.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = [...new Set(data.items.map((i) => i.productId))];
    const { data: products, error: prodError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, production_days, active")
      .in("id", ids);

    if (prodError) throw new Error("Não foi possível validar os produtos do pedido.");
    const available = (products ?? []).filter((p) => p.active);
    if (available.length !== ids.length) {
      throw new Error("Um dos produtos não está mais disponível. Revise o carrinho.");
    }

    const byId = new Map(available.map((p) => [p.id, p]));
    let total = 0;
    let maxDays = 0;
    const items = data.items.map((item) => {
      const product = byId.get(item.productId)!;
      const unitPrice = Number(product.price);
      const subtotal = Number((unitPrice * item.quantity).toFixed(2));
      total += subtotal;
      maxDays = Math.max(maxDays, product.production_days ?? 0);
      return {
        product_id: product.id,
        product_name: product.name,
        unit_price: unitPrice,
        quantity: item.quantity,
        subtotal,
        color: item.color?.trim() || null,
        customization: item.customization?.trim() || null,
      };
    });
    total = Number(total.toFixed(2));

    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
      new Date(),
    );
    const expected = new Date(`${today}T12:00:00`);
    expected.setDate(expected.getDate() + maxDays);
    const expectedISO = expected.toISOString().slice(0, 10);

    const { data: customer } = await supabaseAdmin
      .from("customers")
      .insert({
        name: data.customerName,
        phone: data.customerPhone,
        email: data.customerEmail || null,
        address: data.address || null,
        complement: data.complement || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        zip_code: data.zipCode || null,
      })
      .select("id")
      .single();

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_id: customer?.id ?? null,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail || null,
        address: data.address || null,
        complement: data.complement || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        zip_code: data.zipCode || null,
        delivery_method: data.deliveryMethod,
        notes: data.notes || null,
        origin: "site",
        status: "novo",
        total,
        order_date: today,
        expected_date: expectedISO,
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) {
      console.error("createPublicOrder", orderError);
      throw new Error("Não foi possível registrar o pedido. Tente novamente.");
    }

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(items.map((i) => ({ ...i, order_id: order.id })));

    if (itemsError) {
      console.error("createPublicOrder items", itemsError);
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error("Não foi possível registrar os itens do pedido. Tente novamente.");
    }

    await supabaseAdmin
      .from("order_status_history")
      .insert({ order_id: order.id, status: "novo", note: "Pedido recebido pelo site" });

    return { orderNumber: order.order_number, total, expectedDate: expectedISO };
  });
