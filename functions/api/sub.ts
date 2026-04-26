import yaml from 'js-yaml';
import { decodeSubscriptionData } from '@/shared/encoder';
import { parseVlessLink } from '@/shared/parsers/vless';
import { generateClashConfig } from '@/shared/generators/clash';
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

  const nodes: VlessNode[] = subscriptionData.links
    .map((link) => {
      try {
        return parseVlessLink(link);
      } catch (err) {
        console.error(`Failed to parse link: ${link}`, err);
        return null;
      }
    })
    .filter((n): n is VlessNode => n !== null);

  if (nodes.length === 0) {
    return Response.json(
      { error: 'No valid proxy links found' },
      { status: 400 },
    );
  }

  try {
    const clashConfig = await generateClashConfig(nodes, subscriptionData);
    const body = yaml.dump(clashConfig, { lineWidth: -1, noRefs: true });

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/yaml; charset=utf-8',
        'Content-Disposition': 'attachment; filename=clash.yaml',
        'Subscription-Userinfo': 'upload=0; download=0; total=0; expire=0',
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
