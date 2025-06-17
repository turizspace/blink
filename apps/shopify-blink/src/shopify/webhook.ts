import express from "express";
import { Request, Response } from 'express';
import crypto from 'crypto';
import Redis from 'ioredis';
import { updateShopifyOrder } from './order';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface BlinkWebhookData {
  sessionId: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  orderId: string;
  transactionId: string;
  amount: string;
  currency: string;
}

export function createPaymentStatusWebhook() {
  return async (req: Request, res: Response) => {
    try {
      // Verify webhook signature
      if (!verifyWebhookSignature(req)) {
        return res.status(401).send('Invalid signature');
      }

      const {
        sessionId,
        status,
        orderId,
        transactionId,
        amount,
        currency
      } = req.body as BlinkWebhookData;

      // Validate required fields
      if (!sessionId || !status || !orderId) {
        return res.status(400).send('Missing required fields');
      }

      // Store payment status in Redis (expires in 1 hour)
      await redis.set(`paymentStatus:${sessionId}`, status, 'EX', 3600);

      // Update Shopify order status
      await updateShopifyOrder(orderId, {
        financialStatus: mapBlinkStatusToShopify(status),
        transactionId,
        amount,
        currency
      });

      res.status(200).send('Webhook processed successfully');
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).send('Internal server error');
    }
  };
}

function verifyWebhookSignature(req: Request): boolean {
  const signature = req.headers['x-blink-signature'];
  const secret = process.env.BLINK_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return false;
  }

  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
}

function mapBlinkStatusToShopify(status: string): string {
  switch (status) {
    case 'PAID':
      return 'paid';
    case 'FAILED':
      return 'voided';
    case 'PENDING':
    default:
      return 'pending';
  }
}

export const shopifyWebhook = express.Router();

// Shopify webhook for payment confirmation
shopifyWebhook.post(
  "/payment",
  (req: express.Request, res: express.Response) => {
    // TODO: Validate webhook, update Shopify order status, notify merchant, etc.
    res.status(200).send("Webhook received");
  }
);
