import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Tags,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminNav from '../../components/AdminNav.jsx';

function CategoryListPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login');
      return;
    }

    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/api/categories');
        setCategories(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [userInfo, navigate]);

  const createHandler = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setError('');
    setCreating(true);

    try {
      const { data } = await axios.post('/api/categories', {
        name: newName.trim(),
      });

      setCategories((prev) =>
        [...prev, { ...data, productCount: 0 }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setNewName('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create this category');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (category) => {
    setEditingId(category._id);
    setEditName(category.name);
    setError('');
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) return;

    setSavingId(id);
    setError('');

    try {
      const { data } = await axios.put(`/api/categories/${id}`, {
        name: editName.trim(),
      });

      setCategories((prev) =>
        prev
          .map((c) => (c._id === id ? { ...c, ...data } : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this category');
    } finally {
      setSavingId(null);
    }
  };

  const deleteHandler = async (category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) return;

    setDeletingId(category._id);
    setError('');

    try {
      await axios.delete(`/api/categories/${category._id}`);
      setCategories((prev) => prev.filter((c) => c._id !== category._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this category');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8">
      <AdminNav />

      <div className="mb-5">
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Each product belongs to one category. Rename a category and every
          product using it updates too.
        </p>
      </div>

      <form onSubmit={createHandler} className="flex gap-2 mb-6 max-w-md">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="flex-1 border rounded-lg p-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 cursor-pointer"
        >
          {creating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Add
        </button>
      </form>

      {error && (
        <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-6">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-12">
          <Loader2 size={18} className="animate-spin" />
          Loading categories
        </div>
      ) : categories.length === 0 ? (
        <div className="border rounded-lg py-16 text-center">
          <Tags size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 font-medium">No categories yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Add one above to start organising products.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Slug</th>
                <th className="p-3 font-medium">Products</th>
                <th className="p-3"></th>
              </tr>
            </thead>

            <tbody>
              {categories.map((category) => (
                <tr key={category._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    {editingId === category._id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(category._id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="border rounded p-1.5 w-full max-w-56"
                      />
                    ) : (
                      <span className="font-medium">{category.name}</span>
                    )}
                  </td>

                  <td className="p-3 text-gray-500 font-mono text-xs">
                    {category.slug}
                  </td>

                  <td className="p-3 text-gray-600">
                    {category.productCount ?? 0}
                  </td>

                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      {editingId === category._id ? (
                        <>
                          <button
                            onClick={() => saveEdit(category._id)}
                            disabled={savingId === category._id}
                            title="Save"
                            className="p-2 rounded hover:bg-green-100 text-green-700 disabled:opacity-50 cursor-pointer"
                          >
                            {savingId === category._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Check size={16} />
                            )}
                          </button>

                          <button
                            onClick={() => setEditingId(null)}
                            title="Cancel"
                            className="p-2 rounded hover:bg-gray-200 text-gray-600 cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(category)}
                            title="Rename"
                            className="p-2 rounded hover:bg-gray-200 text-gray-600 cursor-pointer"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => deleteHandler(category)}
                            disabled={
                              deletingId === category._id ||
                              category.productCount > 0
                            }
                            title={
                              category.productCount > 0
                                ? 'Move its products first'
                                : 'Delete'
                            }
                            className="p-2 rounded hover:bg-red-100 text-red-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {deletingId === category._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CategoryListPage;