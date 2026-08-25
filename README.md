# Outbid - Real-Time Bidding Leaderboard

A full-stack Next.js (App Router, Tailwind CSS, TypeScript) real-time bidding leaderboard web application inspired by **Outbid.lol**, powered by **Supabase Realtime** and **Dodo Payments**.

Users can bid to showcase their website links at the top of the leaderboard. Verified payments through Dodo Payments trigger real-time updates across all connected browsers using Supabase Realtime subscriptions.

---

## Features

- **⚡ Real-Time WebSocket Updates**: Supabase `postgres_changes` automatically updates and re-ranks bids live without page refreshes.
- **🦤 Dodo Payments Integration**: Handles global payments, digital products, and Merchant of Record checkout.
- **🛡️ Dodo Webhook Handler**: Signature verification via `@dodopayments/nextjs` automatically marks bids as `paid`.
- **👑 Tiered Leaderboard**: Gold, Silver, and Bronze badges for the top 3 spots, domain favicons, and clickable external links.
- **📊 Live Dynamic Stats**: Tracks Top Bid, Total Paid Bids, and Total Bidding Volume.
- **✨ Modern Glassmorphic UI**: Sleek dark aesthetic with responsive design, animations, and confetti celebrations.

---

## Environment Variables (`.env.local`)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://fmuxahgignhhmnprxxey.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Dodo Payments Configuration
DODO_PAYMENTS_API_KEY=your_dodo_api_key
DODO_PAYMENTS_WEBHOOK_KEY=your_dodo_webhook_secret
DODO_PAYMENTS_ENVIRONMENT=test_mode # 'test_mode' or 'live_mode'
DODO_PAYMENTS_PRODUCT_ID=pdt_your_bid_product_id

# Base Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

---

## 🚀 Running Locally

```bash
# Start development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.
