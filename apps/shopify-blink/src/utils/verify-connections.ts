import { GraphQLClient, gql } from "graphql-request";
import Shopify from "@shopify/shopify-api";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

async function verifyBlinkAPI() {
  const client = new GraphQLClient(process.env.BLINK_GRAPHQL_ENDPOINT!, {
    headers: { Authorization: `Bearer ${process.env.BLINK_API_KEY}` },
  });
  
  const query = gql`
    query VerifyConnection {
      viewer {
        id
      }
    }
  `;
  
  try {
    await client.request(query);
    console.log("✅ Blink API connection successful");
    return true;
  } catch (error) {
    console.error("❌ Blink API connection failed:", error);
    return false;
  }
}

async function verifyShopifyAPI() {
  try {
    const client = new Shopify.Clients.Rest(
      process.env.SHOPIFY_APP_URL!,
      process.env.SHOPIFY_API_SECRET!
    );
    await client.get({ path: 'shop' });
    console.log("✅ Shopify API connection successful");
    return true;
  } catch (error) {
    console.error("❌ Shopify API connection failed:", error);
    return false;
  }
}

async function verifyRedis() {
  const redis = new Redis(process.env.REDIS_URL!);
  try {
    await redis.ping();
    console.log("✅ Redis connection successful");
    redis.disconnect();
    return true;
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
    return false;
  }
}

async function verifyAll() {
  console.log("🔍 Verifying all connections...");
  const results = await Promise.all([
    verifyBlinkAPI(),
    verifyShopifyAPI(),
    verifyRedis()
  ]);
  
  const allSuccess = results.every(result => result === true);
  
  if (allSuccess) {
    console.log("✨ All connections verified successfully!");
    process.exit(0);
  } else {
    console.error("⚠️  Some connections failed verification");
    process.exit(1);
  }
}

verifyAll();
