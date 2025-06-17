import React, { useState } from 'react';
import {
  BlockStack,
  Button,
  Text,
  TextField,
  useTranslate,
  useAppMetafields,
} from '@shopify/checkout-ui-extensions-react';

export function BlinkPaymentButton() {
  const translate = useTranslate();
  const [txId, setTxId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appMetafields = useAppMetafields();

  const getMetafieldValue = (key: string) => {
    const metafield = appMetafields.find(m => String(m.metafield) === key);
    return metafield?.toString() || '';
  };

  const handleSubmit = async () => {
    if (!txId) {
      setError(translate('error_missing_txid'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Submit payment to the Blink API through our backend
      const response = await fetch('/api/blink/payment/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: txId,
          amount: getMetafieldValue('blink.orderAmount') || '0',
          currency: getMetafieldValue('blink.currency') || 'USD',
          shop: getMetafieldValue('blink.shop'),
          settlementCurrency: getMetafieldValue('blink.settlementCurrency') || 'BTC',
        }),
      });
      
      if (!response.ok) {
        throw new Error(translate('error_message'));
      }

      const data = await response.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(translate('error_no_redirect'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BlockStack spacing="tight">
      {error && (
        <Text appearance="critical">
          {error}
        </Text>
      )}
      <TextField
        label={translate('transaction_id')}
        value={txId}
        onChange={setTxId}
        disabled={isLoading}
      />
      <Button
        onPress={handleSubmit}
        loading={isLoading}
      >
        {translate('pay_with_bitcoin')}
      </Button>
    </BlockStack>
  );
}
