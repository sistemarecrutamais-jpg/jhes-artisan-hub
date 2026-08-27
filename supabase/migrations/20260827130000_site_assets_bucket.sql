-- Public bucket for site-wide assets administered in Configurações (logo, etc).
-- Separate from `product-images` (private, served through /api/public/img/$)
-- because these assets are meant to be directly, publicly linkable.
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read site assets" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'site-assets');

CREATE POLICY "admin manage site assets" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'site-assets' AND public.is_admin())
WITH CHECK (bucket_id = 'site-assets' AND public.is_admin());
