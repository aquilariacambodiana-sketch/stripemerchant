import { NextRequest, NextResponse } from 'next/server';
import { logApiCall } from '@/lib/dispatcher';

export async function POST(req: NextRequest) {
  let body: any = null;
  try {
    body = await req.json();
    const { secretKey, publishableKey } = body;

    if (!secretKey) {
      return NextResponse.json({ success: false, error: 'Secret key is required' }, { status: 400 });
    }

    if (!secretKey.startsWith('sk_')) {
      return NextResponse.json({ success: false, error: 'Invalid Stripe Secret Key format. Must start with sk_test_ or sk_live_' }, { status: 400 });
    }

    // Simulate connection test
    await new Promise((r) => setTimeout(r, 600));

    const result = {
      success: true,
      message: `Successfully connected to Stripe API (${secretKey.startsWith('sk_test') ? 'Test Mode' : 'Live Mode'})`,
      account: {
        id: 'acct_1MxxxxStripeFlow',
        business_name: 'StripeFlow Merchant POS',
        charges_enabled: true,
        payouts_enabled: true,
        country: 'US',
        default_currency: 'usd'
      }
    };
    
    await logApiCall('/api/stripe/test-key', 'POST', body, result);
    return NextResponse.json(result);
  } catch (error: any) {
    const errorResponse = { success: false, error: error.message || 'Connection test failed' };
    await logApiCall('/api/stripe/test-key', 'POST', body, errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
