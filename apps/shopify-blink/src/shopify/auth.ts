import express from "express";
import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import dotenv from "dotenv";
import { createBlinkPaymentSession } from "./blinkApi";
import crypto from "crypto";
import '@shopify/shopify-api/adapters/node';

dotenv.config();

export const shopifyAuth = express.Router();

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: ["read_orders", "write_orders", "read_products", "write_products"],
  hostName: process.env.SHOPIFY_APP_URL ? process.env.SHOPIFY_APP_URL.replace(/^https:\/\//, "") : "", // Fix: only call replace if defined
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
});

shopifyAuth.get("/", async (req: express.Request, res: express.Response) => {
  // Start OAuth process
  const shop = req.query.shop as string;
  if (!shop) return res.status(400).send("Missing shop param");
  await shopify.auth.begin({
    shop,
    callbackPath: "/auth/callback",
    isOnline: true,
    rawRequest: req,
    rawResponse: res,
  });
  // shopify.auth.begin will handle the redirect
});

shopifyAuth.get("/callback", async (req: express.Request, res: express.Response) => {
  try {
    const { session } = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });
    // Store session info as needed (e.g., DB)
    res.redirect(`/settings?shop=${session.shop}`);
  } catch (e) {
    res.status(500).send("Auth error");
  }
});

// Blink payment callback endpoint (to be called by Blink after payment)
shopifyAuth.post("/blink/payment-callback", async (req: express.Request, res: express.Response) => {
  try {
    // Extract orderId and paymentStatus from Blink's callback
    const { orderId, paymentStatus, shop, blinkSignature, sessionId } = req.body;

    if (!orderId || !paymentStatus || !shop || !sessionId) {
      return res.status(400).send("Missing required fields");
    }

    // HMAC signature validation (replace 'your-blink-webhook-secret' with your real secret)
    const secret = process.env.BLINK_WEBHOOK_SECRET || 'your-blink-webhook-secret';
    const payload = JSON.stringify(req.body);
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (blinkSignature !== expectedSig) {
      return res.status(401).send("Invalid signature");
    }

    // Update payment status for frontend polling (for demo)
    // You may want to move this to a shared store or DB in production
    const { paymentStatusStore } = require("../blink/client");
    paymentStatusStore[sessionId] = paymentStatus.toLowerCase();

    // Retrieve a session for the shop (implement session storage as needed)
    // For demo, assume offline token is stored/retrievable for the shop
    // const session = await loadShopifySession(shop);

    // For demonstration, create a temporary session (replace with real session retrieval)
    const session = await shopify.session.customAppSession(shop);

    // Map Blink paymentStatus to Shopify order status
    let financialStatus = undefined;
    if (paymentStatus === "PAID") {
      financialStatus = "paid";
    } else if (paymentStatus === "FAILED") {
      financialStatus = "voided";
    } else if (paymentStatus === "PENDING") {
      financialStatus = "pending";
    }

    // Update order status in Shopify
    if (financialStatus) {
      const client = new shopify.rest.Order({ session });
      await client.update(orderId, { financial_status: financialStatus });
    }

    res.status(200).send("Payment status received");
  } catch (err) {
    res.status(500).send("Error processing payment callback");
  }
});

// Endpoint for Shopify to fetch available payment methods (Blink)
shopifyAuth.get("/payment-methods", (req: express.Request, res: express.Response) => {
  // Shopify will call this to get available payment methods for the merchant
  // Respond with Blink as a payment method
  res.json([
    {
      name: "Blink",
      id: "blink",
      description: "Pay with Bitcoin or Stablesats via Blink",
      // Add more fields as required by Shopify's payment custom integration
    }
  ]);
});

// Endpoint to initiate a Blink payment session from Shopify checkout
shopifyAuth.post("/payment/session", async (req: express.Request, res: express.Response) => {
  // Shopify will call this to initiate a payment session with Blink
  // Extract order/cart info from req.body
  const { orderId, amount, currency, shop, settlementCurrency } = req.body;

  try {
    // Default to BTC if not provided
    const settlement = settlementCurrency === "USD" ? "USD" : "BTC";
    const session = await createBlinkPaymentSession({
      orderId,
      amount,
      currency,
      shop,
      settlementCurrency: settlement,
    });
    // Return a redirect URL to the payment page
    res.json({
      ...session,
      redirectUrl: `/blink/payment/${session.paymentSessionId}`
    });
  } catch (err) {
    let message = "Unknown error";
    if (err instanceof Error) message = err.message;
    res.status(500).json({ error: "Failed to create Blink payment session", details: message });
  }
});

// Next steps:
// - Integrate with Shopify checkout to add Blink as a payment method.
// - Implement order status updates based on Blink payment confirmations.
