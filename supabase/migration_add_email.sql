-- Migration: Add Email column and index for Unified Payment History & Guest Reconciliation
ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS email TEXT NULL;

-- Create index for fast user email lookups in /history
CREATE INDEX IF NOT EXISTS idx_bids_email 
ON public.bids (email);
