import { useMemo, useState } from 'react';
import { encodeSubscriptionData } from '@/shared/encoder';
import { parseLinkList } from '@/shared/parsers';
import { ruleTemplates } from '@/shared/rules';
import { DEFAULT_BASE_CONFIG } from '@/shared/defaults';
import { showToast } from '@/lib/toast';
import type { RuleTemplate, SubscriptionData } from '@/shared/types';
import { AdvancedOptions, type AdvancedValues } from './AdvancedOptions';
import { ImportBox } from './ImportBox';
import { NodePreview } from './NodePreview';
import { ResultPanel } from './ResultPanel';
import { Section, buttonClass, inputClass } from './ui';

const GB = 1024 ** 3;

const DEFAULT_ADVANCED: AdvancedValues = {
  name: '',
  mixedPort: DEFAULT_BASE_CONFIG.mixedPort,
  mode: DEFAULT_BASE_CONFIG.mode,
  totalGB: '',
  expireDate: '',
};

function toDateInput(unix: number): string {
  const d = new Date(unix * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildUserinfo(adv: AdvancedValues): SubscriptionData['userinfo'] {
  const total = adv.totalGB ? Math.round(Number(adv.totalGB) * GB) : 0;
  // 到期日当天结束时过期
  const expire = adv.expireDate
    ? Math.floor(new Date(`${adv.expireDate}T23:59:59`).getTime() / 1000)
    : 0;
  if (!(total > 0) && !(expire > 0)) return undefined;
  return {
    ...(total > 0 ? { total } : {}),
    ...(expire > 0 ? { expire } : {}),
  };
}

export function SubscriptionForm() {
  const [links, setLinks] = useState('');
  const [template, setTemplate] = useState<RuleTemplate>('blacklist');
  const [advanced, setAdvanced] = useState<AdvancedValues>(DEFAULT_ADVANCED);
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [error, setError] = useState('');

  const parsed = useMemo(() => parseLinkList(links), [links]);

  const handleImport = (data: SubscriptionData) => {
    setLinks([...data.links, ...(data.upstreams ?? [])].join('\n'));
    setTemplate(data.template);
    setAdvanced({
      name: data.name ?? '',
      mixedPort: data.baseConfig?.mixedPort ?? DEFAULT_ADVANCED.mixedPort,
      mode: data.baseConfig?.mode ?? DEFAULT_ADVANCED.mode,
      totalGB: data.userinfo?.total ? String(+(data.userinfo.total / GB).toFixed(2)) : '',
      expireDate: data.userinfo?.expire ? toDateInput(data.userinfo.expire) : '',
    });
    setSubscriptionUrl('');
    setError('');
    showToast('已导入，可以继续编辑');
  };

  const handleGenerate = () => {
    setError('');

    if (parsed.nodes.length === 0 && parsed.upstreams.length === 0) {
      setError('请至少输入一个可用的代理链接或上游订阅地址');
      return;
    }

    try {
      const encoded = encodeSubscriptionData({
        links: parsed.links,
        upstreams: parsed.upstreams.length ? parsed.upstreams : undefined,
        template,
        name: advanced.name.trim() || undefined,
        baseConfig: {
          ...DEFAULT_BASE_CONFIG,
          mixedPort: advanced.mixedPort,
          mode: advanced.mode,
        },
        userinfo: buildUserinfo(advanced),
      });

      let baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = 'https://' + baseUrl;
      }
      setSubscriptionUrl(`${baseUrl}/api/sub?data=${encoded}`);

      if (parsed.errors.length) {
        showToast(`已忽略 ${parsed.errors.length} 行无法解析的内容`, 'error');
      }
    } catch (err) {
      console.error('生成失败:', err);
      setError('生成订阅链接失败');
    }
  };

  return (
    <div className="space-y-6">
      <Section label="links">
        <textarea
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          placeholder={[
            'vless://uuid@example.com:443?security=reality&...#name',
            'hysteria2://password@example.com:443#name',
            'https://example.com/sub/token',
          ].join('\n')}
          spellCheck={false}
          className={`${inputClass} h-40 resize-y text-xs`}
        />
        <NodePreview entries={parsed.entries} />
      </Section>

      <Section label="rules">
        <div className="grid gap-x-6 sm:grid-cols-2">
          {Object.values(ruleTemplates).map((t) => (
            <label key={t.id} className="flex cursor-pointer gap-2 py-0.5" title={t.description}>
              <input
                type="radio"
                name="template"
                checked={template === t.id}
                onChange={() => setTemplate(t.id as RuleTemplate)}
                className="accent-accent"
              />
              <span className={template === t.id ? '' : 'text-muted'}>{t.name}</span>
            </label>
          ))}
        </div>
      </Section>

      <details className="group">
        <summary className="cursor-pointer select-none text-accent">
          options
        </summary>
        <div className="mt-2">
          <AdvancedOptions
            values={advanced}
            onChange={(patch) => setAdvanced((prev) => ({ ...prev, ...patch }))}
          />
        </div>
      </details>

      <details>
        <summary className="cursor-pointer select-none text-accent">
          import
        </summary>
        <div className="mt-2">
          <ImportBox onImport={handleImport} />
        </div>
      </details>

      <div className="space-y-3 border-t border-line pt-6">
        <button
          type="button"
          onClick={handleGenerate}
          className={`${buttonClass} border-fg bg-fg text-bg hover:opacity-85`}
        >
          生成订阅链接
        </button>
        {error && <p className="text-danger">error: {error}</p>}
        {subscriptionUrl && <ResultPanel url={subscriptionUrl} />}
      </div>
    </div>
  );
}
