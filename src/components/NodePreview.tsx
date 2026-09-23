import type { LinkEntry } from '@/shared/parsers';

/** 逐行显示解析结果：写错的链接当场标出来，而不是在服务端被悄悄丢掉 */
export function NodePreview({ entries }: { entries: LinkEntry[] }) {
  if (entries.length === 0) return null;

  const nodes = entries.filter((e) => e.kind === 'node').length;
  const upstreams = entries.filter((e) => e.kind === 'upstream').length;
  const errors = entries.filter((e) => e.kind === 'error').length;

  return (
    <div className="border border-line text-xs">
      <div className="border-b border-line px-2 py-1 text-muted">
        {nodes} 个节点
        {upstreams > 0 && ` · ${upstreams} 个上游订阅`}
        {errors > 0 && <span className="text-danger"> · {errors} 行无法解析</span>}
      </div>
      <ul className="max-h-60 overflow-y-auto py-1">
        {entries.map((entry) => (
          <li key={entry.line} className="flex min-w-0 gap-3 px-2 py-0.5">
            <span className="w-5 shrink-0 text-right text-muted">{entry.line}</span>
            {entry.kind === 'node' && (
              <>
                <span className="w-16 shrink-0 text-accent">{entry.node.type}</span>
                <span className="truncate">{entry.node.name}</span>
                <span className="ml-auto shrink-0 text-muted">
                  {entry.node.server}:{entry.node.port}
                </span>
              </>
            )}
            {entry.kind === 'upstream' && (
              <>
                <span className="w-16 shrink-0 text-accent">upstream</span>
                <span className="truncate">{entry.raw}</span>
                <span className="ml-auto shrink-0 text-muted">服务端拉取</span>
              </>
            )}
            {entry.kind === 'error' && (
              <>
                <span className="w-16 shrink-0 text-danger">error</span>
                <span className="truncate text-danger">{entry.message}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
