export type BidStatus = 'pending' | 'paid' | 'failed';

export const PLATFORM_CATEGORIES = [
  'SEO & AI Visibility',
  'AI Agents & Infrastructure',
  'AI Media Generation',
  'Developer Tools',
  'Productivity & Personal Tools',
  'Writing & Content',
  'People & Profiles',
  'Directories, Launch & Discovery',
  'Design & Creative',
  'Agencies, Studios & Services',
  'Marketing & Advertising',
  'Social Media & Creator Tools',
  'Education & Learning',
  'Sales & Lead Generation',
  'Travel, Local & Lifestyle',
  'Crypto, Web3 & Investing',
  'Domains & Web Assets',
  'Health, Fitness & Wellness',
  'Leaderboards & Attention Markets',
  'Media & News',
  'Business, Finance & Legal',
  'Ecommerce & Retail',
  'Hiring, Jobs & Careers',
  'Audio, Voice & Podcasting',
  'Security, Privacy & Compliance',
  'Real Estate & Property',
  'Games & Entertainment',
  'Other',
] as const;

export type BidCategory = (typeof PLATFORM_CATEGORIES)[number];

export interface Bid {
  id: string;
  created_at: string;
  updated_at?: string;
  url: string;
  amount: number; // in USD cents (e.g. 100 = $1.00, 0 = Free)
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
  isFreeTier?: boolean;
}

export interface CheckoutResponse {
  url?: string;
  orderId?: string;
  bidId?: string;
  provider?: 'paypal' | 'free' | 'dodopayments';
  isTopUp?: boolean;
  amountChargedDollars?: number;
  totalBidDollars?: number;
  message?: string;
  error?: string;
}

export interface LeaderboardStats {
  totalBidsCount: number;
  highestBidAmount: number;
  totalVolume: number;
}
