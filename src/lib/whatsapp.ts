/** Normalizes a Brazilian phone number to the international format used by wa.me. */
export function normalizeBrPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (digits.length === 12 || digits.length === 13) {
    if (!digits.startsWith("55")) return null;
    return digits;
  }
  return digits.length >= 10 ? digits : null;
}

export function whatsappLink(phone: string | null | undefined, message?: string): string | null {
  const number = normalizeBrPhone(phone);
  if (!number) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${text}`;
}

export function formatBrPhone(raw: string | null | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  const local = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return raw ?? "—";
}
