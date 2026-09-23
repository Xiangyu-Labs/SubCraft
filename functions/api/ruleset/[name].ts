import { RULE_SOURCES } from '@/shared/rules';
import { fetchRuleText, toSurgeRuleset } from '@/shared/generators/rules-fetcher';

const MAX_AGE = 86400;

/** Cache API 只在 Workers 运行时存在（本地测试、部分预览环境没有） */
function edgeCache(): Cache | null {
  return typeof caches !== 'undefined' && 'default' in caches
    ? (caches as unknown as { default: Cache }).default
    : null;
}

/**
 * 代理 + 边缘缓存上游规则集。
 *
 * 订阅配置里的 rule-providers 指向这里而不是 jsDelivr：手机既然能下载到订阅，
 * 就一定能访问本站域名。而 mihomo 首次加载 rule-provider 失败会导致整份配置
 * 加载失败，不能把这一步押在第三方 CDN 的国内可达性上。
 *
 * 缓存的是**转换后**的结果：direct.txt 有数万行，每次请求都跑一遍
 * toSurgeRuleset 容易吃满 Workers 免费版 10ms 的 CPU 配额。
 */
export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const name = String(context.params.name ?? '');
  const upstream = RULE_SOURCES[name];

  if (!upstream) {
    return new Response('Unknown rule set', { status: 404 });
  }

  const format = url.searchParams.get('format') === 'surge' ? 'surge' : 'clash';
  // 缓存键只保留有意义的参数，避免 ?foo=bar 之类的请求把缓存打散
  const cacheKey = new Request(`${url.origin}${url.pathname}?format=${format}`);
  const cache = edgeCache();

  const hit = await cache?.match(cacheKey);
  if (hit) return hit;

  let text: string;
  try {
    text = await fetchRuleText(upstream);
  } catch (err) {
    console.error(`Failed to fetch rule set ${name}:`, err);
    return new Response('Upstream rule set unavailable', { status: 502 });
  }

  const response = new Response(format === 'surge' ? toSurgeRuleset(text) : text, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': `public, max-age=${MAX_AGE}`,
    },
  });

  if (cache) {
    const put = cache.put(cacheKey, response.clone());
    if (typeof context.waitUntil === 'function') {
      context.waitUntil(put);
    } else {
      await put;
    }
  }
  return response;
};
