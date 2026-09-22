import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  fetchRuleText,
  parseRulePayload,
  toSurgeRuleset,
} from '@/shared/generators/rules-fetcher';

const PAYLOAD = [
  'payload:',
  "  - '+.suffix.com'",
  "  - '*.wildcard.com'",
  "  - '.dotted.com'",
  "  - 'exact.com'",
  '  - unquoted.com',
  '  # a comment',
  '',
].join('\n');

describe('parseRulePayload', () => {
  it('keeps suffix and exact matching apart', () => {
    expect(parseRulePayload(PAYLOAD)).toEqual([
      'DOMAIN-SUFFIX,suffix.com',
      'DOMAIN-SUFFIX,wildcard.com',
      'DOMAIN-SUFFIX,dotted.com',
      'DOMAIN,exact.com',
      'DOMAIN,unquoted.com',
    ]);
  });

  it('ignores anything before payload:', () => {
    expect(parseRulePayload('# header\n  - ignored.com\npayload:\n  - kept.com\n')).toEqual([
      'DOMAIN,kept.com',
    ]);
  });
});

describe('toSurgeRuleset', () => {
  it('emits one bare rule per line', () => {
    expect(toSurgeRuleset(PAYLOAD).split('\n')).toHaveLength(5);
    expect(toSurgeRuleset(PAYLOAD)).toContain('DOMAIN-SUFFIX,suffix.com');
  });
});

describe('fetchRuleText', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the upstream body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(PAYLOAD, { status: 200 })));
    await expect(fetchRuleText('https://up.test/proxy.txt')).resolves.toContain('payload:');
  });

  it('throws on a non-200 upstream', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 503 })));
    await expect(fetchRuleText('https://up.test/proxy.txt')).rejects.toThrow(/Failed to fetch/);
  });

  it('passes an abort signal so a hung upstream cannot pin the worker', async () => {
    const spy = vi.fn().mockResolvedValue(new Response(PAYLOAD, { status: 200 }));
    vi.stubGlobal('fetch', spy);
    await fetchRuleText('https://up.test/proxy.txt', { timeoutMs: 1234 });
    expect(spy.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});
