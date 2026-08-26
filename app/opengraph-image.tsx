import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Outbids.auction - Real-Time Bidding Leaderboard';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#08090d',
          backgroundImage:
            'radial-gradient(circle at 50% 20%, rgba(249, 115, 22, 0.18), transparent 50%), radial-gradient(circle at 80% 80%, rgba(234, 88, 12, 0.12), transparent 40%)',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Top Header & Live Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* Logo Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              👑
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: '#ffffff',
              }}
            >
              OUTBIDS<span style={{ color: '#f97316' }}>.AUCTION</span>
            </div>
          </div>

          {/* Live Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '999px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '14px',
              fontWeight: 800,
              letterSpacing: '0.08em',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
              }}
            />
            LIVE 24/7 LEADERBOARD
          </div>
        </div>

        {/* Center Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '1000px',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.04em',
              marginBottom: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '14px',
            }}
          >
            <span>Claim</span>
            <span
              style={{
                color: '#f97316',
                textDecoration: 'underline',
              }}
            >
              #1
            </span>
            <span>on the Live Digital Billboard</span>
          </div>

          <div
            style={{
              fontSize: '24px',
              color: '#9ca3af',
              lineHeight: 1.4,
              maxWidth: '820px',
            }}
          >
            Outbid the competition to broadcast your website link globally in real-time.
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '16px',
              fontWeight: 700,
              color: '#e5e7eb',
            }}
          >
            ⚡ Real-Time WebSockets
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '16px',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              fontSize: '16px',
              fontWeight: 700,
              color: '#fb923c',
            }}
          >
            🏆 Top 3 Glowing Podium
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '16px',
              backgroundColor: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              fontSize: '16px',
              fontWeight: 700,
              color: '#34d399',
            }}
          >
            💳 Instant PayPal Checkout
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
