-- Create tables for the CSV dashboard data
CREATE TABLE "public"."sales_tickets" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "serie" text,
    "ticket" integer,
    "date" date,
    "time" time without time zone,
    "total" numeric,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."sales_categories" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "category" text,
    "sales" integer,
    "total" numeric,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "public"."sales_products" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "category" text,
    "product" text,
    "sales" integer,
    "total" numeric,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY ("id")
);

-- RLS
ALTER TABLE "public"."sales_tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sales_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sales_products" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read sales_tickets" ON "public"."sales_tickets" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert sales_tickets" ON "public"."sales_tickets" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete sales_tickets" ON "public"."sales_tickets" FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read sales_categories" ON "public"."sales_categories" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert sales_categories" ON "public"."sales_categories" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete sales_categories" ON "public"."sales_categories" FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read sales_products" ON "public"."sales_products" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert sales_products" ON "public"."sales_products" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete sales_products" ON "public"."sales_products" FOR DELETE TO authenticated USING (true);