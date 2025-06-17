import express from "express";
import dotenv from "dotenv";
import { shopifyAuth } from "./shopify/auth";
import { blinkRouter } from "./blink/client";
import { settingsPage } from "./ui/SettingsPage";

dotenv.config();

const app = express();
app.use(express.json());

// Shopify authentication
app.use("/auth", shopifyAuth);

// Blink API integration
app.use("/blink", blinkRouter);

// Merchant settings UI (for embedded app)
app.use("/settings", settingsPage);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Shopify Blink app listening on port ${PORT}`);
});
