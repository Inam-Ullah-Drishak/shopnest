import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function ShippingPage() {
  const { shippingAddress, saveShippingAddress, cartItems } = useCart();
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState(shippingAddress?.address || '');
  const [city, setCity] = useState(shippingAddress?.city || '');
  const [postalCode, setPostalCode] = useState(shippingAddress?.postalCode || '');
  const [country, setCountry] = useState(shippingAddress?.country || 'Pakistan');
  const [phone, setPhone] = useState(shippingAddress?.phone || '');

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [userInfo, cartItems, navigate]);

  const submitHandler = (e) => {
    e.preventDefault();
    saveShippingAddress({ address, city, postalCode, country, phone });
    navigate('/placeorder');
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Shipping Address</h1>

      <form onSubmit={submitHandler} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Postal Code</label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Country</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gray-900 text-white p-3 rounded hover:bg-gray-700 cursor-pointer"
        >
          Continue
        </button>
      </form>
    </div>
  );
}

export default ShippingPage;