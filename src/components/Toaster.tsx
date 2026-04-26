import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { subscribeToasts, type ToastItem } from '@/lib/toast';

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToasts(setToasts);
    return () => { unsubscribe(); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-in fade-in slide-in-from-top-2 flex items-center gap-2 rounded-lg border px-4 py-2.5 shadow-lg duration-200"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
            borderLeftWidth: '3px',
            borderLeftColor:
              toast.type === 'error' ? 'var(--danger)' : 'var(--primary)',
          }}
        >
          {toast.type === 'error' ? (
            <XCircle
              className="h-4 w-4 shrink-0"
              style={{ color: 'var(--danger)' }}
            />
          ) : (
            <CheckCircle2
              className="h-4 w-4 shrink-0"
              style={{ color: 'var(--primary)' }}
            />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
