import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function WishlistButton({ productId, size = 18, className = '' }) {
  const { has, toggle } = useWishlist();
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [bump, setBump] = useState(false);

  const saved = has(productId);

  const clickHandler = async (e) => {
    // Cards wrap this in a Link, so stop the navigation
    e.preventDefault();
    e.stopPropagation();

    if (!userInfo) {
      navigate('/login');
      return;
    }

    if (!saved) {
      setBump(true);
      setTimeout(() => setBump(false), 250);
    }

    await toggle(productId);
  };

  return (
    <button
      type="button"
      onClick={clickHandler}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      aria-pressed={saved}
      title={saved ? 'Saved' : 'Save for later'}
      className={`inline-flex items-center justify-center rounded-full transition cursor-pointer ${className}`}
    >
      <Heart
        size={size}
        className={`transition-transform duration-200 ${
          bump ? 'scale-125' : 'scale-100'
        } ${
          saved
            ? 'text-red-500 fill-red-500'
            : 'text-gray-400 hover:text-red-500'
        }`}
      />
    </button>
  );
}

export default WishlistButton;