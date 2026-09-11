import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

function ProductImportModal({ open, onClose, onImported }) {
  const [fileName, setFileName] = useState('');
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState('all');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Lock the page behind the dialog and close on Escape
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
    };

    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  const reset = () => {
    setCsv('');
    setFileName('');
    setPreview(null);
    setResult(null);
    setMode('all');
    setError('');
  };

  const closeAndReset = () => {
    reset();
    onClose();
  };

  const pickFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setPreview(null);
    setResult(null);
    setMode('all');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => setCsv(reader.result);
    reader.onerror = () => setError('Could not read that file');
    reader.readAsText(file);

    e.target.value = '';
  };

  // The check always runs in 'all' mode, so one pass tells us both how many
  // are new and how many already exist. Every mode's numbers follow from that.
  const check = async () => {
    setBusy(true);
    setError('');

    try {
      const { data } = await axios.post('/api/products/import', {
        csv,
        dryRun: true,
        mode: 'all',
      });

      setPreview(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not read that file');
    } finally {
      setBusy(false);
    }
  };

  const doImport = async () => {
    setBusy(true);
    setError('');

    try {
      const { data } = await axios.post('/api/products/import', {
        csv,
        dryRun: false,
        mode,
      });

      setResult(data);
      setPreview(null);
      onImported();
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  // How many products each mode would actually touch
  const counts = preview
    ? {
        all: preview.created + preview.updated,
        new: preview.created,
        update: preview.updated,
      }
    : { all: 0, new: 0, update: 0 };

  const modes = [
    {
      value: 'all',
      label: 'Create and update',
      hint: 'Add the new ones and overwrite the rest.',
    },
    {
      value: 'new',
      label: 'Only add new',
      hint: 'Leave everything already in the store untouched.',
    },
    {
      value: 'update',
      label: 'Only update existing',
      hint: 'Create nothing new. Good for bulk price changes.',
    },
  ];

  const hasErrors = preview?.errors.length > 0;
  const readyToImport = preview && !hasErrors;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={busy ? undefined : closeAndReset}
        aria-label="Close"
        className="absolute inset-0 bg-gray-900/50"
      />

      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 p-5 border-b">
          <div>
            <h2 className="text-lg font-bold">Import products</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Products are matched by handle. Nothing is ever deleted by an
              import.
            </p>
          </div>

          <button
            type="button"
            onClick={closeAndReset}
            disabled={busy}
            aria-label="Close"
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {result ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={20} className="text-green-600" />
                <h3 className="font-bold">Import complete</h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="border rounded-lg p-3">
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-xl font-bold mt-0.5">{result.created}</p>
                </div>

                <div className="border rounded-lg p-3">
                  <p className="text-xs text-gray-500">Updated</p>
                  <p className="text-xl font-bold mt-0.5">{result.updated}</p>
                </div>

                <div className="border rounded-lg p-3">
                  <p className="text-xs text-gray-500">Skipped</p>
                  <p className="text-xl font-bold mt-0.5">
                    {result.skipped || 0}
                  </p>
                </div>
              </div>

              <p className="text-sm text-green-700 mt-4">
                Your product list has been updated.
              </p>
            </div>
          ) : (
            <>
              <label
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-10 ${
                  busy ? 'opacity-50' : 'cursor-pointer hover:bg-gray-50'
                }`}
              >
                <Upload size={26} className="text-gray-400" />
                <p className="mt-3 font-medium">
                  {fileName || 'Choose a CSV file'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {fileName ? 'Click to choose a different file' : 'CSV only'}
                </p>

                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={pickFile}
                  disabled={busy}
                  className="hidden"
                />
              </label>

              {!csv && (
                <p className="text-sm text-gray-500 mt-3">
                  Not sure about the format? Export your products first, or
                  start from the template.
                </p>
              )}

              {csv && !preview && !error && (
                <p className="text-sm text-gray-500 mt-3">
                  Press check to see what this file would do. Nothing is
                  written yet.
                </p>
              )}

              {error && (
                <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded mt-4">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {hasErrors && (
                <div className="mt-4">
                  <p className="font-medium text-sm text-red-700 mb-2">
                    {preview.errors.length} row
                    {preview.errors.length === 1 ? '' : 's'} need fixing before
                    anything can be imported
                  </p>

                  <div className="border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left text-gray-600 sticky top-0">
                        <tr>
                          <th className="p-2 font-medium w-16">Row</th>
                          <th className="p-2 font-medium">Handle</th>
                          <th className="p-2 font-medium">Problem</th>
                        </tr>
                      </thead>

                      <tbody>
                        {preview.errors.slice(0, 30).map((e, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2 font-mono text-xs">{e.row}</td>
                            <td className="p-2 font-mono text-xs">
                              {e.handle}
                            </td>
                            <td className="p-2 text-red-700">{e.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-sm text-gray-600 mt-3">
                    Row numbers match the lines in Excel. Fix them and check
                    again.
                  </p>
                </div>
              )}

              {readyToImport && (
                <div className="mt-5">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-4">
                    <p className="font-medium">
                      Found {preview.products} product
                      {preview.products === 1 ? '' : 's'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {preview.created} new, {preview.updated} already in the
                      store
                    </p>
                  </div>

                  <fieldset>
                    <legend className="text-sm font-medium mb-2">
                      What would you like to do?
                    </legend>

                    <div className="space-y-2">
                      {modes.map((m) => {
                        const n = counts[m.value];

                        return (
                          <label
                            key={m.value}
                            className={`flex gap-3 border rounded-lg p-3 ${
                              n === 0
                                ? 'opacity-50 cursor-not-allowed'
                                : 'cursor-pointer'
                            } ${
                              mode === m.value && n > 0
                                ? 'border-gray-900 bg-gray-50'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="import-mode"
                              value={m.value}
                              checked={mode === m.value}
                              onChange={() => setMode(m.value)}
                              disabled={busy || n === 0}
                              className="mt-0.5 w-4 h-4 cursor-pointer"
                            />

                            <span className="flex-1">
                              <span className="flex items-baseline justify-between gap-3">
                                <span className="text-sm font-medium">
                                  {m.label}
                                </span>
                                <span className="text-sm text-gray-500 shrink-0">
                                  {n} product{n === 1 ? '' : 's'}
                                </span>
                              </span>

                              <span className="block text-xs text-gray-500 mt-0.5">
                                {m.hint}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 p-5 border-t">
          {!result && (
            <a
              href="/api/products/template"
              className="inline-flex items-center gap-2 border px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50"
            >
              <FileText size={16} />
              Template
            </a>
          )}

          <div className="flex flex-wrap gap-2 ml-auto">
            <button
              type="button"
              onClick={closeAndReset}
              disabled={busy}
              className="border px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            >
              {result ? 'Done' : 'Cancel'}
            </button>

            {csv && !result && (
              <button
                type="button"
                onClick={check}
                disabled={busy}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm disabled:opacity-50 cursor-pointer ${
                  preview
                    ? 'border hover:bg-gray-50'
                    : 'bg-gray-900 text-white hover:bg-gray-700'
                }`}
              >
                {busy && !preview && (
                  <Loader2 size={15} className="animate-spin" />
                )}
                {preview ? 'Check again' : 'Check the file'}
              </button>
            )}

            {readyToImport && counts[mode] > 0 && (
              <button
                type="button"
                onClick={doImport}
                disabled={busy}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 cursor-pointer"
              >
                {busy && <Loader2 size={15} className="animate-spin" />}
                Import {counts[mode]} product
                {counts[mode] === 1 ? '' : 's'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductImportModal;