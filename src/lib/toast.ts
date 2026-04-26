export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const listeners = new Set<(toasts: ToastItem[]) => void>();
let toasts: ToastItem[] = [];

function notify() {
  listeners.forEach((cb) => cb([...toasts]));
}

export function showToast(message: string, type: 'success' | 'error' = 'success') {
  const id = Date.now() + Math.random();
  toasts = [...toasts, { id, message, type }];
  notify();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 2500);
}

export function subscribeToasts(callback: (toasts: ToastItem[]) => void) {
  listeners.add(callback);
  callback([...toasts]);
  return () => listeners.delete(callback);
}
