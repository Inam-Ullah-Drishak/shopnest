import { useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };

    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={busy ? undefined : onCancel}
        aria-label="Cancel"
        className="absolute inset-0 bg-gray-900/50"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-5"
      >
        <div className="flex gap-3">
          {danger && (
            <span className="w-9 h-9 shrink-0 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </span>
          )}

          <div className="min-w-0">
            <h2 className="font-bold">{title}</h2>
            {message && (
              <p className="text-sm text-gray-600 mt-1">{message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="border px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            autoFocus
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-white disabled:opacity-50 cursor-pointer ${
              danger
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-gray-900 hover:bg-gray-700'
            }`}
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;