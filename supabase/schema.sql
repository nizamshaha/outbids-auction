-- Enable pgcrypto if needed for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create bids table
CREATE TABLE IF NOT EXISTS public.bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    url TEXT NOT NULL,
    amount INT4 NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    stripe_payment_intent_id TEXT NULL
);

-- Index for leaderboard queries and sorting
CREATE INDEX IF NOT EXISTS idx_bids_status_amount_created 
ON public.bids (status, amount DESC, created_at ASC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Allow public read access only to paid bids for the leaderboard
CREATE POLICY "Public can view paid bids" 
ON public.bids 
FOR SELECT 
USING (status = 'paid');

-- Allow inserting pending bids (defense-in-depth policy)
CREATE POLICY "Allow public insert for pending bids" 
ON public.bids 
FOR INSERT 
WITH CHECK (status = 'pending');

-- Enable Realtime for the bids table
-- Note: In Supabase Dashboard, this can also be toggled under Database > Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;

-- Set replica identity to full so that realtime payloads contain complete updated row data
ALTER TABLE public.bids REPLICA IDENTITY FULL;
