import type { ClashBaseConfig } from '@/shared/types';
import { fieldClass, fieldStyle } from './field';

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

export function AdvancedOptions({ values, onChange }: Props) {
  return (
    <div className="space-y-4 p-4 rounded-md border" style={{ borderColor: 'var(--border)' }}>
      <div className="space-y-2">
        <label className="text-sm font-medium">订阅名称</label>
        <input
          value={values.name}
          maxLength={64}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="SubCraft"
          className={fieldClass}
          style={fieldStyle}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">代理端口</label>
          <input
            type="number"
            value={values.mixedPort}
            onChange={(e) => onChange({ mixedPort: Number(e.target.value) })}
            className={fieldClass}
            style={fieldStyle}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">代理模式</label>
          <select
            value={values.mode}
            onChange={(e) => onChange({ mode: e.target.value as ClashBaseConfig['mode'] })}
            className={fieldClass}
            style={fieldStyle}
          >
            <option value="rule">规则模式</option>
            <option value="global">全局代理</option>
            <option value="direct">直连模式</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">总流量（GB）</label>
            <input
              type="number"
              min={0}
              step="any"
              value={values.totalGB}
              onChange={(e) => onChange({ totalGB: e.target.value })}
              placeholder="不填"
              className={fieldClass}
              style={fieldStyle}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">到期日期</label>
            <input
              type="date"
              value={values.expireDate}
              onChange={(e) => onChange({ expireDate: e.target.value })}
              className={fieldClass}
              style={fieldStyle}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          仅在没有上游订阅时生效；填了上游订阅地址会自动使用它的真实流量。
        </p>
      </div>
    </div>
  );
}
