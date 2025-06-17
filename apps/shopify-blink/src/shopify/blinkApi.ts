// Utility for interacting with the Blink GraphQL API
// Replace placeholders with real endpoint and credentials after setup

export interface BlinkPaymentSessionInput {
  amount: number;
  currency: string;
  orderId: string;
  shop: string;
  settlementCurrency: 'BTC' | 'USD'; // 'USD' for Stablesats
}

export interface BlinkPaymentSessionResult {
  paymentSessionId: string;
  paymentUrl: string;
  qrCodeUrl?: string;
}

// Placeholder: Replace with actual Blink GraphQL endpoint
const BLINK_GRAPHQL_ENDPOINT = process.env.BLINK_GRAPHQL_ENDPOINT || 'https://blink.example.com/graphql';
// Placeholder: Replace with actual Blink API key/token
const BLINK_API_KEY = process.env.BLINK_API_KEY || 'your-blink-api-key';

export async function createBlinkPaymentSession(input: BlinkPaymentSessionInput): Promise<BlinkPaymentSessionResult> {
  const query = `
    mutation CreatePaymentSession($input: CreatePaymentSessionInput!) {
      createPaymentSession(input: $input) {
        id
        paymentUrl
        qrCodeUrl
      }
    }
  `;
  const variables = {
    input: {
      amount: input.amount,
      currency: input.currency,
      orderId: input.orderId,
      shop: input.shop,
      settlementCurrency: input.settlementCurrency,
    },
  };

 const response = await fetch(BLINK_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BLINK_API_KEY}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  if (typeof result !== 'object' || result === null) {
    throw new Error('Blink API error: Invalid response format');
  }
  if ('errors' in result) {
    throw new Error('Blink API error: ' + JSON.stringify((result as any).errors));
  }
  const data = (result as any).data;
  if (!data || typeof data !== 'object' || !('createPaymentSession' in data)) {
    throw new Error('Blink API error: Missing payment session data');
  }
  const session = (data as any).createPaymentSession;
  return {
    paymentSessionId: session.id,
    paymentUrl: session.paymentUrl,
    qrCodeUrl: session.qrCodeUrl,
  };
}
