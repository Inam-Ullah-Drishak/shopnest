import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, Loader2, MapPin, Plus, Star, Trash2, X } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

const EMPTY_FORM = {
  label: '',
  address: '',
  city: '',
  postalCode: '',
  country: 'Pakistan',
  phone: '',
};

function ShippingPage() {
  const { shippingAddress, saveShippingAddress, cartItems } = useCart();
  const { userInfo } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();

  usePageTitle('Shipping');

  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // If the address book can't be reached, this page falls back to the plain
  // form it used to be so checkout is never blocked by it
  const [bookFailed, setBookFailed] = useState(false);

  // The form doubles as "add new" and "edit this one"; editingId says which
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [userInfo, cartItems, navigate]);

  // Captured once at mount, which is exactly what "the address they used
  // last" means here. Not reassigned, so saving does not retrigger the load.
  const shippingRef = useRef(shippingAddress);

  useEffect(() => {
    if (!userInfo) return;

    let active = true;

    const load = async () => {
      try {
        const { data } = await axios.get('/api/users/addresses');

        if (!active) return;

        setAddresses(data);

        // Prefer the one they used last, then their default, then the first
        const last = shippingRef.current;

        const previous = data.find(
          (entry) =>
            last &&
            entry.address === last.address &&
            entry.city === last.city
        );

        const preferred =
          previous || data.find((entry) => entry.isDefault) || data[0];

        setSelectedId(preferred ? preferred._id : null);

        // Nothing saved yet, so go straight to the form
        setShowForm(data.length === 0);
      } catch {
        if (!active) return;

        setBookFailed(true);
        setShowForm(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [userInfo]);
  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setError('');
  };

  const openEdit = (entry) => {
    setForm({
      label: entry.label || '',
      address: entry.address,
      city: entry.city,
      postalCode: entry.postalCode,
      country: entry.country,
      phone: entry.phone,
    });
    setEditingId(entry._id);
    setShowForm(true);
    setError('');
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const { data } = editingId
        ? await axios.put(`/api/users/addresses/${editingId}`, form)
        : await axios.post('/api/users/addresses', form);

      setAddresses(data);
      setShowForm(false);

      // Land on whatever was just written
      const match = data.find(
        (entry) => entry.address === form.address.trim() && entry.city === form.city.trim()
      );

      if (match) setSelectedId(match._id);

      setEditingId(null);
      toast?.success(editingId ? 'Address updated' : 'Address saved');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save that address');
    } finally {
      setSaving(false);
    }
  };

  const removeAddress = async (entry) => {
    const ok = await confirm({
      title: 'Remove this address?',
      message: `${entry.address}, ${entry.city}`,
      confirmLabel: 'Remove',
      danger: true,
    });

    if (!ok) return;

    try {
      const { data } = await axios.delete(`/api/users/addresses/${entry._id}`);

      setAddresses(data);

      if (selectedId === entry._id) {
        const fallback = data.find((a) => a.isDefault) || data[0];
        setSelectedId(fallback ? fallback._id : null);
      }

      if (data.length === 0) setShowForm(true);

      toast?.success('Address removed');
    } catch (err) {
      toast?.error(err.response?.data?.message || 'Could not remove that one');
    }
  };

  const makeDefault = async (entry) => {
    try {
      const { data } = await axios.put(
        `/api/users/addresses/${entry._id}/default`
      );

      setAddresses(data);
      toast?.success('Default address updated');
    } catch (err) {
      toast?.error(err.response?.data?.message || 'Could not update that');
    }
  };

  // Checkout copies the fields it needs; the saved entry itself is untouched
  const continueHandler = () => {
    const chosen = addresses.find((entry) => entry._id === selectedId);

    if (!chosen) {
      setError('Choose an address, or add a new one');
      return;
    }

    saveShippingAddress({
      address: chosen.address,
      city: chosen.city,
      postalCode: chosen.postalCode,
      country: chosen.country,
      phone: chosen.phone,
    });

    navigate('/placeorder');
  };

  // Used when the address book is unavailable: save straight to the cart,
  // exactly as this page behaved before there were saved addresses
  const continueWithFormOnly = (e) => {
    e.preventDefault();

    saveShippingAddress({
      address: form.address,
      city: form.city,
      postalCode: form.postalCode,
      country: form.country,
      phone: form.phone,
    });

    navigate('/placeorder');
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-4 flex items-center gap-2 text-gray-500 py-12">
        <Loader2 size={18} className="animate-spin" />
        Loading your addresses
      </div>
    );
  }

  const field = (label, key, type = 'text', required = true) => (
    <div>
      <label htmlFor={key} className="block mb-1 font-medium text-sm">
        {label}
      </label>

      <input
        id={key}
        type={type}
        value={form[key]}
        onChange={(e) => setField(key, e.target.value)}
        required={required}
        className="w-full border rounded-lg p-2.5 text-sm"
      />
    </div>
  );

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Shipping address</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-5 text-sm">
          {error}
        </div>
      )}

      {addresses.length > 0 && (
        <div className="space-y-3 mb-5">
          {addresses.map((entry) => {
            const active = entry._id === selectedId;

            return (
              <div
                key={entry._id}
                className={`border rounded-lg p-4 ${
                  active ? 'border-navy bg-navy/5' : ''
                }`}
              >
                <label className="flex gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="address"
                    checked={active}
                    onChange={() => setSelectedId(entry._id)}
                    className="mt-1 accent-navy"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {entry.label || entry.city}
                      </span>

                      {entry.isDefault && (
                        <span className="text-xs bg-amber text-navy font-medium px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mt-1">
                      {entry.address}, {entry.city} {entry.postalCode}
                    </p>

                    <p className="text-sm text-gray-500">
                      {entry.country} · {entry.phone}
                    </p>
                  </div>
                </label>

                <div className="flex flex-wrap gap-4 mt-3 pl-7 text-sm">
                  <button
                    type="button"
                    onClick={() => openEdit(entry)}
                    className="text-teal hover:underline cursor-pointer"
                  >
                    Edit
                  </button>

                  {!entry.isDefault && (
                    <button
                      type="button"
                      onClick={() => makeDefault(entry)}
                      className="inline-flex items-center gap-1 text-gray-600 hover:text-navy cursor-pointer"
                    >
                      <Star size={14} />
                      Make default
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeAddress(entry)}
                    className="inline-flex items-center gap-1 text-gray-600 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm ? (
        <form
          onSubmit={bookFailed ? continueWithFormOnly : saveAddress}
          className="border rounded-lg p-4 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold">
              {editingId ? 'Edit address' : 'New address'}
            </h2>

            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setError('');
                }}
                aria-label="Cancel"
                className="p-1 rounded text-gray-400 hover:text-navy cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div>
            <label htmlFor="label" className="block mb-1 font-medium text-sm">
              Name it <span className="text-gray-400">(optional)</span>
            </label>

            <input
              id="label"
              type="text"
              value={form.label}
              onChange={(e) => setField('label', e.target.value)}
              placeholder="Home, office, mum's place"
              className="w-full border rounded-lg p-2.5 text-sm"
            />
          </div>

          {field('Address', 'address')}
          {field('City', 'city')}
          {field('Postal code', 'postalCode')}
          {field('Country', 'country')}
          {field('Phone', 'phone', 'tel')}

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 bg-navy text-white p-3 rounded-lg hover:bg-navy-dark disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            {bookFailed
              ? 'Continue'
              : editingId
                ? 'Save changes'
                : 'Save address'}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={openNew}
          className="w-full inline-flex items-center justify-center gap-2 border border-dashed rounded-lg p-3 text-sm text-gray-600 hover:text-navy hover:border-navy cursor-pointer"
        >
          <Plus size={16} />
          Add another address
        </button>
      )}

      {addresses.length > 0 && (
        <button
          type="button"
          onClick={continueHandler}
          className="w-full inline-flex items-center justify-center gap-2 bg-navy text-white p-3 rounded-lg hover:bg-navy-dark mt-5 cursor-pointer"
        >
          <MapPin size={16} />
          Deliver here
        </button>
      )}
    </div>
  );
}

export default ShippingPage;