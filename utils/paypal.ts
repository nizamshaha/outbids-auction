/**
 * PayPal API Helper for Server-Side Checkout & Order Capture
 */

const getPayPalBaseUrl = () => {
  const env = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
  return env === 'live' || env === 'live_mode' || env === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
};

/**
 * Generate OAuth2 Access Token from PayPal
 */
export async function getPayPalAccessToken(): Promise<string> {
  const clientId =
    process.env.PAYPAL_CLIENT_ID ||
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
    '';
  const secret = process.env.PAYPAL_SECRET || '';

  if (!clientId || !secret) {
    throw new Error('Missing PayPal Client ID or Secret in environment variables.');
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('PayPal OAuth error:', errorText);
    throw new Error(`Failed to authenticate with PayPal: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a PayPal Order with custom amount and metadata
 */
export async function createPayPalOrder(params: {
  amountInDollars: number;
  bidId: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ orderId: string; approvalUrl: string }> {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        custom_id: params.bidId,
        description: 'Outbids.auction Billboard Placement',
        amount: {
          currency_code: 'USD',
          value: params.amountInDollars.toFixed(2),
        },
      },
    ],
    application_context: {
      brand_name: 'Outbids.auction',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
    },
  };

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('PayPal create order error:', errorData);
    throw new Error(`PayPal Order Creation failed: ${errorData}`);
  }

  const order = await response.json();

  const approveLink = order.links?.find(
    (link: { rel: string; href: string }) => link.rel === 'approve' || link.rel === 'payer-action'
  );

  if (!approveLink?.href) {
    throw new Error('No PayPal approval link found in response.');
  }

  return {
    orderId: order.id,
    approvalUrl: approveLink.href,
  };
}

/**
 * Capture a PayPal Order after user approval
 */
export async function capturePayPalOrder(orderId: string): Promise<any> {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('PayPal capture error:', errorData);
    throw new Error(`PayPal Order Capture failed: ${errorData}`);
  }

  return await response.json();
}
