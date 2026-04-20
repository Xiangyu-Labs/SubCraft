import { describe, it, expect } from 'vitest';
import { encodeSubscriptionData, decodeSubscriptionData } from '@/lib/encoder';
import type { SubscriptionData } from '@/lib/types';

describe('encoder', () => {
  const testData: SubscriptionData = {
    links: ['vless://test@example.com:443?encryption=none#TestNode'],
    template: 'balanced',
    client: 'clash',
  };

  it('should encode and decode data correctly', () => {
    const encoded = encodeSubscriptionData(testData);
    expect(encoded).toBeTruthy();
    expect(typeof encoded).toBe('string');

    const decoded = decodeSubscriptionData(encoded);
    expect(decoded).toEqual(testData);
  });

  it('should handle multiple links', () => {
    const data: SubscriptionData = {
      links: ['vless://1@host1:443#Node1', 'vless://2@host2:443#Node2'],
      template: 'minimal',
      client: 'clash',
    };
    const encoded = encodeSubscriptionData(data);
    const decoded = decodeSubscriptionData(encoded);
    expect(decoded.links).toHaveLength(2);
  });

  it('should throw error for invalid encoded data', () => {
    expect(() => decodeSubscriptionData('invalid')).toThrow();
  });
});
