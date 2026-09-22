export interface FetchRulesOptions {
  timeoutMs?: number;
}

/** 下载规则集原文（Clash rule-provider 的 payload YAML） */
export async function fetchRuleText(
  url: string,
  options: FetchRulesOptions = {},
): Promise<string> {
  const { timeoutMs = 8000 } = options;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    // Cloudflare 边缘缓存，避免每次订阅更新都回源
    cf: { cacheTtl: 86400, cacheEverything: true },
  } as RequestInit);

  if (!response.ok) {
    throw new Error(`Failed to fetch rules from ${url}: ${response.statusText}`);
  }
  return response.text();
}

/**
 * 把 payload YAML 解析成带匹配器前缀的规则片段。
 *
 * domain behavior 下，`+.a.com` / `*.a.com` / `.a.com` 是后缀匹配，
 * 而**无前缀的 `b.com` 是精确匹配**——一律当成 DOMAIN-SUFFIX 会过度放大规则。
 */
export function parseRulePayload(text: string): string[] {
  const out: string[] = [];
  let inPayload = false;

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === 'payload:') {
      inPayload = true;
      continue;
    }
    if (!inPayload || trimmed.startsWith('#') || !trimmed.startsWith('- ')) {
      continue;
    }

    const raw = trimmed.slice(2).replace(/^['"]|['"]$/g, '').trim();
    if (!raw) continue;

    if (raw.startsWith('+.')) out.push(`DOMAIN-SUFFIX,${raw.slice(2)}`);
    else if (raw.startsWith('*.')) out.push(`DOMAIN-SUFFIX,${raw.slice(2)}`);
    else if (raw.startsWith('.')) out.push(`DOMAIN-SUFFIX,${raw.slice(1)}`);
    else out.push(`DOMAIN,${raw}`);
  }

  return out;
}

/** Surge / Shadowrocket 的 rule-set 格式：每行一条裸规则，不带策略 */
export function toSurgeRuleset(text: string): string {
  return parseRulePayload(text).join('\n');
}
