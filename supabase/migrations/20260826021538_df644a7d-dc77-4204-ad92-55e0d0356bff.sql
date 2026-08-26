
CREATE POLICY "admin manage product images objects" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin())
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
