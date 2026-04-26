import pako from 'pako';
import type { SubscriptionData } from './types';

// 将 Uint8Array 转换为 base64url
function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  // 转换为 base64url 格式
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// 将 base64url 转换为 Uint8Array
function base64UrlToUint8Array(base64url: string): Uint8Array {
  // 转换回标准 base64
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // 补充 padding
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodeSubscriptionData(data: SubscriptionData): string {
  const json = JSON.stringify(data);
  const compressed = pako.gzip(json);
  const base64url = uint8ArrayToBase64Url(compressed);
  return base64url;
}

export function decodeSubscriptionData(encoded: string): SubscriptionData {
  try {
    const compressed = base64UrlToUint8Array(encoded);
    const json = pako.ungzip(compressed, { to: 'string' });
    return JSON.parse(json) as SubscriptionData;
  } catch {
    throw new Error('Invalid encoded data');
  }
}
