import { useState } from 'react';
import { decodeSubscriptionData, extractEncodedData, validateSubscriptionData } from '@/shared/encoder';
import type { SubscriptionData } from '@/shared/types';
import { buttonClass, inputClass } from './ui';

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
    <div className="space-y-1">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleImport()}
          placeholder="https://…/api/sub?data=…"
          className={inputClass}
        />
        <button type="button" onClick={handleImport} disabled={!value.trim()} className={buttonClass}>
          导入
        </button>
      </div>
      {error && <p className="text-xs text-danger">error: {error}</p>}
    </div>
  );
}
