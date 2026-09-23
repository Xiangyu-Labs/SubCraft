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
import { fieldClass, fieldStyle } from './field';

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
  const [showAdvanced, setShowAdvanced] = useState(false);
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
    <div className="w-full max-w-2xl space-y-6">
      <ImportBox onImport={handleImport} />

      <div className="space-y-2">
        <label className="text-sm font-medium">代理链接 / 上游订阅地址（每行一个）</label>
        <textarea
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          placeholder={[
            'vless://uuid@example.com:443?security=reality&...#节点名称',
            'hysteria2://password@example.com:443#节点名称',
            'https://机场或面板的订阅地址（流量信息会透传给客户端）',
          ].join('\n')}
          className={`${fieldClass} h-36 resize-y font-mono text-sm`}
          style={fieldStyle}
        />
        <p className="text-xs text-muted-foreground">
          支持 vless / vmess / trojan / ss / hysteria2 / tuic；http(s) 开头的行视为上游订阅。
        </p>
      </div>

      <NodePreview entries={parsed.entries} />

      <div className="space-y-2">
        <label className="text-sm font-medium">规则模板</label>
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value as RuleTemplate)}
          className={fieldClass}
          style={fieldStyle}
        >
          {Object.values(ruleTemplates).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}（{t.description}）
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm font-medium"
        style={{ color: 'var(--primary)' }}
      >
        {showAdvanced ? '隐藏' : '显示'}高级配置
      </button>

      {showAdvanced && (
        <AdvancedOptions
          values={advanced}
          onChange={(patch) => setAdvanced((prev) => ({ ...prev, ...patch }))}
        />
      )}

      {error && (
        <div
          className="p-3 rounded-md text-sm"
          style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }}
        >
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

      {subscriptionUrl && <ResultPanel url={subscriptionUrl} />}
    </div>
  );
}
