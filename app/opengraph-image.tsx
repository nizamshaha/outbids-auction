import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'OutBids.auction - A Live Marketplace for Digital Visibility';
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
          backgroundColor: '#FFFFFF',
          backgroundImage:
            'radial-gradient(circle at 50% 10%, rgba(255, 75, 75, 0.12), transparent 50%), radial-gradient(circle at 90% 90%, rgba(255, 75, 75, 0.06), transparent 40%)',
          padding: '50px 70px',
          fontFamily: 'sans-serif',
          color: '#0F172A',
          position: 'relative',
        }}
      >
        {/* Top Header & Live Pulse */}
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
              gap: '4px',
            }}
          >
            <span
              style={{
                fontSize: '36px',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: '#111827',
              }}
            >
              OutBids
            </span>
            <span
              style={{
                fontSize: '36px',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: '#FF4B4B',
              }}
            >
              .auction
            </span>
          </div>

          {/* Live Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 20px',
              borderRadius: '999px',
              backgroundColor: '#FFF5F3',
              border: '1.5px solid #FFE4E0',
              color: '#FF4B4B',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.08em',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
              }}
            />
            LIVE ATTENTION MARKETPLACE
          </div>
        </div>

        {/* Center Main Hero Content */}
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
              fontSize: '66px',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '18px',
              color: '#09090B',
            }}
          >
            Claim <span style={{ color: '#FF4B4B' }}>#1</span> for Your Project
          </div>

          <div
            style={{
              fontSize: '24px',
              color: '#64748B',
              lineHeight: 1.4,
              maxWidth: '820px',
              fontWeight: 500,
            }}
          >
            New spots start at $1. Outbid the competition to broadcast your website link live to thousands of visitors.
          </div>
        </div>

        {/* Bottom Feature Pill Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              borderRadius: '14px',
              backgroundColor: '#FFF5F3',
              border: '1.5px solid #FFE4E0',
              fontSize: '15px',
              fontWeight: 800,
              color: '#FF4B4B',
            }}
          >
            👑 #1 Live Spotlight
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              borderRadius: '14px',
              backgroundColor: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              fontSize: '15px',
              fontWeight: 700,
              color: '#334155',
            }}
          >
            ⚡ Real-Time WebSockets
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              borderRadius: '14px',
              backgroundColor: '#F0FDF4',
              border: '1.5px solid #DCFCE7',
              fontSize: '15px',
              fontWeight: 700,
              color: '#15803D',
            }}
          >
            🔒 Dodo Payments Verified
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
