import { NextRequest, NextResponse } from 'next/server';
import DodoPayments from 'dodopayments';
import { createAdminClient, supabaseAdmin } from '@/utils/supabase/admin';
import { sanitizeAndNormalizeUrl } from '@/utils/formatters';
import { createPayPalOrder } from '@/utils/paypal';

const MINIMUM_BID_CENTS = 500; // Minimum $5.00

export async function POST(req: NextRequest) {
  try {
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

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.nextUrl.origin ||
      'https://outbids.auction';

    // 3. Check for PayPal Integration first
    const paypalClientId =
      process.env.PAYPAL_CLIENT_ID ||
      process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
      '';
    const paypalSecret = process.env.PAYPAL_SECRET || '';

    if (paypalClientId && paypalSecret) {
      try {
        console.log(`[Checkout] Creating PayPal order for bid ${newBid.id} ($${amountCents / 100})`);
        const paypalOrder = await createPayPalOrder({
          amountInDollars: amountCents / 100,
          bidId: newBid.id,
          returnUrl: `${siteUrl}/api/paypal/capture?bid_id=${newBid.id}`,
          cancelUrl: `${siteUrl}/?canceled=true`,
        });

        return NextResponse.json({
          url: paypalOrder.approvalUrl,
          orderId: paypalOrder.orderId,
          bidId: newBid.id,
          provider: 'paypal',
        });
      } catch (paypalError: any) {
        console.error('[Checkout] PayPal order creation error:', paypalError);
        // Fallback to Dodo Payments if PayPal fails
      }
    }

    // 4. Fallback to Dodo Payments
    const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY || '';
    const dodoEnvironment =
      (process.env.DODO_PAYMENTS_ENVIRONMENT as 'live_mode' | 'test_mode') || 'test_mode';
    const dodoProductId = process.env.DODO_PAYMENTS_PRODUCT_ID || '';

    if (dodoApiKey && dodoProductId) {
      const dodo = new DodoPayments({
        bearerToken: dodoApiKey,
        environment: dodoEnvironment,
      });

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
            product_id: dodoProductId,
            amount: amountCents,
            quantity: 1,
          },
        ],
      });

      const checkoutUrl =
        payment.payment_link ||
        (payment as any).payment_link_url ||
        (payment as any).url;

      if (checkoutUrl) {
        return NextResponse.json({
          url: checkoutUrl,
          bidId: newBid.id,
          provider: 'dodopayments',
        });
      }
    }

    return NextResponse.json(
      { error: 'No active payment gateway configured. Please check PayPal or Dodo credentials.' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Checkout API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'An internal server error occurred during checkout initialization.' },
      { status: 500 }
    );
  }
}
