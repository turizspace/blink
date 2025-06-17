import { LATEST_API_VERSION, shopifyApi } from '@shopify/shopify-api';

interface OrderUpdateParams {
  financialStatus: string;
  transactionId: string;
  amount: string;
  currency: string;
}

export async function updateShopifyOrder(orderId: string, params: OrderUpdateParams) {
  try {
    const shopify = shopifyApi({
      apiKey: process.env.SHOPIFY_API_KEY!,
      apiSecretKey: process.env.SHOPIFY_API_SECRET!,
      apiVersion: LATEST_API_VERSION,
      isEmbeddedApp: true,
      hostName: process.env.SHOPIFY_APP_URL ? process.env.SHOPIFY_APP_URL.replace(/^https:\/\//, '') : '',
    });

    // Extract Shopify order ID from GID format (gid://shopify/Order/123 -> 123)
    const plainOrderId = orderId.split('/').pop() || orderId;

    // Create a client session for the shop
    const session = await shopify.session.customAppSession(plainOrderId);
    
    // Update order status
    const client = new shopify.clients.Rest({ session });
    await client.put({
      path: `orders/${plainOrderId}`,
      data: {
        order: {
          financial_status: params.financialStatus,
          transactions: [
            {
              kind: 'sale',
              status: params.financialStatus === 'paid' ? 'success' : 'failure',
              amount: params.amount,
              currency: params.currency,
              gateway: 'blink',
              gateway_reference: params.transactionId,
            }
          ]
        }
      }
    });

    return true;
  } catch (error) {
    console.error('Failed to update Shopify order:', error);
    throw error;
  }
}
