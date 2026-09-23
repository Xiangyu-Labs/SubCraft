import { useState } from 'react';
import { decodeSubscriptionData, extractEncodedData, validateSubscriptionData } from '@/shared/encoder';
import type { SubscriptionData } from '@/shared/types';
import { fieldClass, fieldStyle } from './field';

/** 粘贴已生成的订阅链接，在浏览器本地解码回填——数据本来就全在链接里 */
export function ImportBox({ onImport }: { onImport: (data: SubscriptionData) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    setError('');
    const encoded = extractEncodedData(value);
    if (!encoded) {
      setError('不是 SubCraft 生成的订阅链接');
      return;
    }
    try {
      onImport(validateSubscriptionData(decodeSubscriptionData(encoded)));
      setValue('');
    } catch {
      setError('链接已损坏，无法解码');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="粘贴已有的订阅链接，回填后继续编辑"
          className={`${fieldClass} flex-1 font-mono text-sm`}
          style={fieldStyle}
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={!value.trim()}
          className="shrink-0 px-4 py-2 rounded-md border font-medium transition-all active:scale-[0.99] disabled:opacity-50"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          导入
        </button>
      </div>
      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}
