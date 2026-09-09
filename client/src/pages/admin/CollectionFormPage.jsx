import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Search,
  Plus,
  X,
  ImageOff,
  Upload,
  Link2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatPrice } from '../../utils/format.js';

function CollectionFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    image: '',
    isPublished: true,
    sortOrder: 0,
  });

  const [selected, setSelected] = useState([]); // full product objects
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) navigate('/login');
  }, [userInfo, navigate]);

  useEffect(() => {
    if (!isEdit) return;

    const fetchCollection = async () => {
      try {
        const { data } = await axios.get(`/api/collections/id/${id}`);

        setForm({
          title: data.title,
          description: data.description || '',
          image: data.image || '',
          isPublished: data.isPublished,
          sortOrder: data.sortOrder || 0,
        });

        setSelected(data.products || []);
      } catch (err) {
        setError(
          err.response?.data?.message || 'Could not load this collection'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [id, isEdit]);

    // Debounced product search — waits for a pause in typing
  useEffect(() => {
    const term = search.trim();

    const timer = setTimeout(async () => {
      if (!term) {
        setResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);

      try {
        const { data } = await axios.get('/api/products', {
          params: { keyword: term, pageSize: 10 },
        });
        setResults(data.products);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const addProduct = (product) => {
    if (selected.some((p) => p._id === product._id)) return;
    setSelected((prev) => [...prev, product]);
  };

  const removeProduct = (productId) =>
    setSelected((prev) => prev.filter((p) => p._id !== productId));

  const uploadHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setError('');
    setUploading(true);

    try {
      const { data } = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setField('image', data.image);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      title: form.title,
      description: form.description,
      image: form.image,
      isPublished: form.isPublished,
      sortOrder: Number(form.sortOrder) || 0,
      products: selected.map((p) => p._id),
    };

    try {
      if (isEdit) {
        await axios.put(`/api/collections/${id}`, payload);
      } else {
        await axios.post('/api/collections', payload);
      }

      navigate('/admin/collections');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this collection');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Loading collection
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <Link
        to="/admin/collections"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        All collections
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">
        {isEdit ? 'Edit collection' : 'New collection'}
      </h1>

      {error && (
        <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-6">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={submitHandler} className="space-y-6">
        <div>
          <label htmlFor="title" className="block mb-1 font-medium text-sm">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="Summer Sale"
            className="w-full border rounded-lg p-2.5"
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block mb-1 font-medium text-sm"
          >
            Description
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            rows="3"
            placeholder="Shown at the top of the collection page."
            className="w-full border rounded-lg p-2.5"
          />
        </div>

        <div>
          <p className="font-medium text-sm mb-2">Cover image</p>

          <div className="flex gap-4">
            <div className="w-28 h-28 shrink-0 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
              {form.image ? (
                <img
                  src={form.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageOff size={22} className="text-gray-300" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <label
                className={`inline-flex items-center gap-2 border rounded-lg px-4 py-2 text-sm ${
                  uploading
                    ? 'opacity-50 cursor-wait'
                    : 'cursor-pointer hover:bg-gray-50'
                }`}
              >
                {uploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                {uploading ? 'Uploading' : 'Upload'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={uploadHandler}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Or paste an image URL"
                    className="w-full border rounded-lg py-2 pl-9 pr-3 text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (urlInput.trim()) {
                      setField('image', urlInput.trim());
                      setUrlInput('');
                    }
                  }}
                  className="border rounded-lg px-4 text-sm hover:bg-gray-50 cursor-pointer"
                >
                  Use
                </button>
              </div>

              {form.image && (
                <button
                  type="button"
                  onClick={() => setField('image', '')}
                  className="text-sm text-red-600 hover:text-red-800 cursor-pointer"
                >
                  Remove image
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-sm">
              Products
              <span className="text-gray-500 font-normal">
                {' '}
                · {selected.length} selected
              </span>
            </p>
          </div>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products to add"
              className="w-full border rounded-lg py-2.5 pl-9 pr-3 text-sm"
            />
          </div>

          {search.trim() && (
            <div className="border rounded-lg mt-2 max-h-64 overflow-y-auto">
              {searching ? (
                <p className="p-3 text-sm text-gray-500">Searching</p>
              ) : results.length === 0 ? (
                <p className="p-3 text-sm text-gray-500">No products found</p>
              ) : (
                results.map((product) => {
                  const already = selected.some((p) => p._id === product._id);

                  return (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => addProduct(product)}
                      disabled={already}
                      className="w-full flex items-center gap-3 p-2 text-left border-b last:border-b-0 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <div className="w-9 h-9 shrink-0 rounded border bg-gray-50 overflow-hidden flex items-center justify-center">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageOff size={13} className="text-gray-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          {product.category} · {formatPrice(product.price)}
                        </p>
                      </div>

                      {already ? (
                        <span className="text-xs text-gray-500 shrink-0">
                          Added
                        </span>
                      ) : (
                        <Plus size={16} className="text-gray-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {selected.length > 0 && (
            <div className="mt-4 space-y-2">
              {selected.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 border rounded-lg p-2"
                >
                  <div className="w-9 h-9 shrink-0 rounded border bg-gray-50 overflow-hidden flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageOff size={13} className="text-gray-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      {product.category} · {formatPrice(product.price)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeProduct(product._id)}
                    title="Remove"
                    className="p-1.5 rounded text-red-600 hover:bg-red-100 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="order" className="block mb-1 font-medium text-sm">
              Display order
            </label>
            <input
              id="order"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setField('sortOrder', e.target.value)}
              className="w-full border rounded-lg p-2.5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower numbers appear first.
            </p>
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setField('isPublished', e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm">Visible to customers</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? 'Save changes' : 'Create collection'}
          </button>

          <Link
            to="/admin/collections"
            className="px-5 py-2.5 rounded-lg border hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default CollectionFormPage;