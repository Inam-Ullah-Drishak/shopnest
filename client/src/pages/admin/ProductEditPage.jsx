import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext.jsx';

function ProductEditPage() {
  const { id } = useParams();
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState('');
  const [countInStock, setCountInStock] = useState(0);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login');
      return;
    }

    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`/api/products/${id}`);
        setName(data.name);
        setDescription(data.description);
        setPrice(data.price);
        setCategory(data.category);
        setCountInStock(data.countInStock);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, userInfo, navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await axios.put(`/api/products/${id}`, {
        name,
        description,
        price: Number(price),
        category,
        countInStock: Number(countInStock),
      });

      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-8">Loading...</p>;

  return (
    <div className="max-w-md mx-auto p-8">
      <Link to="/admin/products" className="text-blue-600 underline">
        Back
      </Link>

      <h1 className="text-3xl font-bold mt-4 mb-6">Edit Product</h1>

      {error && (
        <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>
      )}

      <form onSubmit={submitHandler} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Price</label>
          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Count In Stock</label>
          <input
            type="number"
            min="0"
            value={countInStock}
            onChange={(e) => setCountInStock(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gray-900 text-white p-3 rounded hover:bg-gray-700 disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Update'}
        </button>
      </form>
    </div>
  );
}

export default ProductEditPage;