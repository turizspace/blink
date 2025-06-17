import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import Redis from 'ioredis';

import { mockCryptoHmac, mockShopifyOrder } from './helpers/mocks';

// Mock Redis first
jest.mock('ioredis');

// Mock other dependencies after
jest.mock('../src/shopify/order', () => ({
  updateShopifyOrder: mockShopifyOrder(true)
}));

// Import the code under test after mocks
import { createPaymentStatusWebhook } from '../src/shopify/webhook';

describe('Payment Status Webhook', () => {
  // Setup Redis mock
  const mockSet = jest.spyOn(Redis.prototype, 'set')
    .mockImplementation(() => Promise.resolve('OK'));
  let app: express.Express;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockCryptoHmac();
    app = express();
    app.use(express.json());
    app.post('/webhook', createPaymentStatusWebhook());
  });

  it('should handle successful payment webhook', async () => {
    const webhookData = {
      sessionId: 'test-session-123',
      status: 'PAID',
      orderId: 'gid://shopify/Order/123',
      transactionId: 'blink_tx_123',
      amount: '100000',
      currency: 'BTC'
    };

    // Mock webhook signature
    const mockSignature = 'valid-signature';
    process.env.BLINK_WEBHOOK_SECRET = 'test-secret';

    const response = await request(app)
      .post('/webhook')
      .set('X-Blink-Signature', mockSignature)
      .send(webhookData);

    expect(response.status).toBe(200);
    expect(Redis.prototype.set).toHaveBeenCalledWith(
      'paymentStatus:test-session-123',
      'PAID',
      'EX',
      3600
    );
  });

  it('should reject webhook with invalid signature', async () => {
    const webhookData = {
      sessionId: 'test-session-123',
      status: 'PAID'
    };

    const response = await request(app)
      .post('/webhook')
      .set('X-Blink-Signature', 'invalid-signature')
      .send(webhookData);

    expect(response.status).toBe(401);
  });

  it('should handle missing required fields', async () => {
    const webhookData = {
      status: 'PAID' // Missing sessionId
    };

    const response = await request(app)
      .post('/webhook')
      .set('X-Blink-Signature', 'valid-signature')
      .send(webhookData);

    expect(response.status).toBe(400);
  });
});
