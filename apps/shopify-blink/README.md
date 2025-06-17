# Shopify Blink Payment App

This is a Node.js/TypeScript Shopify app that enables Shopify merchants to accept Bitcoin and Lightning payments directly into their Blink account using the Blink GraphQL API.

## Project Structure

```
apps/
  shopify-blink/
    README.md
    package.json
    tsconfig.json
    src/
      index.ts
      blink/
        client.ts
      shopify/
        auth.ts
        webhook.ts
      ui/
        SettingsPage.tsx
```

## Features
- Connect Shopify store to Blink account (via API key or OAuth)
- Add Bitcoin/Lightning as a payment method at checkout
- Generate invoices via Blink GraphQL API
- Webhook for payment confirmation
- Option to settle in Bitcoin or Stablesats
- Automatic deposit to merchant's Blink account

## Setup
1. Install dependencies: `pnpm install`
2. Configure Shopify and Blink credentials in environment variables or `.env`
3. Run the app: `pnpm dev`

## Usage
- Install the app in your Shopify store
- Connect your Blink account in the app settings
- Enable Bitcoin/Lightning payments

## License
MIT

## Next Steps

- Proceed with checkout integration to enable Bitcoin/Lightning payments at the Shopify checkout.
- Implement order status updates to reflect payment confirmations and settlements.
- Continue improving the UI for a better merchant and customer experience.
