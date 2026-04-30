-- Add month filtering columns and new catalogue table
ALTER TABLE "public"."sales_categories" ADD COLUMN "month" text DEFAULT '2026-03';
ALTER TABLE "public"."sales_products" ADD COLUMN "month" text DEFAULT '2026-03';

CREATE TABLE "public"."sales_catalogo" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "product_id" text,
    "category" text,
    "product" text,
    "price" numeric,
    "month" text DEFAULT '2026-04',
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY ("id")
);

ALTER TABLE "public"."sales_catalogo" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read sales_catalogo" ON "public"."sales_catalogo" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert sales_catalogo" ON "public"."sales_catalogo" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete sales_catalogo" ON "public"."sales_catalogo" FOR DELETE TO authenticated USING (true);
