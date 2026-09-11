import { createContext, useContext, useState, useCallback, useRef } from 'react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const ConfirmContext = createContext();

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);

  // Holds the resolve function of the promise the caller is awaiting
  const resolver = useRef(null);

  // Drop-in replacement for window.confirm, but returns a promise.
  // Pass an `input` option and it resolves with the typed string instead
  // of true, replacing window.prompt as well.
  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current = resolve;

        setDialog(
          typeof options === 'string' ? { title: options } : options || {}
        );
      }),
    []
  );

  const settle = (answer) => {
    resolver.current?.(answer);
    resolver.current = null;
    setDialog(null);
    setBusy(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog?.title || 'Are you sure?'}
        message={dialog?.message}
        confirmLabel={dialog?.confirmLabel}
        cancelLabel={dialog?.cancelLabel}
        danger={dialog?.danger}
        input={dialog?.input}
        busy={busy}
        onConfirm={(answer) => {
          setBusy(true);
          settle(answer);
        }}
        onCancel={() => settle(dialog?.input ? null : false)}
      />
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  return useContext(ConfirmContext);
}
