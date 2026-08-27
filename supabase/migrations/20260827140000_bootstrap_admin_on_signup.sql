-- One-time bootstrap mechanism: when the initial admin account is created via
-- Supabase Auth (through Lovable Cloud's own Users panel, since neither the
-- app nor a client ever has service_role access to write profiles/user_roles
-- directly), automatically provision the matching profile and admin role.
--
-- Only joicegoncalvesvh@gmail.com is auto-granted the admin role, matching
-- the "no automatic second admin account" requirement — any other new
-- auth user still gets a profile row (harmless on its own) but no role,
-- so they have zero access until an existing admin grants one manually.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, must_change_password, full_name)
  VALUES (NEW.id, NEW.email, true, 'Dona do Ateliê')
  ON CONFLICT (id) DO NOTHING;

  IF NEW.email = 'joicegoncalvesvh@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
