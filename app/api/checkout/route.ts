import { NextRequest, NextResponse } from 'next/server';
import DodoPayments from 'dodopayments';
import { createAdminClient, supabaseAdmin } from '@/utils/supabase/admin';
import { sanitizeAndNormalizeUrl } from '@/utils/formatters';

const MINIMUM_BID_CENTS = 500; // Minimum $5.00

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.DODO_PAYMENTS_API_KEY || '';
    const environment =
      (process.env.DODO_PAYMENTS_ENVIRONMENT as 'live_mode' | 'test_mode') || 'test_mode';
    const productId = process.env.DODO_PAYMENTS_PRODUCT_ID || '';

    if (!apiKey || apiKey.includes('your_live_or_test_api_key')) {
      return NextResponse.json(
        {
          error:
            'DODO_PAYMENTS_API_KEY is not configured in .env.local. Please add your Dodo Payments API key to proceed to checkout.',
        },
        { status: 500 }
      );
    }

    if (!productId || productId.includes('your_bid_product_id')) {
      return NextResponse.json(
        {
          error:
            'DODO_PAYMENTS_PRODUCT_ID is not configured in .env.local. Please create a product in Dodo Payments and add its ID (pdt_...).',
        },
        { status: 500 }
      );
    }

    // Initialize Dodo Payments client
    const dodo = new DodoPayments({
      bearerToken: apiKey,
      environment,
    });

    const body = await req.json();
    const { url, amount, amountInDollars, email, name, country } = body;

    // Normalize amount to cents
    let amountCents: number;
    if (typeof amount === 'number') {
      amountCents = amount >= 100 && Number.isInteger(amount) ? amount : Math.round(amount * 100);
    } else if (typeof amountInDollars === 'number') {
      amountCents = Math.round(amountInDollars * 100);
    } else {
      return NextResponse.json(
        { error: 'Invalid or missing bid amount.' },
        { status: 400 }
      );
    }

    // 1. Validate minimum bid ($5 = 500 cents)
    if (amountCents < MINIMUM_BID_CENTS) {
      return NextResponse.json(
        { error: `Bid amount must be at least $5.00 (${MINIMUM_BID_CENTS / 100} USD).` },
        { status: 400 }
      );
    }

    // Validate and sanitize URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Website URL is required.' },
        { status: 400 }
      );
    }

    const urlCheck = sanitizeAndNormalizeUrl(url);
    if (!urlCheck.isValid) {
      return NextResponse.json(
        { error: urlCheck.error || 'Invalid URL provided.' },
        { status: 400 }
      );
    }

    const normalizedUrl = urlCheck.normalizedUrl;
    const displayDomain = urlCheck.displayDomain;

    // 2. Insert pending record into Supabase
    const dbClient = createAdminClient ? createAdminClient() : supabaseAdmin;
    const { data: newBid, error: dbError } = await dbClient
      .from('bids')
      .insert({
        url: normalizedUrl,
        amount: amountCents,
        status: 'pending',
      })
      .select('id')
      .single();

    if (dbError || !newBid) {
      console.error('Error inserting pending bid into Supabase:', dbError);
      return NextResponse.json(
        {
          error: `Database error creating pending bid: ${dbError?.message || 'Failed to insert pending bid'}`,
        },
        { status: 500 }
      );
    }

    // 3. Create Dodo Checkout Session
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.nextUrl.origin ||
      'http://localhost:3001';

    const customerEmail = email || `bidder_${newBid.id.slice(0, 8)}@outbid.live`;
    const customerName = name || `Bidder for ${displayDomain}`;

    const payment = await dodo.payments.create({
      payment_link: true,
      billing: {
        country: country || 'US',
      },
      customer: {
        email: customerEmail,
        name: customerName,
      },
      return_url: `${siteUrl}/?success=true&bid_id=${newBid.id}`,
      metadata: {
        bid_id: newBid.id,
        bid_url: normalizedUrl,
        display_domain: displayDomain,
      },
      product_cart: [
        {
          product_id: productId,
          amount: amountCents, // Dynamic amount in cents via Pay What You Want / custom pricing
          quantity: 1,
        },
      ],
    });

    const checkoutUrl =
      payment.payment_link ||
      (payment as any).payment_link_url ||
      (payment as any).url;

    if (!checkoutUrl) {
      console.error('Dodo Payments response missing payment link:', payment);
      return NextResponse.json(
        { error: 'Failed to generate Dodo Payments checkout URL.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: checkoutUrl,
      bidId: newBid.id,
    });
  } catch (error: any) {
    console.error('Checkout API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'An internal server error occurred during checkout initialization.' },
      { status: 500 }
    );
  }
}
