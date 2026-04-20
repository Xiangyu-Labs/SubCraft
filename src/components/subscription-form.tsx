'use client';

import { useState } from 'react';
import { encodeSubscriptionData } from '@/lib/encoder';
import { ruleTemplates } from '@/lib/rules';
import type { RuleTemplate } from '@/lib/types';

export function SubscriptionForm() {
  const [links, setLinks] = useState('');
  const [template, setTemplate] = useState<RuleTemplate>('balanced');
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = () => {
    try {
      setError('');

      const linkArray = links
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      if (linkArray.length === 0) {
        setError('请至少输入一个代理链接');
        return;
      }

      const encoded = encodeSubscriptionData({
        links: linkArray,
        template,
        client: 'clash',
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const url = `${baseUrl}/api/sub?data=${encoded}`;
      setSubscriptionUrl(url);
    } catch (err) {
      setError('生成订阅链接失败');
      console.error(err);
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
