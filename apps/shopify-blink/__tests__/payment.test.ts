import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createBlinkPaymentSession } from '../src/shopify/blinkApi';
import { isValidBitcoinAmount } from '../src/utils/validation';

beforeAll(() => {
  // Setup fetch mock
  const mockFetch = jest.fn();
  global.fetch = mockFetch as unknown as typeof fetch;
});

describe('Blink Payment Integration', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Payment Session Creation', () => {
    it('should create a payment session successfully', async () => {
      const mockResponse = {
        data: {
          createPaymentSession: {
            id: 'test-session-123',
            paymentUrl: 'https://pay.blink.sv/session/test-session-123',
            qrCodeUrl: 'https://qr.example.com/test-session-123'
          }
        }
      };

      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockResponse)
        })
      );

      const input = {
        amount: 100000,
        currency: 'BTC',
        orderId: 'order_123',
        shop: 'test-shop.myshopify.com',
        settlementCurrency: 'BTC' as const
      };

      const result = await createBlinkPaymentSession(input);

      expect(result).toEqual({
        paymentSessionId: 'test-session-123',
        paymentUrl: 'https://pay.blink.sv/session/test-session-123',
        qrCodeUrl: 'https://qr.example.com/test-session-123'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.any(String)
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockError = {
        errors: [{
          message: 'Invalid amount'
        }]
      };

      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve(mockError)
        })
      );

      const input = {
        amount: -1, // Invalid amount
        currency: 'BTC',
        orderId: 'order_123',
        shop: 'test-shop.myshopify.com',
        settlementCurrency: 'BTC' as const
      };

      await expect(createBlinkPaymentSession(input))
        .rejects
        .toThrow('Blink API error');
    });
  });

  describe('Payment Validation', () => {
    it('should validate Bitcoin amounts correctly', () => {
      expect(isValidBitcoinAmount(100000)).toBe(true); // 0.001 BTC
      expect(isValidBitcoinAmount(0)).toBe(false);
      expect(isValidBitcoinAmount(-1)).toBe(false);
      expect(isValidBitcoinAmount(21e14)).toBe(true); // Max supply (21 million BTC)
      expect(isValidBitcoinAmount(21e14 + 1)).toBe(false); // More than max supply
    });
  });
});
