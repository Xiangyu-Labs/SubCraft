import type { ReactNode } from 'react';
import type { ClashBaseConfig } from '@/shared/types';
import { inputClass } from './ui';

export interface AdvancedValues {
  name: string;
  mixedPort: number;
  mode: ClashBaseConfig['mode'];
  totalGB: string;     // 空串表示不填
  expireDate: string;  // yyyy-mm-dd，空串表示不填
}

interface Props {
  values: AdvancedValues;
  onChange: (patch: Partial<AdvancedValues>) => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <label className="pt-1.5 text-muted">{label}</label>
      <div>{children}</div>
    </>
  );
}

export function AdvancedOptions({ values, onChange }: Props) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2">
      <Row label="name">
        <input
          value={values.name}
          maxLength={64}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="SubCraft"
          className={inputClass}
        />
      </Row>
      <Row label="port">
        <input
          type="number"
          value={values.mixedPort}
          onChange={(e) => onChange({ mixedPort: Number(e.target.value) })}
          className={inputClass}
        />
      </Row>
      <Row label="mode">
        <select
          value={values.mode}
          onChange={(e) => onChange({ mode: e.target.value as ClashBaseConfig['mode'] })}
          className={inputClass}
        >
          <option value="rule">rule — 规则</option>
          <option value="global">global — 全局代理</option>
          <option value="direct">direct — 全部直连</option>
        </select>
      </Row>
      <Row label="total GB">
        <input
          type="number"
          min={0}
          step="any"
          value={values.totalGB}
          onChange={(e) => onChange({ totalGB: e.target.value })}
          placeholder="不填"
          className={inputClass}
        />
      </Row>
      <Row label="expire">
        <input
          type="date"
          value={values.expireDate}
          onChange={(e) => onChange({ expireDate: e.target.value })}
          className={inputClass}
        />
      </Row>
    </div>
  );
}
