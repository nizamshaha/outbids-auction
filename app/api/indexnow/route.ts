import { NextResponse } from 'next/server';

const INDEXNOW_KEY = '48b8a543b35f4705a6d2c4908977e203';
const HOST = 'www.outbids.auction';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

export async function POST(req: Request) {
  try {
    const urlList = [
      `https://${HOST}/`,
      `https://${HOST}/rules`,
      `https://${HOST}/terms`,
      `https://${HOST}/privacy`,
      `https://${HOST}/refunds`,
      `https://${HOST}/contact`,
      `https://${HOST}/feed.xml`,
      `https://${HOST}/sitemap.xml`,
    ];

    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    };

    // Dispatch to IndexNow central endpoint & Bing
    const endpoints = [
      'https://api.indexnow.org/indexnow',
      'https://www.bing.com/indexnow',
    ];

    const results = await Promise.allSettled(
      endpoints.map((endpoint) =>
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify(payload),
        }).then(async (res) => ({
          endpoint,
          status: res.status,
          text: await res.text().catch(() => ''),
        }))
      )
    );

    return NextResponse.json({
      success: true,
      message: 'IndexNow crawl request dispatched successfully',
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'IndexNow endpoint active',
    keyLocation: KEY_LOCATION,
  });
}
