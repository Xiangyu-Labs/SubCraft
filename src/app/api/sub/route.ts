import { NextRequest, NextResponse } from 'next/server';
import yaml from 'js-yaml';
import { decodeSubscriptionData } from '@/lib/encoder';
import { parseVlessLink } from '@/lib/parsers/vless';
import { generateClashConfig } from '@/lib/generators/clash';
import type { VlessNode } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const data = searchParams.get('data');

    if (!data) {
      return NextResponse.json(
        { error: 'Missing data parameter' },
        { status: 400 }
      );
    }

    const subscriptionData = decodeSubscriptionData(data);

    const nodes: VlessNode[] = subscriptionData.links.map(link => {
      try {
        return parseVlessLink(link);
      } catch (error) {
        console.error(`Failed to parse link: ${link}`, error);
        return null;
      }
    }).filter((node): node is VlessNode => node !== null);

    if (nodes.length === 0) {
      return NextResponse.json(
        { error: 'No valid proxy links found' },
        { status: 400 }
      );
    }

    const clashConfig = await generateClashConfig(nodes, subscriptionData);
    const yamlContent = yaml.dump(clashConfig, {
      lineWidth: -1,
      noRefs: true,
    });

    return new NextResponse(yamlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/yaml; charset=utf-8',
        'Content-Disposition': 'attachment; filename=clash.yaml',
        'Subscription-Userinfo': `upload=0; download=0; total=0; expire=0`,
      },
    });
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate subscription' },
      { status: 500 }
    );
  }
}
