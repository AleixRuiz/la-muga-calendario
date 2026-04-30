CREATE POLICY "Allow anon to read sales_catalogo temporaly" ON "public"."sales_catalogo" FOR SELECT TO anon USING (true);
