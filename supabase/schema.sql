-- Enable pgcrypto if needed for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create bids table
CREATE TABLE IF NOT EXISTS public.bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    url TEXT NOT NULL,
    amount INT4 NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'disputed')),
    stripe_payment_intent_id TEXT NULL,
    category TEXT NOT NULL DEFAULT 'Other',
    title TEXT NULL,
    description TEXT NULL,
    icon_url TEXT NULL,
    click_count INT4 NOT NULL DEFAULT 0 CHECK (click_count >= 0),
    view_count INT4 NOT NULL DEFAULT 0 CHECK (view_count >= 0)
);

-- Index for leaderboard queries and deterministic sorting
CREATE INDEX IF NOT EXISTS idx_bids_status_amount_created 
ON public.bids (status, amount DESC, created_at ASC);

-- Unique index on URL to prevent duplicate listings
CREATE UNIQUE INDEX IF NOT EXISTS idx_bids_unique_url
ON public.bids (url);

-- Unique index on Payment Intent / Capture ID to enforce financial idempotency at database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_bids_unique_payment_intent
ON public.bids (stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Allow public read access ONLY to paid bids for the leaderboard
CREATE POLICY "Public can view paid bids" 
ON public.bids 
FOR SELECT 
USING (status = 'paid');

-- Restrict all mutations (INSERT, UPDATE, DELETE) to Server Service Role ONLY
-- Anonymous / authenticated client roles cannot write to public.bids directly
CREATE POLICY "Allow service role full write access" 
ON public.bids 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Enable Realtime for the bids table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;

-- Set replica identity to full so that realtime payloads contain complete updated row data
ALTER TABLE public.bids REPLICA IDENTITY FULL;
