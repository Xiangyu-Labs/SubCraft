import type { CSSProperties } from 'react';

// 表单控件共用的主题色，跟随 globals.css 里的主题变量
export const fieldStyle: CSSProperties = {
  background: 'var(--surface)',
  borderColor: 'var(--border)',
  color: 'var(--text)',
};

export const fieldClass = 'w-full px-3 py-2 rounded-md border';
