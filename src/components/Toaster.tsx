import { useEffect, useState } from 'react';
import { subscribeToasts, type ToastItem } from '@/lib/toast';

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToasts(setToasts);
    return () => { unsubscribe(); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-1">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`border bg-bg px-3 py-1.5 ${
            toast.type === 'error' ? 'border-danger text-danger' : 'border-accent text-accent'
          }`}
        >
          {toast.type === 'error' ? '✗' : '✓'} {toast.message}
        </div>
      ))}
    </div>
  );
}
