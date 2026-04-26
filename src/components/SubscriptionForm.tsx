import { useState } from 'react';
import { encodeSubscriptionData } from '@/shared/encoder';
import { ruleTemplates } from '@/shared/rules';
import type { RuleTemplate } from '@/shared/types';

export function SubscriptionForm() {
  const [links, setLinks] = useState('');
  const [template, setTemplate] = useState<RuleTemplate>('balanced');
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mixedPort, setMixedPort] = useState(7890);
  const [allowLan, setAllowLan] = useState(false);
  const [mode, setMode] = useState<'rule' | 'global' | 'direct'>('rule');
  const [enableDns, setEnableDns] = useState(true);
  const [fakeIpFilter, setFakeIpFilter] = useState('*.lan\n*.local\n*.localhost');
  const [nameserver, setNameserver] = useState('119.29.29.29\n223.5.5.5');
  const [fallback, setFallback] = useState('tls://1.1.1.1:853\ntls://8.8.8.8:853');

  const handleGenerate = () => {
    try {
      setError('');

      const linkArray = links
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .map(l => l.replace(/@(https?:\/\/)/, '@'));

      if (linkArray.length === 0) {
        setError('请至少输入一个代理链接');
        return;
      }

      const encoded = encodeSubscriptionData({
        links: linkArray,
        template,
        client: 'clash',
        baseConfig: {
          mixedPort,
          allowLan,
          mode,
          logLevel: 'info',
          ipv6: false,
        },
        dnsOptions: {
          enable: enableDns,
          ipv6: false,
          enhancedMode: 'fake-ip',
          fakeIpRange: '198.18.0.1/16',
          fakeIpFilter: fakeIpFilter.split('\n').map(s => s.trim()).filter(s => s),
          nameserver: nameserver.split('\n').map(s => s.trim()).filter(s => s),
          fallback: fallback.split('\n').map(s => s.trim()).filter(s => s),
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
        <label className="text-sm font-medium">
          代理链接（每行一个）
        </label>
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
              {t.name} - {t.description}
            </option>
          ))}
        </select>
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
          <h3 className="text-sm font-semibold">基础配置</h3>

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
            <p className="text-xs text-muted-foreground">HTTP + SOCKS5 混合端口，默认 7890</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowLan"
              checked={allowLan}
              onChange={(e) => setAllowLan(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="allowLan" className="text-sm font-medium">允许局域网连接</label>
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

          <h3 className="text-sm font-semibold mt-4">DNS 配置</h3>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enableDns"
              checked={enableDns}
              onChange={(e) => setEnableDns(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="enableDns" className="text-sm font-medium">启用 DNS</label>
          </div>

          {enableDns && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fake-IP 过滤列表</label>
                <textarea
                  value={fakeIpFilter}
                  onChange={(e) => setFakeIpFilter(e.target.value)}
                  placeholder="*.lan&#10;*.local&#10;*.ts.net"
                  className="w-full h-24 px-3 py-2 rounded-md border resize-none font-mono text-sm"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  这些域名不走 fake-ip，直接用真实 DNS 解析（每行一个）
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">DNS 服务器（国内）</label>
                <textarea
                  value={nameserver}
                  onChange={(e) => setNameserver(e.target.value)}
                  placeholder="119.29.29.29&#10;223.5.5.5"
                  className="w-full h-20 px-3 py-2 rounded-md border resize-none font-mono text-sm"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  用于解析国内域名（每行一个）
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">备用 DNS（国外）</label>
                <textarea
                  value={fallback}
                  onChange={(e) => setFallback(e.target.value)}
                  placeholder="tls://1.1.1.1:853&#10;tls://8.8.8.8:853"
                  className="w-full h-20 px-3 py-2 rounded-md border resize-none font-mono text-sm"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  用于解析国外域名（每行一个）
                </p>
              </div>
            </>
          )}
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
            将此链接添加到 Clash 客户端即可使用
          </p>
        </div>
      )}
    </div>
  );
}
