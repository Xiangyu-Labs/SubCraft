# Multi-Client Subscription Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Shadowrocket config generation, refactor rules to blacklist/whitelist with AdGuard variants, support client-type selection, and simplify the UI.

**Architecture:** Keep the existing `src/shared/` pattern. Add a new `shadowrocket` generator alongside `clash`. The API routes to the correct generator based on `client` field. Rules are simplified to 4 templates backed by Loyalsoldier/clash-rules. The frontend adds a client selector and trims advanced settings to essentials.

**Tech Stack:** Vite 5 + React 19 + TypeScript + Cloudflare Pages Functions + js-yaml + pako + Vitest

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/shared/types.ts` | Shared types: `ClientType`, `RuleTemplate`, `VlessNode`, `ClashConfig`, `ShadowrocketConfig`, etc. |
| `src/shared/rules.ts` | Rule template definitions (4 templates) + external rule URLs |
| `src/shared/parsers/vless.ts` | Parse VLESS links into `VlessNode` |
| `src/shared/generators/clash.ts` | Generate Clash YAML from `VlessNode[]` + `SubscriptionData` |
| `src/shared/generators/shadowrocket.ts` | Generate Shadowrocket `.conf` from `VlessNode[]` + `SubscriptionData` |
| `functions/api/sub.ts` | API entrypoint: decode data, parse links, route to generator by client type |
| `src/components/SubscriptionForm.tsx` | Frontend form: links input, client selector, rule template selector, simplified advanced settings |
| `src/shared/encoder.ts` | Encode/decode `SubscriptionData` to base64url+gzip |

---

## Task 1: Refactor Rule Templates to Blacklist/Whitelist with AdGuard

**Files:**
- Modify: `src/shared/types.ts:5`
- Modify: `src/shared/rules.ts`
- Modify: `tests/shared/generators/clash.test.ts:18-23, 35-40, 47-57, 64-84, 86-108` (update template IDs)
- Modify: `tests/functions/api/sub.test.ts:33-42, 44-59, 61-78` (update template IDs)

**Context:** Current templates (`minimal`, `balanced`, `global`, `pure`) are being replaced with 4 clearer templates. `balanced` and `global` relied on `direct.txt` and `proxy.txt` which are large lists; the new approach uses `proxy.txt` (blacklist) or `direct.txt` (whitelist) plus optional `reject.txt` for AdGuard. The `pure` template stays conceptually but is removed as a user-facing option (users can pick "global" proxy mode in advanced settings instead).

- [ ] **Step 1: Update `RuleTemplate` type**

```typescript
// src/shared/types.ts line 5
export type RuleTemplate = 'blacklist' | 'blacklist-adguard' | 'whitelist' | 'whitelist-adguard';
```

- [ ] **Step 2: Replace rule template definitions**

```typescript
// src/shared/rules.ts — replace entire file content
export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  ruleUrls?: Record<string, string>;
  rules: string[];
}

export const ruleTemplates: Record<string, RuleTemplate> = {
  blacklist: {
    id: 'blacklist',
    name: '黑名单模式',
    description: '仅代理被墙网站，其余直连',
    ruleUrls: {
      proxy: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt',
    },
    rules: [
      'RULE-SET,proxy,PROXY',
      'GEOIP,CN,DIRECT',
      'MATCH,PROXY',
    ],
  },

  'blacklist-adguard': {
    id: 'blacklist-adguard',
    name: '黑名单 + AdGuard',
    description: '仅代理被墙网站 + 广告拦截',
    ruleUrls: {
      reject: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt',
      proxy: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt',
    },
    rules: [
      'RULE-SET,reject,REJECT',
      'RULE-SET,proxy,PROXY',
      'GEOIP,CN,DIRECT',
      'MATCH,PROXY',
    ],
  },

  whitelist: {
    id: 'whitelist',
    name: '白名单模式',
    description: '仅直连国内网站，其余代理',
    ruleUrls: {
      direct: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt',
    },
    rules: [
      'RULE-SET,direct,DIRECT',
      'GEOIP,CN,DIRECT',
      'MATCH,PROXY',
    ],
  },

  'whitelist-adguard': {
    id: 'whitelist-adguard',
    name: '白名单 + AdGuard',
    description: '仅直连国内网站 + 广告拦截',
    ruleUrls: {
      reject: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt',
      direct: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt',
    },
    rules: [
      'RULE-SET,reject,REJECT',
      'RULE-SET,direct,DIRECT',
      'GEOIP,CN,DIRECT',
      'MATCH,PROXY',
    ],
  },
};
```

- [ ] **Step 3: Update Clash generator tests with new template IDs**

In `tests/shared/generators/clash.test.ts`, replace all occurrences of `'minimal'` with `'blacklist'`, `'balanced'` with `'blacklist-adguard'`, `'global'` with `'whitelist'`.

Specific replacements:
- Line ~21: `template: 'minimal'` → `template: 'blacklist'`
- Line ~36: `template: 'balanced'` → `template: 'blacklist-adguard'`
- Line ~54: `template: 'global'` → `template: 'whitelist'`
- Line ~68: `template: 'minimal'` → `template: 'blacklist'`
- Line ~87: `template: 'minimal'` → `template: 'blacklist'`

- [ ] **Step 4: Update API tests with new template IDs**

In `tests/functions/api/sub.test.ts`:
- Line ~35: `template: 'pure'` → `template: 'blacklist'`
- Line ~48: `template: 'pure'` → `template: 'blacklist'`
- Line ~68: `template: 'pure'` → `template: 'blacklist'`

- [ ] **Step 5: Run tests to verify refactor**

Run: `npx vitest run --reporter=verbose`
Expected: All tests pass (may need adjustments if tests assert specific rule counts from old templates)

- [ ] **Step 6: Commit**

```bash
git add src/shared/rules.ts src/shared/types.ts tests/
git commit -m "refactor: replace rule templates with blacklist/whitelist + AdGuard variants"
```

---

## Task 2: Add Shadowrocket Config Generator

**Files:**
- Create: `src/shared/generators/shadowrocket.ts`
- Create: `tests/shared/generators/shadowrocket.test.ts`
- Modify: `src/shared/types.ts` (add Shadowrocket types)

**Context:** Shadowrocket uses `.conf` format (Surge-like). Sections are `[General]`, `[Proxy]`, `[Proxy Group]`, `[Rule]`. VLESS node format: `Name = vless, Server, Port, uuid=UUID, tls=true, servername=SNI`. Rules use the same syntax as Clash (`DOMAIN-SUFFIX,domain,Action`). Reality fields (`client-fingerprint`, `reality-opts`) are output if present; Shadowrocket may ignore unsupported fields gracefully.

- [ ] **Step 1: Write failing test for Shadowrocket generator**

```typescript
// tests/shared/generators/shadowrocket.test.ts
import { describe, it, expect } from 'vitest';
import { generateShadowrocketConfig } from '@/shared/generators/shadowrocket';
import type { VlessNode, SubscriptionData } from '@/shared/types';

describe('shadowrocket generator', () => {
  const testNodes: VlessNode[] = [
    {
      name: 'Node1',
      server: 'example.com',
      port: 443,
      uuid: 'uuid-123',
      tls: true,
      network: 'ws',
      wsPath: '/path',
    },
  ];

  it('should generate basic shadowrocket config', async () => {
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'shadowrocket',
    };
    const config = await generateShadowrocketConfig(testNodes, subscriptionData);

    expect(config).toContain('[General]');
    expect(config).toContain('[Proxy]');
    expect(config).toContain('[Proxy Group]');
    expect(config).toContain('[Rule]');
    expect(config).toContain('Node1 = vless');
    expect(config).toContain('PROXY = select');
  });

  it('should include vless with tls', async () => {
    const nodes: VlessNode[] = [
      { name: 'TlsNode', server: 'host.com', port: 443, uuid: 'uuid-tls', tls: true, sni: 'sni.com' },
    ];
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'shadowrocket',
    };
    const config = await generateShadowrocketConfig(nodes, subscriptionData);

    expect(config).toContain('TlsNode = vless, host.com, 443, uuid=uuid-tls, tls=true, servername=sni.com');
  });

  it('should include vless with reality', async () => {
    const nodes: VlessNode[] = [
      {
        name: 'RealityNode',
        server: 'vps.com',
        port: 54939,
        uuid: 'uuid-r',
        network: 'tcp',
        tls: true,
        sni: 'apple.com',
        fingerprint: 'chrome',
        publicKey: 'pk123',
        shortId: 'sid456',
      },
    ];
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'shadowrocket',
    };
    const config = await generateShadowrocketConfig(nodes, subscriptionData);

    expect(config).toContain('RealityNode = vless, vps.com, 54939, uuid=uuid-r, tls=true, servername=apple.com');
    expect(config).toContain('client-fingerprint=chrome');
  });

  it('should include ws opts', async () => {
    const nodes: VlessNode[] = [
      {
        name: 'WsNode',
        server: 'ws.com',
        port: 443,
        uuid: 'uuid-ws',
        network: 'ws',
        wsPath: '/ws',
        wsHost: 'ws.host.com',
      },
    ];
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'shadowrocket',
    };
    const config = await generateShadowrocketConfig(nodes, subscriptionData);

    expect(config).toContain('ws=true');
    expect(config).toContain('ws-path=/ws');
    expect(config).toContain('ws-headers=ws.host.com');
  });

  it('should include grpc opts', async () => {
    const nodes: VlessNode[] = [
      {
        name: 'GrpcNode',
        server: 'grpc.com',
        port: 443,
        uuid: 'uuid-g',
        network: 'grpc',
        serviceName: 'MyService',
      },
    ];
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'shadowrocket',
    };
    const config = await generateShadowrocketConfig(nodes, subscriptionData);

    expect(config).toContain('GrpcNode = vless, grpc.com, 443, uuid=uuid-g');
  });
});
```

Run: `npx vitest run tests/shared/generators/shadowrocket.test.ts`
Expected: FAIL — `generateShadowrocketConfig` not found

- [ ] **Step 2: Add Shadowrocket types to `src/shared/types.ts`**

Add after the `ClashConfig` interface (before EOF):

```typescript
// Shadowrocket 代理节点
export interface ShadowrocketProxy {
  name: string;
  type: string;
  server: string;
  port: number;
  uuid: string;
  tls?: boolean;
  'skip-cert-verify'?: boolean;
  servername?: string;
  'client-fingerprint'?: string;
  network?: string;
  'ws-path'?: string;
  'ws-headers'?: string;
  'reality-opts'?: string; // formatted string for .conf
}

// Shadowrocket 配置（输出为纯文本 .conf）
export type ShadowrocketConfig = string;
```

- [ ] **Step 3: Implement Shadowrocket generator**

```typescript
// src/shared/generators/shadowrocket.ts
import type { VlessNode, SubscriptionData, ShadowrocketConfig } from '../types';
import { ruleTemplates } from '../rules';

// 下载并解析规则文件（复用 clash.ts 的逻辑）
async function fetchRules(url: string): Promise<string[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch rules from ${url}: ${response.statusText}`);
  }

  const text = await response.text();
  const lines = text.split('\n');
  const rules: string[] = [];
  let inPayload = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'payload:') {
      inPayload = true;
      continue;
    }
    if (inPayload && trimmed.startsWith('- ')) {
      let domain = trimmed.slice(2).replace(/^['"]|['"]$/g, '');
      domain = domain.replace(/^\+\./, '');
      rules.push(domain);
    }
  }

  return rules;
}

function vlessToShadowrocketProxy(node: VlessNode): string {
  const parts: string[] = [
    node.name,
    '=',
    'vless,',
    node.server + ',',
    String(node.port) + ',',
    'uuid=' + node.uuid,
  ];

  if (node.tls) {
    parts.push(', tls=true');
    if (node.allowInsecure) {
      parts.push(', skip-cert-verify=true');
    }
    if (node.sni) {
      parts.push(', servername=' + node.sni);
    }
  }

  if (node.fingerprint) {
    parts.push(', client-fingerprint=' + node.fingerprint);
  }

  if (node.network === 'ws') {
    parts.push(', ws=true');
    if (node.wsPath) {
      parts.push(', ws-path=' + node.wsPath);
    }
    if (node.wsHost) {
      parts.push(', ws-headers=' + node.wsHost);
    }
  }

  if (node.network === 'grpc' && node.serviceName) {
    parts.push(', grpc=true, grpc-service-name=' + node.serviceName);
  }

  return parts.join('');
}

export async function generateShadowrocketConfig(
  nodes: VlessNode[],
  subscriptionData: SubscriptionData,
): Promise<ShadowrocketConfig> {
  const template = ruleTemplates[subscriptionData.template];
  if (!template) {
    throw new Error(`Unknown rule template: ${subscriptionData.template}`);
  }

  // [General]
  const lines: string[] = [
    '[General]',
    'bypass-system = true',
    'skip-proxy = 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, localhost, *.local, captive.apple.com',
    'dns-server = 223.5.5.5, 119.29.29.29',
    '',
  ];

  // [Proxy]
  lines.push('[Proxy]');
  for (const node of nodes) {
    lines.push(vlessToShadowrocketProxy(node));
  }
  lines.push('');

  // [Proxy Group]
  const proxyNames = nodes.map((n) => n.name);
  lines.push('[Proxy Group]');
  lines.push('PROXY = select, ' + proxyNames.join(', '));
  lines.push('');

  // [Rule]
  lines.push('[Rule]');

  for (const rule of template.rules) {
    if (rule.startsWith('RULE-SET,')) {
      const parts = rule.split(',');
      const ruleSetName = parts[1];
      const action = parts[2];

      if (template.ruleUrls && template.ruleUrls[ruleSetName]) {
        try {
          const domains = await fetchRules(template.ruleUrls[ruleSetName]);
          for (const domain of domains) {
            lines.push('DOMAIN-SUFFIX,' + domain + ',' + action);
          }
        } catch (error) {
          console.error(`Failed to fetch rule set ${ruleSetName}:`, error);
          lines.push(rule);
        }
      } else {
        lines.push(rule);
      }
    } else if (rule === 'GEOIP,CN,DIRECT') {
      lines.push('GEOIP,CN,DIRECT');
    } else if (rule === 'MATCH,PROXY') {
      lines.push('FINAL,PROXY');
    } else if (rule === 'MATCH,DIRECT') {
      lines.push('FINAL,DIRECT');
    } else {
      lines.push(rule);
    }
  }

  return lines.join('\n');
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/shared/generators/shadowrocket.test.ts`
Expected: All 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/shared/generators/shadowrocket.ts tests/shared/generators/shadowrocket.test.ts src/shared/types.ts
git commit -m "feat: add Shadowrocket config generator"
```

---

## Task 3: Extend ClientType and Wire Multi-Client API

**Files:**
- Modify: `src/shared/types.ts:8`
- Modify: `functions/api/sub.ts`
- Modify: `tests/functions/api/sub.test.ts`

**Context:** The `client` field currently only accepts `'clash'`. We need to accept `'shadowrocket'` too, and route to the correct generator. The API response Content-Type and filename should also adapt.

- [ ] **Step 1: Update `ClientType`**

```typescript
// src/shared/types.ts line 8
export type ClientType = 'clash' | 'shadowrocket';
```

- [ ] **Step 2: Update API to route by client type**

Replace the generator import and response block in `functions/api/sub.ts`:

```typescript
// functions/api/sub.ts — replace the entire file
import yaml from 'js-yaml';
import { decodeSubscriptionData } from '@/shared/encoder';
import { parseVlessLink } from '@/shared/parsers/vless';
import { generateClashConfig } from '@/shared/generators/clash';
import { generateShadowrocketConfig } from '@/shared/generators/shadowrocket';
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
    if (subscriptionData.client === 'shadowrocket') {
      const config = await generateShadowrocketConfig(nodes, subscriptionData);
      return new Response(config, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': 'attachment; filename=shadowrocket.conf',
          'Subscription-Userinfo': 'upload=0; download=0; total=0; expire=0',
        },
      });
    }

    // default: clash
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
```

- [ ] **Step 3: Add Shadowrocket API test**

Add to `tests/functions/api/sub.test.ts` after the existing tests (before the closing `});`):

```typescript
  it('returns shadowrocket conf with 200 for shadowrocket client', async () => {
    const data: SubscriptionData = {
      links: ['vless://uuid@example.com:443?encryption=none#TestNode'],
      template: 'blacklist',
      client: 'shadowrocket',
    };
    const encoded = encodeSubscriptionData(data);
    const res = await onRequestGet(
      makeContext(`https://app.test/api/sub?data=${encoded}`),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toMatch(/text\/plain/);
    const body = await res.text();
    expect(body).toContain('[General]');
    expect(body).toContain('TestNode');
  });
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run --reporter=verbose`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add functions/api/sub.ts tests/functions/api/sub.test.ts src/shared/types.ts
git commit -m "feat: wire multi-client API routing for clash and shadowrocket"
```

---

## Task 4: Simplify Frontend Form with Client Selector

**Files:**
- Modify: `src/components/SubscriptionForm.tsx`

**Context:** The current form has a dense advanced settings panel (port, allowLan, mode, DNS toggle, fake-ip filter, nameserver, fallback). We simplify to: links input, client type selector, rule template selector, and a compact advanced panel with just port and mode. DNS is always enabled with sensible defaults. The `client` field is now selectable and encoded into the subscription data.

- [ ] **Step 1: Rewrite SubscriptionForm.tsx**

```tsx
// src/components/SubscriptionForm.tsx
import { useState } from 'react';
import { encodeSubscriptionData } from '@/shared/encoder';
import { ruleTemplates } from '@/shared/rules';
import type { RuleTemplate, ClientType } from '@/shared/types';

export function SubscriptionForm() {
  const [links, setLinks] = useState('');
  const [template, setTemplate] = useState<RuleTemplate>('blacklist');
  const [client, setClient] = useState<ClientType>('clash');
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mixedPort, setMixedPort] = useState(7890);
  const [mode, setMode] = useState<'rule' | 'global' | 'direct'>('rule');

  const handleGenerate = () => {
    try {
      setError('');

      const linkArray = links
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((l) => l.replace(/@(https?:\/\/)/, '@'));

      if (linkArray.length === 0) {
        setError('请至少输入一个代理链接');
        return;
      }

      const encoded = encodeSubscriptionData({
        links: linkArray,
        template,
        client,
        baseConfig: {
          mixedPort,
          allowLan: false,
          mode,
          logLevel: 'info',
          ipv6: false,
        },
        dnsOptions: {
          enable: true,
          ipv6: false,
          enhancedMode: 'fake-ip',
          fakeIpRange: '198.18.0.1/16',
          fakeIpFilter: ['*.lan', '*.local', '*.localhost'],
          nameserver: ['119.29.29.29', '223.5.5.5'],
          fallback: ['tls://1.1.1.1:853', 'tls://8.8.8.8:853', 'https://1.1.1.1/dns-query', 'https://8.8.8.8/dns-query'],
        },
      });

      let baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = 'https://' + baseUrl;
      }
      const url = `${baseUrl}/api/sub?data=${encoded}`;
      setSubscriptionUrl(url);
    } catch (err) {
      console.error('生成失败:', err);
      setError('生成订阅链接失败');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(subscriptionUrl);
      alert('已复制到剪贴板');
    } catch (err) {
      alert('复制失败，请手动复制');
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">代理链接（每行一个）</label>
        <textarea
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          placeholder="vless://uuid@example.com:443?encryption=none#节点名称"
          className="w-full h-32 px-3 py-2 rounded-md border resize-none font-mono text-sm"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">客户端</label>
          <select
            value={client}
            onChange={(e) => setClient(e.target.value as ClientType)}
            className="w-full px-3 py-2 rounded-md border"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            <option value="clash">Clash</option>
            <option value="shadowrocket">Shadowrocket</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">规则模板</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as RuleTemplate)}
            className="w-full px-3 py-2 rounded-md border"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            {Object.values(ruleTemplates).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        {showAdvanced ? '隐藏' : '显示'}高级配置
      </button>

      {showAdvanced && (
        <div className="space-y-4 p-4 rounded-md border" style={{ borderColor: 'var(--border)' }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">代理端口</label>
              <input
                type="number"
                value={mixedPort}
                onChange={(e) => setMixedPort(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md border"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">代理模式</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'rule' | 'global' | 'direct')}
                className="w-full px-3 py-2 rounded-md border"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <option value="rule">规则模式</option>
                <option value="global">全局代理</option>
                <option value="direct">直连模式</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        className="w-full h-10 rounded-md font-medium text-white transition-all active:scale-[0.99]"
        style={{ background: 'var(--primary)' }}
      >
        生成订阅链接
      </button>

      {subscriptionUrl && (
        <div className="space-y-2">
          <label className="text-sm font-medium">订阅链接</label>
          <div className="flex gap-2">
            <input
              value={subscriptionUrl}
              readOnly
              className="flex-1 px-3 py-2 rounded-md border font-mono text-sm"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-md border font-medium transition-all active:scale-[0.99]"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            >
              复制
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            将链接添加到 {client === 'clash' ? 'Clash' : 'Shadowrocket'} 客户端即可使用
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run build to verify frontend compiles**

Run: `npm run build`
Expected: Build succeeds with 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/components/SubscriptionForm.tsx
git commit -m "feat: add client selector and simplify advanced settings UI"
```

---

## Task 5: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run --reporter=verbose`
Expected: All tests pass

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: 0 errors

- [ ] **Step 4: Build frontend**

Run: `npm run build`
Expected: `dist/` created successfully

- [ ] **Step 5: Self-review checklist**

- [ ] All 4 rule templates generate correct rules for both Clash and Shadowrocket
- [ ] Shadowrocket `.conf` output contains all required sections
- [ ] API returns correct Content-Type per client (yaml for Clash, text/plain for Shadowrocket)
- [ ] Frontend allows selecting both client and template
- [ ] Advanced settings are simplified (port + mode only)
- [ ] Existing VLESS parsing (Reality, gRPC, ws, allowInsecure) still works
- [ ] All tests pass

---

## Spec Coverage Check

| Requirement | Task |
|---|---|
| 黑名单规则 | Task 1 |
| 黑名单 + AdGuard | Task 1 |
| 白名单规则 | Task 1 |
| 白名单 + AdGuard | Task 1 |
| Shadowrocket 订阅生成 | Task 2 |
| Clash 订阅生成（保持兼容）| Task 3 |
| 多客户端 API 路由 | Task 3 |
| 前端客户端选择器 | Task 4 |
| 简化高级设置 | Task 4 |
| 输入 VLESS → 输出对应客户端配置 | Task 2 + 3 + 4 |

## Placeholder Scan

- No TBD/TODO/implement later found.
- All code blocks contain complete implementation.
- No "similar to Task N" references.
- No undefined types or functions referenced.

## Type Consistency Check

- `RuleTemplate` values (`blacklist`, `blacklist-adguard`, `whitelist`, `whitelist-adguard`) used consistently across types, rules, tests, and frontend.
- `ClientType` values (`clash`, `shadowrocket`) used consistently across types, API, and frontend.
- `VlessNode` fields (Reality, gRPC, allowInsecure) already defined in types and used by both generators.
