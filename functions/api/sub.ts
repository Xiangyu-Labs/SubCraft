import yaml from 'js-yaml';
import { decodeSubscriptionData } from '@/shared/encoder';
import { parseVlessLink } from '@/shared/parsers/vless';
import { generateClashConfig } from '@/shared/generators/clash';
import { generateShadowrocketConfig } from '@/shared/generators/shadowrocket';
import { dedupeNodeNames } from '@/shared/nodes';
import type { VlessNode } from '@/shared/types';

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const data = url.searchParams.get('data');

  if (!data) {
    return Response.json({ error: 'Missing data parameter' }, { status: 400 });
  }

  if (data.length > 65536) {
    return Response.json({ error: 'Data too large' }, { status: 400 });
  }

  let subscriptionData;
  try {
    subscriptionData = decodeSubscriptionData(data);
  } catch {
    return Response.json({ error: 'Invalid encoded data' }, { status: 400 });
  }

  if (
    !Array.isArray(subscriptionData.links) ||
    typeof subscriptionData.template !== 'string' ||
    typeof subscriptionData.client !== 'string'
  ) {
    return Response.json(
      { error: 'Invalid subscription data structure' },
      { status: 400 },
    );
  }

  const parsed: VlessNode[] = subscriptionData.links
    .map((link) => {
      try {
        return parseVlessLink(link);
      } catch (err) {
        console.error(`Failed to parse link: ${link}`, err);
        return null;
      }
    })
    .filter((n): n is VlessNode => n !== null);

  if (parsed.length === 0) {
    return Response.json(
      { error: 'No valid proxy links found' },
      { status: 400 },
    );
  }

  // 重名会让 Clash 拒绝加载整份配置，两个客户端都要先过这一步
  const nodes = dedupeNodeNames(parsed);

  const commonHeaders = {
    'Cache-Control': 'public, max-age=3600',
    // CMFA 读这个头决定自动更新周期（小时）
    'Profile-Update-Interval': '24',
    'Subscription-Userinfo': 'upload=0; download=0; total=0; expire=0',
  };

  try {
    if (subscriptionData.client === 'shadowrocket') {
      const config = generateShadowrocketConfig(
        nodes,
        subscriptionData,
        url.origin,
      );
      return new Response(config, {
        status: 200,
        headers: {
          ...commonHeaders,
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': 'attachment; filename=shadowrocket.conf',
        },
      });
    }

    // default: clash
    const clashConfig = generateClashConfig(nodes, subscriptionData, url.origin);
    const body = yaml.dump(clashConfig, { lineWidth: -1, noRefs: true });

    return new Response(body, {
      status: 200,
      headers: {
        ...commonHeaders,
        'Content-Type': 'text/yaml; charset=utf-8',
        'Content-Disposition': 'attachment; filename=clash.yaml',
      },
    });
  } catch (err) {
    console.error('Subscription API error:', err);
    return Response.json(
      { error: 'Failed to generate subscription' },
      { status: 500 },
    );
  }
};
