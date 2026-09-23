import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { showToast } from '@/lib/toast';
import { buttonClass, inputClass } from './ui';

export function ResultPanel({ url }: { url: string }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    // 节点多时链接可能超出二维码容量，生成失败就不提供二维码
    QRCode.toDataURL(url, { margin: 2, width: 240, errorCorrectionLevel: 'L' })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('已复制');
    } catch {
      showToast('复制失败，请手动复制', 'error');
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        value={url}
        readOnly
        rows={4}
        onFocus={(e) => e.currentTarget.select()}
        className={`${inputClass} resize-y break-all text-xs`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={handleCopy} className={buttonClass}>
          复制
        </button>
        {qrDataUrl && (
          <button type="button" onClick={() => setShowQr(!showQr)} className={buttonClass}>
            {showQr ? '收起二维码' : '二维码'}
          </button>
        )}
      </div>
      {showQr && qrDataUrl && (
        // 二维码保持白底，暗色下也能扫
        <img src={qrDataUrl} alt="订阅二维码" width={240} height={240} className="border border-line" />
      )}
    </div>
  );
}
