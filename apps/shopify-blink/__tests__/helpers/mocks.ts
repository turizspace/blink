import { jest } from '@jest/globals';
import crypto from 'crypto';

export const mockCryptoHmac = () => {
  const mockDigest = jest.fn().mockReturnValue('valid-signature');
  const mockUpdate = jest.fn().mockReturnThis();
  const mockHmac = { update: mockUpdate, digest: mockDigest };
  
  jest.spyOn(crypto, 'createHmac').mockImplementation(() => mockHmac as any);
  
  return { mockDigest, mockUpdate, mockHmac };
};

type AsyncFunction = (...args: any[]) => Promise<any>;

export const mockShopifyOrder = <T>(implementationOrValue: T | AsyncFunction) => {
  if (typeof implementationOrValue === 'function') {
    return jest.fn().mockImplementation(implementationOrValue as AsyncFunction);
  }
  return jest.fn().mockImplementation(() => Promise.resolve(implementationOrValue));
};
