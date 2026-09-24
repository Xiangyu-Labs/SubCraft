import type { ReactNode } from 'react';

export const inputClass =
  'w-full min-w-0 border border-line bg-field px-2 py-1.5 outline-none focus:border-fg placeholder:text-muted/60';

export const buttonClass =
  'shrink-0 border border-line px-3 py-1.5 hover:border-fg disabled:opacity-40 disabled:hover:border-line';

/** 一节表单：强调色的短标签 */
export function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="space-y-1.5">
      <div className="text-accent">{label}</div>
      {children}
    </section>
  );
}
