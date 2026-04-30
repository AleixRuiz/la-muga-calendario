DROP POLICY IF EXISTS "Anon insert sales_catalogo" ON "public"."sales_catalogo";
CREATE POLICY "Anon insert sales_catalogo" ON "public"."sales_catalogo" FOR INSERT TO anon WITH CHECK (true);
