export type BidStatus = 'pending' | 'paid' | 'failed';

export interface Bid {
  id: string;
  created_at: string;
  url: string;
  amount: number; // in USD cents (e.g. 500 = $5.00)
  status: BidStatus;
  stripe_payment_intent_id?: string | null;
}

export interface CreateCheckoutPayload {
  url: string;
  amountInDollars: number;
}

export interface CheckoutResponse {
  url?: string;
  error?: string;
}

export interface LeaderboardStats {
  totalBidsCount: number;
  highestBidAmount: number;
  totalVolume: number;
}
