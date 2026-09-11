import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminNav from '../../components/AdminNav.jsx';

function ProductImportPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [fileName, setFileName] = useState('');
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (userInfo && !userInfo.isAdmin) navigate('/login');

  const pickFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setPreview(null);
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => setCsv(reader.result);
    reader.onerror = () => setError('Could not read that file');
    reader.readAsText(file);

    e.target.value = '';
  };

  // Runs twice over: once to report what would happen, once for real
  const run = async (dryRun) => {
    setBusy(true);
    setError('');

    try {
      const { data } = await axios.post('/api/products/import', {
        csv,
        dryRun,
      });

      if (dryRun) {
        setPreview(data);
        setResult(null);
      } else {
        setResult(data);
        setPreview(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setCsv('');
    setFileName('');
    setPreview(null);
    setResult(null);
    setError('');
  };

  const report = result || preview;

  return (
    <div className="p-8">
      <AdminNav />

      <Link
        to="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        All products
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-1">Import products</h1>
      <p className="text-sm text-gray-500 mb-6">
        Products are matched by handle. Existing ones are updated, new ones are
        created. Nothing is ever deleted by an import.
      </p>

      <div className="max-w-2xl">
        <label
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-12 ${
            busy ? 'opacity-50' : 'cursor-pointer hover:bg-gray-50'
          }`}
        >
          <Upload size={28} className="text-gray-400" />
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

        {csv && (
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              onClick={() => run(true)}
              disabled={busy}
              className="inline-flex items-center gap-2 border px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              Check the file
            </button>

            {preview && preview.errors.length === 0 && (
              <button
                type="button"
                onClick={() => run(false)}
                disabled={busy}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 cursor-pointer"
              >
                {busy && <Loader2 size={15} className="animate-spin" />}
                Import for real
              </button>
            )}

            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 border px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 cursor-pointer"
            >
              <X size={15} />
              Clear
            </button>
          </div>
        )}

        <div className="border rounded-lg p-4 mt-6 bg-gray-50">
          <p className="text-sm font-medium mb-1">Not sure about the format?</p>
          <p className="text-sm text-gray-600 mb-3">
            Export your products from the product list to see the exact
            columns, or start from a template with example rows.
          </p>

          <div className="flex flex-wrap gap-2">
            <a
              href="/api/products/template"
              className="inline-flex items-center gap-2 border bg-white px-4 py-2.5 rounded-lg text-sm hover:bg-gray-100"
            >
              <FileText size={16} />
              Download template
            </a>

            <Link
              to="/admin/products"
              className="inline-flex items-center gap-2 border bg-white px-4 py-2.5 rounded-lg text-sm hover:bg-gray-100"
            >
              Go to products to export
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded mt-6 max-w-2xl">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {report && (
        <div className="border rounded-lg p-5 mt-6">
          <div className="flex items-center gap-2 mb-4">
            {result ? (
              <CheckCircle2 size={20} className="text-green-600" />
            ) : (
              <FileText size={20} className="text-gray-400" />
            )}

            <h2 className="font-bold">
              {result ? 'Import complete' : 'Check results'}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-500">Rows read</p>
              <p className="text-xl font-bold mt-0.5">{report.totalRows}</p>
            </div>

            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-500">Products</p>
              <p className="text-xl font-bold mt-0.5">{report.products}</p>
            </div>

            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-500">
                {result ? 'Created' : 'Would create'}
              </p>
              <p className="text-xl font-bold mt-0.5">{report.created}</p>
            </div>

            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-500">
                {result ? 'Updated' : 'Would update'}
              </p>
              <p className="text-xl font-bold mt-0.5">{report.updated}</p>
            </div>
          </div>

          {report.errors.length > 0 ? (
            <div>
              <p className="font-medium text-sm text-red-700 mb-2">
                {report.errors.length} row
                {report.errors.length === 1 ? '' : 's'} need fixing
              </p>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="p-2.5 font-medium w-20">Row</th>
                      <th className="p-2.5 font-medium">Handle</th>
                      <th className="p-2.5 font-medium">Problem</th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.errors.slice(0, 30).map((e, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2.5 font-mono text-xs">{e.row}</td>
                        <td className="p-2.5 font-mono text-xs">{e.handle}</td>
                        <td className="p-2.5 text-red-700">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {report.errors.length > 30 && (
                <p className="text-xs text-gray-500 mt-2">
                  Showing the first 30.
                </p>
              )}

              <p className="text-sm text-gray-600 mt-3">
                Fix these rows in your spreadsheet and check the file again. Row
                numbers match the line numbers in Excel.
              </p>
            </div>
          ) : (
            <p className="text-sm text-green-700">
              {result
                ? 'Everything imported without errors.'
                : 'No problems found. Press import to apply the changes.'}
            </p>
          )}

          {result && (
            <Link
              to="/admin/products"
              className="inline-block bg-gray-900 text-white px-5 py-2.5 rounded-lg mt-5 hover:bg-gray-700"
            >
              See your products
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductImportPage;