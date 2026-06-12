import { useToastStore, type ToastKind } from '../store/toastStore';

const KIND_COLORS: Record<ToastKind, string> = {
  info: 'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--accent)',
  error: 'var(--danger)',
};

const KIND_ICONS: Record<ToastKind, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  error: '✕',
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm animate-slide-up pointer-events-auto cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
            maxWidth: 420,
          }}
          onClick={() => dismissToast(toast.id)}
        >
          <span
            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
            style={{ backgroundColor: KIND_COLORS[toast.kind], color: '#000' }}
          >
            {KIND_ICONS[toast.kind]}
          </span>
          <span className="min-w-0">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
