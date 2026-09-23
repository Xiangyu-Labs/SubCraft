// 浏览器与 Workers 都有 atob/btoa，但它们只处理 Latin-1，UTF-8 要自己转

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** 同时接受标准 base64 与 base64url，缺失的 padding 自动补齐 */
export function base64ToBytes(input: string): Uint8Array {
  let base64 = input.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
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

export function base64ToUtf8(input: string): string {
  return new TextDecoder().decode(base64ToBytes(input));
}

export function utf8ToBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
