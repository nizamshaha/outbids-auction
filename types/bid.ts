export type BidStatus = 'pending' | 'paid' | 'failed';

export type BidCategory =
  | 'AI'
  | 'Productivity'
  | 'SEO'
  | 'DevTools'
  | 'Design'
  | 'Marketing'
  | 'E-Commerce'
  | 'Crypto'
  | 'Other';

export interface Bid {
  id: string;
  created_at: string;
  updated_at?: string;
  url: string;
  amount: number; // in USD cents (e.g. 500 = $5.00, 0 = Free)
  status: BidStatus;
  category?: string;
  title?: string | null;
  description?: string | null;
  icon_url?: string | null;
  click_count?: number;
  view_count?: number;
  stripe_payment_intent_id?: string | null;
}

export interface CreateCheckoutPayload {
  url: string;
  amountInDollars: number;
  category?: string;
  title?: string;
  description?: string;
}

export interface CheckoutResponse {
  url?: string;
  orderId?: string;
  bidId?: string;
  provider?: 'paypal' | 'free' | 'dodopayments';
  isTopUp?: boolean;
  amountChargedDollars?: number;
  totalBidDollars?: number;
  error?: string;
}

export interface LeaderboardStats {
  totalBidsCount: number;
  highestBidAmount: number;
  totalVolume: number;
}
