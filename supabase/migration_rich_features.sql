-- Migration: Add Categories, Rich Metadata, View & Click Counts, and Analytics Table

-- 1. Add new columns to public.bids
ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Other';

ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS title TEXT NULL;

ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS description TEXT NULL;

ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS icon_url TEXT NULL;

ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS click_count INT4 NOT NULL DEFAULT 0;

ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS view_count INT4 NOT NULL DEFAULT 0;

ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Create Analytics Events table for deduplicated IP click tracking
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL DEFAULT 'click',
    ip_hash TEXT NOT NULL
);

-- Index for fast 24h deduplication lookups
CREATE INDEX IF NOT EXISTS idx_analytics_bid_ip_created 
ON public.analytics_events (bid_id, ip_hash, created_at DESC);

-- Enable RLS on analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow server service role full access
CREATE POLICY "Allow service role full access on analytics" 
ON public.analytics_events 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 3. Atomic RPC Function to record deduplicated click
CREATE OR REPLACE FUNCTION record_bid_click(target_bid_id UUID, client_ip_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recent_click_exists BOOLEAN;
BEGIN
    -- Check if click occurred from this IP in the last 24 hours
    SELECT EXISTS (
        SELECT 1 FROM public.analytics_events
        WHERE bid_id = target_bid_id
          AND ip_hash = client_ip_hash
          AND created_at >= (now() - interval '24 hours')
    ) INTO recent_click_exists;

    -- If no recent click, log the event and increment counter
    IF NOT recent_click_exists THEN
        INSERT INTO public.analytics_events (bid_id, ip_hash, event_type)
        VALUES (target_bid_id, client_ip_hash, 'click');

        UPDATE public.bids
        SET click_count = click_count + 1
        WHERE id = target_bid_id;

        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;
