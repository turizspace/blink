import React from 'react';
import { reactExtension } from '@shopify/checkout-ui-extensions-react';
import {BlinkPaymentButton} from './BlinkPaymentButton';

reactExtension('Checkout::PaymentMethod::Render', () => {
  return <BlinkPaymentButton />;
});
