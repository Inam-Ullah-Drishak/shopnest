/* eslint-disable react-hooks/set-state-in-effect */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext();

// Stable reference so signed-out renders don't create a new Set each time
const EMPTY = new Set();

export function WishlistProvider({ children }) {
  const { userInfo } = useAuth();
  const userId = userInfo?._id || null;

  const [saved, setSaved] = useState(() => new Set());

  // Signed out means empty, derived rather than cleared in an effect
  const ids = userId ? saved : EMPTY;

  const refresh = useCallback(async () => {
    if (!userId) return;

    try {
      const { data } = await axios.get('/api/wishlist/ids');
      setSaved(new Set(data));
    } catch {
      setSaved(new Set());
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const has = useCallback((productId) => ids.has(productId), [ids]);

  const toggle = useCallback(
    async (productId) => {
      if (!userId) return { needsLogin: true };

      const isSaved = ids.has(productId);

      // Update immediately, roll back if the request fails
      setSaved((prev) => {
        const next = new Set(prev);
        if (isSaved) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        if (isSaved) {
          await axios.delete(`/api/wishlist/${productId}`);
        } else {
          await axios.post(`/api/wishlist/${productId}`);
        }

        return { saved: !isSaved };
      } catch {
        setSaved((prev) => {
          const next = new Set(prev);
          if (isSaved) next.add(productId);
          else next.delete(productId);
          return next;
        });

        return { error: true };
      }
    },
    [userId, ids]
  );

  const clear = useCallback(async () => {
    const previous = saved;
    setSaved(new Set());

    try {
      await axios.delete('/api/wishlist');
    } catch {
      setSaved(previous);
    }
  }, [saved]);

  return (
    <WishlistContext.Provider
      value={{ ids, count: ids.size, has, toggle, clear, refresh }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
  return useContext(WishlistContext);
}