import type { ReactNode } from 'react';

export const inputClass =
  'w-full border border-line bg-field px-2 py-1.5 outline-none focus:border-fg placeholder:text-muted/60';

export const buttonClass =
  'shrink-0 border border-line px-3 py-1.5 hover:border-fg disabled:opacity-40 disabled:hover:border-line';

/** 一节表单：强调色的短标签 + 灰色说明 */
export function Section({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-1.5">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="text-accent">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </section>
  );
}
