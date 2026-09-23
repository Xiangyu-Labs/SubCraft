import yaml from 'js-yaml';
import type { ClientType, ProxyNode, SubscriptionData } from '@/shared/types';
import { parseLinkList } from '@/shared/parsers';
import { generateClashConfig } from '@/shared/generators/clash';
import { generateShadowrocketConfig } from '@/shared/generators/shadowrocket';
import { dedupeNodeNames } from '@/shared/nodes';
import { utf8ToBase64 } from '@/shared/base64';
import { fetchUpstream, formatUserinfo, mergeUserinfo, type Userinfo } from './upstream';

export const DEFAULT_PROFILE_NAME = 'SubCraft';

/**
 * 优先级：?client= 显式指定 > User-Agent。
 * Shadowrocket 的 UA 形如 `Shadowrocket/2070 CFNetwork/...`；其余一律按 Clash
 * （mihomo / CMFA / Clash Verge / Stash 都吃 Clash YAML）。
 */
export function resolveClient(request: Request): ClientType {
  const param = new URL(request.url).searchParams.get('client');
  if (param === 'clash' || param === 'shadowrocket') return param;
  const ua = request.headers.get('user-agent') || '';
  return /shadowrocket/i.test(ua) ? 'shadowrocket' : 'clash';
}

function resolveUserinfo(upstream: Userinfo[], data: SubscriptionData): Userinfo | null {
  const merged = mergeUserinfo(upstream);
  if (merged) return merged;
  const manual = data.userinfo;
  if (manual && (manual.total || manual.expire)) {
    return { upload: 0, download: 0, total: manual.total ?? 0, expire: manual.expire ?? 0 };
  }
  // 没有任何数据源时不发这个头：写全 0 会被部分客户端显示成「0 B / 0 B」
  return null;
}

function errorResponse(status: number, error: string, details?: string[]) {
  return Response.json(details?.length ? { error, details } : { error }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function renderSubscription(
  request: Request,
  data: SubscriptionData,
): Promise<Response> {
  const url = new URL(request.url);

  const local = parseLinkList(data.links.join('\n'), { allowUpstreams: false });
  if (local.errors.length) {
    // 只记行号和原因：链接本身带凭据，不能进日志
    console.warn(`Skipped ${local.errors.length} invalid link(s):`, local.errors);
  }

  const upstreams = await Promise.all(
    (data.upstreams ?? []).map((u) => fetchUpstream(u, { selfHost: url.host })),
  );
  const upstreamErrors = upstreams
    .map((r, i) => (r.error ? `上游 #${i + 1}：${r.error}` : ''))
    .filter(Boolean);
  if (upstreamErrors.length) {
    console.warn('Upstream errors:', upstreamErrors);
  }

  const collected: ProxyNode[] = [...local.nodes, ...upstreams.flatMap((r) => r.nodes)];
  if (collected.length === 0) {
    return upstreamErrors.length
      ? errorResponse(502, 'No nodes available from upstreams', upstreamErrors)
      : errorResponse(400, 'No valid proxy links found');
  }

  // 重名会让 Clash 拒绝加载整份配置，两个客户端都要先过这一步
  const nodes = dedupeNodeNames(collected);
  const client = resolveClient(request);
  const name = data.name?.trim() || DEFAULT_PROFILE_NAME;
  const ext = client === 'shadowrocket' ? 'conf' : 'yaml';

  const headers: Record<string, string> = {
    // 响应里有节点凭据，也要让流量信息保持实时
    'Cache-Control': 'private, no-store',
    // CMFA 读这个头决定自动更新周期（小时）；有上游时刷新勤一些，流量显示才跟得上
    'Profile-Update-Interval': data.upstreams?.length ? '6' : '24',
    'Profile-Title': `base64:${utf8ToBase64(name)}`,
    'Profile-Web-Page-Url': url.origin,
    'Content-Disposition': `attachment; filename="subcraft.${ext}"; filename*=UTF-8''${encodeURIComponent(name)}.${ext}`,
  };
  const userinfo = resolveUserinfo(
    upstreams.map((r) => r.userinfo).filter((u): u is Userinfo => u !== null),
    data,
  );
  if (userinfo) {
    headers['Subscription-Userinfo'] = formatUserinfo(userinfo);
  }

  try {
    if (client === 'shadowrocket') {
      const body = generateShadowrocketConfig(nodes, data, url.origin);
      return new Response(body, {
        status: 200,
        headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const body = yaml.dump(generateClashConfig(nodes, data, url.origin), {
      lineWidth: -1,
      noRefs: true,
    });
    return new Response(body, {
      status: 200,
      headers: { ...headers, 'Content-Type': 'text/yaml; charset=utf-8' },
    });
  } catch (err) {
    console.error('Subscription generation error:', err instanceof Error ? err.message : err);
    return errorResponse(500, 'Failed to generate subscription');
  }
}
