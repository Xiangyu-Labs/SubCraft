import { describe, it, expect } from 'vitest';
import { parseVlessLink } from '@/shared/parsers/vless';

describe('vless parser', () => {
  it('should parse basic vless link', () => {
    const link = 'vless://uuid-123@example.com:443?encryption=none#TestNode';
    const node = parseVlessLink(link);
    expect(node.name).toBe('TestNode');
    expect(node.server).toBe('example.com');
    expect(node.port).toBe(443);
    expect(node.uuid).toBe('uuid-123');
  });

  it('should parse vless with tls', () => {
    const link = 'vless://uuid@host:443?security=tls&sni=example.com#Node';
    const node = parseVlessLink(link);
    expect(node.tls).toBe(true);
    expect(node.sni).toBe('example.com');
  });

  it('should parse vless with websocket', () => {
    const link = 'vless://uuid@host:443?type=ws&path=/path&host=ws.example.com#Node';
    const node = parseVlessLink(link);
    expect(node.network).toBe('ws');
    expect(node.wsPath).toBe('/path');
    expect(node.wsHost).toBe('ws.example.com');
  });

  it('should parse vless with reality', () => {
    const link =
      'vless://uuid@vps.example.com:54939?type=tcp&security=reality&pbk=abc123&fp=chrome&sni=apple.com&sid=short-id#RealityNode';
    const node = parseVlessLink(link);
    expect(node.tls).toBe(true);
    expect(node.sni).toBe('apple.com');
    expect(node.network).toBe('tcp');
    expect(node.fingerprint).toBe('chrome');
    expect(node.publicKey).toBe('abc123');
    expect(node.shortId).toBe('short-id');
  });

  it('should throw error for invalid link', () => {
    expect(() => parseVlessLink('invalid')).toThrow();
    expect(() => parseVlessLink('vmess://test')).toThrow();
  });
});
