import pako from 'pako';
import type { SubscriptionData } from './types';

export function encodeSubscriptionData(data: SubscriptionData): string {
  const json = JSON.stringify(data);
  const compressed = pako.gzip(json);
  const base64 = Buffer.from(compressed).toString('base64url');
  return base64;
}

export function decodeSubscriptionData(encoded: string): SubscriptionData {
  try {
    const compressed = Buffer.from(encoded, 'base64url');
    const json = pako.ungzip(compressed, { to: 'string' });
    return JSON.parse(json) as SubscriptionData;
  } catch (error) {
    throw new Error('Invalid encoded data');
  }
}
