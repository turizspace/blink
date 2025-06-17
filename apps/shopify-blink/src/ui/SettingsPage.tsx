import express from "express";
import fs from "fs";
import path from "path";

export const settingsPage = express.Router();

settingsPage.get("/", (req, res) => {
  const settingsPath = path.join(__dirname, "settings.json");
  let apiKey = "";
  let currency = "BTC";
  if (fs.existsSync(settingsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
      apiKey = data.apiKey || "";
      currency = data.currency || "BTC";
    } catch (err) {
      // Ignore error, use defaults
    }
  }
  res.send(`
    <html>
      <head><title>Blink Payment Settings</title></head>
      <body>
        <h1>Blink Payment Settings</h1>
        <p style="max-width:600px;">\n          This page allows you to connect your Shopify store to your Blink account.\n          Enter your Blink API Key and choose your preferred settlement currency.\n          Once configured, your store will be able to accept Bitcoin and Lightning payments\n          directly into your Blink account using the Blink GraphQL API.\n        </p>
        <form method="POST">
          <label>Blink API Key: <input type="text" name="apiKey" value="${apiKey}" /></label><br/>
          <label>Settlement Currency:
            <select name="currency">
              <option value="BTC"${currency === "BTC" ? " selected" : ""}>Bitcoin</option>
              <option value="USD"${currency === "USD" ? " selected" : ""}>Stablesats</option>
            </select>
          </label><br/>
          <button type="submit">Save</button>
        </form>
      </body>
    </html>
  `);
});

settingsPage.post("/", express.urlencoded({ extended: true }), (req, res) => {
  const { apiKey, currency } = req.body;
  const settingsPath = path.join(__dirname, "settings.json");
  try {
    fs.writeFileSync(settingsPath, JSON.stringify({ apiKey, currency }, null, 2));
    res.send(`
      <html>
        <head><title>Blink Payment Settings</title></head>
        <body>
          <h1>Blink Payment Settings</h1>
          <p>Settings saved!</p>
          <a href="/settings">Back</a>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(`
      <html>
        <head><title>Blink Payment Settings</title></head>
        <body>
          <h1>Blink Payment Settings</h1>
          <p style="color:red;">Failed to save settings: ${err}</p>
          <a href="/settings">Back</a>
        </body>
      </html>
    `);
  }
});

// Next steps:
// - Improve UI/UX for merchant onboarding and payment status display.
// - Add feedback for saving settings and error handling.
