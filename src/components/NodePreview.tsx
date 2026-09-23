import type { LinkEntry } from '@/shared/parsers';

const LABELS: Record<string, string> = {
  vless: 'VLESS',
  vmess: 'VMess',
  trojan: 'Trojan',
  ss: 'SS',
  hysteria2: 'Hy2',
  tuic: 'TUIC',
};

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold"
      style={{ color, border: `1px solid ${color}` }}
    >
      {text}
    </span>
  );
}

/** 逐行显示解析结果：写错的链接当场标出来，而不是在服务端被悄悄丢掉 */
export function NodePreview({ entries }: { entries: LinkEntry[] }) {
  if (entries.length === 0) return null;

  const nodes = entries.filter((e) => e.kind === 'node').length;
  const upstreams = entries.filter((e) => e.kind === 'upstream').length;
  const errors = entries.filter((e) => e.kind === 'error').length;

  return (
    <div className="rounded-md border text-sm" style={{ borderColor: 'var(--border)' }}>
      <div className="flex gap-3 border-b px-3 py-2 text-xs text-muted-foreground" style={{ borderColor: 'var(--border)' }}>
        <span>{nodes} 个节点</span>
        {upstreams > 0 && <span>{upstreams} 个上游订阅</span>}
        {errors > 0 && <span style={{ color: 'var(--danger)' }}>{errors} 行无法解析</span>}
      </div>
      <ul className="max-h-56 overflow-y-auto">
        {entries.map((entry) => (
          <li
            key={entry.line}
            className="flex items-center gap-2 px-3 py-1.5 min-w-0"
          >
            <span className="w-6 shrink-0 text-right font-mono text-xs text-muted-foreground">
              {entry.line}
            </span>
            {entry.kind === 'node' && (
              <>
                <Badge text={LABELS[entry.node.type] ?? entry.node.type} color="var(--primary)" />
                <span className="truncate">{entry.node.name}</span>
                <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
                  {entry.node.server}:{entry.node.port}
                </span>
              </>
            )}
            {entry.kind === 'upstream' && (
              <>
                <Badge text="订阅" color="var(--info)" />
                <span className="truncate font-mono text-xs">{entry.raw}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">服务端拉取</span>
              </>
            )}
            {entry.kind === 'error' && (
              <>
                <Badge text="错误" color="var(--danger)" />
                <span className="truncate" style={{ color: 'var(--danger)' }}>
                  {entry.message}
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
