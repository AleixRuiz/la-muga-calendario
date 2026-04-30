CREATE POLICY "Anon insert sales_tickets" ON "public"."sales_tickets" FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon insert sales_categories" ON "public"."sales_categories" FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon insert sales_products" ON "public"."sales_products" FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon insert sales_catalogo" ON "public"."sales_catalogo" FOR INSERT TO anon WITH CHECK (true);