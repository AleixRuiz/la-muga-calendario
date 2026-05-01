-- Remove duplicate tickets keeping the latest inserted one
DELETE FROM public.sales_tickets
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY ticket, date ORDER BY created_at DESC, id DESC) as rn
        FROM public.sales_tickets
    ) sub
    WHERE rn > 1
);

-- Prevent future duplicates by enforcing a unique constraint on ticket and date
ALTER TABLE public.sales_tickets
ADD CONSTRAINT unique_ticket_date UNIQUE (ticket, date);
