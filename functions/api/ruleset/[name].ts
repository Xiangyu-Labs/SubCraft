import { RULE_SOURCES } from '@/shared/rules';
import { fetchRuleText, toSurgeRuleset } from '@/shared/generators/rules-fetcher';

/**
 * 代理 + 边缘缓存上游规则集。
 *
 * 订阅配置里的 rule-providers 指向这里而不是 jsDelivr：手机既然能下载到订阅，
 * 就一定能访问本站域名。而 mihomo 首次加载 rule-provider 失败会导致整份配置
 * 加载失败，不能把这一步押在第三方 CDN 的国内可达性上。
 */
export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const name = String(context.params.name ?? '');
  const upstream = RULE_SOURCES[name];

  if (!upstream) {
    return new Response('Unknown rule set', { status: 404 });
  }

  let text: string;
  try {
    text = await fetchRuleText(upstream);
  } catch (err) {
    console.error(`Failed to fetch rule set ${name}:`, err);
    return new Response('Upstream rule set unavailable', { status: 502 });
  }

  const body = url.searchParams.get('format') === 'surge'
    ? toSurgeRuleset(text)
    : text;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
