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
