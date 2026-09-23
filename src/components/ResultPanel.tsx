import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { showToast } from '@/lib/toast';
import { fieldClass, fieldStyle } from './field';

export function ResultPanel({ url }: { url: string }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    // 节点多时链接可能超出二维码容量，生成失败就不显示
    QRCode.toDataURL(url, { margin: 2, width: 240, errorCorrectionLevel: 'L' })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('已复制到剪贴板');
    } catch {
      showToast('复制失败，请手动复制', 'error');
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">订阅链接</label>
      <div className="flex gap-2">
        <input
          value={url}
          readOnly
          onFocus={(e) => e.currentTarget.select()}
          className={`${fieldClass} flex-1 font-mono text-sm`}
          style={fieldStyle}
        />
        <button
          onClick={handleCopy}
          className="shrink-0 px-4 py-2 rounded-md border font-medium transition-all active:scale-[0.99]"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          复制
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        链接长度 {url.length} 字符。同一个链接 Clash / mihomo / Shadowrocket 通用，服务端按客户端自动输出对应格式。
      </p>
      {qrDataUrl && (
        <div className="flex flex-col items-center gap-2 rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
          <img
            src={qrDataUrl}
            alt="订阅二维码"
            className="rounded-md"
            style={{ width: 240, height: 240 }}
          />
          <p className="text-xs text-muted-foreground">可用 Shadowrocket 扫码添加订阅</p>
        </div>
      )}
    </div>
  );
}
