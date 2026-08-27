import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

type AdminSessionState =
  | { status: "loading" }
  | { status: "redirecting" }
  | { status: "authorized"; userId: string; email: string };

/**
 * Client-side admin guard. Sessions in this project live in localStorage
 * (see previewAuthStorage), never in a cookie, so SSR has no way to know
 * who's logged in — the real protection is RLS on every query. This hook
 * only avoids flashing admin UI at an unauthorized visitor after hydration.
 */
export function useAdminSession(): AdminSessionState {
  const navigate = useNavigate();
  const [state, setState] = useState<AdminSessionState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        if (cancelled) return;
        setState({ status: "redirecting" });
        navigate({ to: "/admin/login" });
        return;
      }

      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("must_change_password").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);

      if (cancelled) return;

      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      if (!isAdmin) {
        setState({ status: "redirecting" });
        navigate({ to: "/admin/login" });
        return;
      }

      if (profile?.must_change_password) {
        setState({ status: "redirecting" });
        navigate({ to: "/admin/change-password" });
        return;
      }

      setState({ status: "authorized", userId: user.id, email: user.email ?? "" });
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return state;
}
