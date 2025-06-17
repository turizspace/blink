import express from "express";
import { GraphQLClient, gql } from "graphql-request";
import dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config();

export const blinkRouter = express.Router();

const BLINK_API_URL = process.env.BLINK_GRAPHQL_ENDPOINT || "https://api.blink.sv/graphql";
const BLINK_API_KEY = process.env.BLINK_API_KEY;
const BLINK_PAY_URL = process.env.BLINK_PAY_URL || "https://pay.blink.sv";

const blinkClient = new GraphQLClient(BLINK_API_URL, {
  headers: {
    Authorization: `Bearer ${BLINK_API_KEY}`,
  },
});

// Initialize Redis client (configure with your stack's settings)
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

blinkRouter.post("/invoice", async (req: express.Request, res: express.Response) => {
  // Example: create a Lightning invoice for a given amount
  const { amount, currency } = req.body;
  const mutation = gql`
    mutation CreateInvoice($amount: Int!, $currency: String!) {
      invoiceCreate(input: { amount: $amount, currency: $currency }) {
        invoice {
          paymentRequest
          paymentHash
        }
        errors {
          message
        }
      }
    }
  `;
  try {
    const data = await blinkClient.request(mutation, { amount, currency });
    res.json((data as any).invoiceCreate);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: errMsg });
  }
});

// Endpoint for Blink callback to update payment status (for demo)
blinkRouter.post("/payment-status", async (req, res) => {
  const { sessionId, status } = req.body;
  if (!sessionId || !status) return res.status(400).json({ error: "Missing sessionId or status" });
  await redis.set(`paymentStatus:${sessionId}`, status, "EX", 3600); // expire in 1 hour
  res.json({ ok: true });
});

// Endpoint for frontend to poll payment status
blinkRouter.get("/payment-status/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const status = (await redis.get(`paymentStatus:${sessionId}`)) || "pending";
  res.json({ status });
});

// Route to display payment page for a given Blink payment session
blinkRouter.get("/payment/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const paymentUrl = `${BLINK_PAY_URL}/session/${sessionId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`;
  res.send(`
    <html>
      <head><title>Pay with Blink</title></head>
      <body>
        <h1>Pay with Blink</h1>
        <p>Order ID: <b>${sessionId}</b></p>
        <p>Scan the QR code or <a href="${paymentUrl}" target="_blank">click here</a> to pay.</p>
        <img src="${qrCodeUrl}" alt="Blink Payment QR" />
        <div id="status" style="margin-top:20px;font-weight:bold;">Waiting for payment...</div>
        <script>
          async function pollStatus() {
            const res = await fetch('/blink/payment-status/${sessionId}');
            const data = await res.json();
            if (data.status === 'paid') {
              document.getElementById('status').innerHTML = 'Payment received! Thank you.';
            } else if (data.status === 'failed') {
              document.getElementById('status').innerHTML = 'Payment failed. Please try again.';
            } else {
              setTimeout(pollStatus, 2000);
            }
          }
          pollStatus();
        </script>
        <p>After payment, your order will be confirmed automatically.</p>
      </body>
    </html>
  `);
});

// Next steps:
// - Connect invoice creation to Shopify checkout process.
// - Link payment confirmation to Shopify order status updates.
