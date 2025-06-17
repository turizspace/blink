import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createBlinkPaymentSession } from '../src/shopify/blinkApi';
import { updateShopifyOrder } from '../src/shopify/order';
import { createPaymentStatusWebhook } from '../src/shopify/webhook';
import request from 'supertest';
import express from 'express';
import Redis from 'ioredis';

// Mock external dependencies
jest.mock('../src/shopify/blinkApi');
jest.mock('../src/shopify/order');
jest.mock('ioredis');

describe('Bitcoin Payment Flow Integration', () => {
  let app: express.Express;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup Express app with webhook endpoint
    app = express();
    app.use(express.json());
    app.post('/webhook', createPaymentStatusWebhook());
  });

  it('should handle complete payment flow successfully', async () => {
    // 1. Create payment session
    const mockSession = {
      paymentSessionId: 'test-session-123',
      paymentUrl: 'https://pay.blink.sv/session/test-session-123',
      qrCodeUrl: 'https://qr.example.com/test-session-123'
    };

    (createBlinkPaymentSession as jest.Mock).mockResolvedValueOnce(mockSession);

    const sessionResult = await createBlinkPaymentSession({
      amount: 100000,
      currency: 'BTC',
      orderId: 'order_123',
      shop: 'test-shop.myshopify.com',
      settlementCurrency: 'BTC'
    });

    expect(sessionResult).toEqual(mockSession);

    // 2. Simulate payment confirmation webhook
    const webhookData = {
      sessionId: mockSession.paymentSessionId,
      status: 'PAID',
      orderId: 'gid://shopify/Order/123',
      transactionId: 'blink_tx_123',
      amount: '100000',
      currency: 'BTC'
    };

    // Mock webhook signature verification
    process.env.BLINK_WEBHOOK_SECRET = 'test-secret';
    const mockSignature = 'valid-signature';

    const webhookResponse = await request(app)
      .post('/webhook')
      .set('X-Blink-Signature', mockSignature)
      .send(webhookData);

    expect(webhookResponse.status).toBe(200);

    // 3. Verify Redis status update
    expect(Redis.prototype.set).toHaveBeenCalledWith(
      'paymentStatus:test-session-123',
      'PAID',
      'EX',
      3600
    );

    // 4. Verify Shopify order update
    expect(updateShopifyOrder).toHaveBeenCalledWith('gid://shopify/Order/123', {
      financialStatus: 'paid',
      transactionId: 'blink_tx_123',
      amount: '100000',
      currency: 'BTC'
    });
  });

  it('should handle failed payments correctly', async () => {
    // Similar to success flow, but with FAILED status
    const mockSession = {
      paymentSessionId: 'test-session-456',
      paymentUrl: 'https://pay.blink.sv/session/test-session-456',
      qrCodeUrl: 'https://qr.example.com/test-session-456'
    };

    (createBlinkPaymentSession as jest.Mock).mockResolvedValueOnce(mockSession);

    // Create session
    const sessionResult = await createBlinkPaymentSession({
      amount: 50000,
      currency: 'BTC',
      orderId: 'order_456',
      shop: 'test-shop.myshopify.com',
      settlementCurrency: 'BTC'
    });

    expect(sessionResult).toEqual(mockSession);

    // Simulate failed payment webhook
    const webhookData = {
      sessionId: mockSession.paymentSessionId,
      status: 'FAILED',
      orderId: 'gid://shopify/Order/456',
      transactionId: 'blink_tx_456',
      amount: '50000',
      currency: 'BTC'
    };

    process.env.BLINK_WEBHOOK_SECRET = 'test-secret';
    const mockSignature = 'valid-signature';

    const webhookResponse = await request(app)
      .post('/webhook')
      .set('X-Blink-Signature', mockSignature)
      .send(webhookData);

    expect(webhookResponse.status).toBe(200);

    // Verify status updates
    expect(Redis.prototype.set).toHaveBeenCalledWith(
      'paymentStatus:test-session-456',
      'FAILED',
      'EX',
      3600
    );

    expect(updateShopifyOrder).toHaveBeenCalledWith('gid://shopify/Order/456', {
      financialStatus: 'voided',
      transactionId: 'blink_tx_456',
      amount: '50000',
      currency: 'BTC'
    });
  });
});
