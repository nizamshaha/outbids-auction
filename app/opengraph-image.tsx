import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Outbids.auction - A live marketplace for digital visibility';
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
          backgroundColor: '#faf5ee',
          backgroundImage:
            'radial-gradient(circle at 50% 20%, rgba(194, 101, 42, 0.12), transparent 55%), radial-gradient(circle at 85% 85%, rgba(194, 101, 42, 0.08), transparent 45%)',
          padding: '60px 80px',
          fontFamily: 'serif',
          color: '#3a302a',
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
                fontSize: '32px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#c2652a',
                fontFamily: 'serif',
              }}
            >
              OutBids.auction
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
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#047857',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              fontFamily: 'sans-serif',
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
            LIVE 24/7 MARKETPLACE
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
              fontSize: '60px',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: '20px',
              color: '#3a302a',
              fontFamily: 'serif',
            }}
          >
            A live marketplace for digital visibility.
          </div>

          <div
            style={{
              fontSize: '24px',
              color: '#605850',
              lineHeight: 1.4,
              maxWidth: '820px',
              fontFamily: 'sans-serif',
            }}
          >
            New spots start at $1. Outbid the competition to broadcast your website link live in real-time.
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            width: '100%',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '12px',
              backgroundColor: '#f2ece4',
              border: '1px solid #d8d0c8',
              fontSize: '14px',
              fontWeight: 700,
              color: '#3a302a',
            }}
          >
            ⚡ Live Supabase WebSockets
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '12px',
              backgroundColor: '#fbe8d8',
              border: '1px solid rgba(194, 101, 42, 0.3)',
              fontSize: '14px',
              fontWeight: 700,
              color: '#c2652a',
            }}
          >
            🏆 Top 3 Showcase
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '14px',
              fontWeight: 700,
              color: '#047857',
            }}
          >
            🛡️ Dodo Payments Verified
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
