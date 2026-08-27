import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/esqueci-senha")({
  head: () => ({ meta: [{ title: "Esqueci minha senha | Ateliê da JHE" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Always show the same success message regardless of whether the e-mail
    // exists, so this can't be used to enumerate admin accounts.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/redefinir-senha`,
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="text-display text-2xl font-semibold">Ateliê da JHE</p>
          <p className="mt-1 text-xs text-muted-foreground">Recuperar senha</p>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          {sent ? (
            <div className="text-center">
              <p className="text-sm text-foreground">
                Se esse e-mail estiver cadastrado, enviamos um link de recuperação. Verifique sua
                caixa de entrada.
              </p>
              <Link
                to="/admin/login"
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
              <Link
                to="/admin/login"
                className="block text-center text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Voltar para o login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
