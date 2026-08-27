export function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | undefined;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          "mt-1 text-xl font-semibold " +
          (tone === "positive" ? "text-primary" : tone === "negative" ? "text-destructive" : "")
        }
      >
        {value}
      </p>
    </div>
  );
}
