import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Heart, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import ProductCard from "../components/ProductCard.jsx";
import Pagination from "../components/Pagination.jsx";
import { PAGE_SIZE } from "../utils/constants.js";
import { usePageTitle } from "../hooks/usePageTitle.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";

function WishlistPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { userInfo } = useAuth();
  const { ids, clear } = useWishlist();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;

  const [fetched, setFetched] = useState([]);
  const [pages, setPages] = useState(1);
  const [, setCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  usePageTitle("Saved items");
  useEffect(() => {
    if (!userInfo) navigate("/login");
  }, [userInfo, navigate]);

  useEffect(() => {
    if (!userInfo) return;

    const load = async () => {
      setLoading(true);

      try {
        const { data } = await axios.get("/api/wishlist", {
          params: { pageNumber: page, pageSize: PAGE_SIZE },
        });

        setFetched(data.products);
        setPages(data.pages);
        setCount(data.count);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load your wishlist");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userInfo, page]);

  // Derived, not stored: unhearting removes the card immediately without
  // needing an effect to sync two pieces of state
  const products = fetched.filter((p) => ids.has(p._id));

  const pageHandler = (n) => {
    setSearchParams({ page: n });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearHandler = async () => {
    const ok = await confirm({
      title: "Remove everything from your wishlist?",
      message: "You can always save things again later.",
      confirmLabel: "Remove all",
      danger: true,
    });

    if (!ok) return;

    await clear();
    toast.success("Wishlist cleared");
    setFetched([]);
    setCount(0);
    setPages(1);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Loading your wishlist
      </div>
    );
  }

  if (error) return <p className="p-8 text-red-600">{error}</p>;

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Saved items</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {ids.size} item{ids.size === 1 ? "" : "s"}
          </p>
        </div>

        {ids.size > 0 && (
          <button
            type="button"
            onClick={clearHandler}
            className="inline-flex items-center gap-1.5 border rounded-lg px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 size={15} />
            Clear all
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="border rounded-lg py-16 text-center">
          <Heart size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 font-medium">Nothing saved yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Tap the heart on anything you like and it will show up here.
          </p>
          <Link
            to="/shop"
            className="inline-block bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 mt-5"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          <Pagination page={page} pages={pages} onChange={pageHandler} />
        </>
      )}
    </div>
  );
}

export default WishlistPage;
