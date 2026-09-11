/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Loader2, MessageSquare, BadgeCheck, Trash2, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import StarRating from "./StarRating.jsx";
import Dropdown from "./Dropdown.jsx";
import Pagination from "./Pagination.jsx";
import { formatDate } from "../utils/format.js";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";

function ReviewForm({ productId, onDone }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Pick a star rating");
      return;
    }

    setError("");
    setSaving(true);

    try {
      await axios.post(`/api/products/${productId}/reviews`, {
        rating,
        title,
        body,
      });

      onDone();
    } catch (err) {
      setError(err.response?.data?.message || "Could not post your review");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="border rounded-lg p-4 space-y-4">
      <p className="font-medium">Write a review</p>

      {error && (
        <p className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded text-sm">
          {error}
        </p>
      )}

      <div>
        <p className="text-sm mb-1.5">Your rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className="cursor-pointer"
            >
              <Star
                size={24}
                className={
                  (hover || rating) >= n
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-300"
                }
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="rv-title" className="block text-sm mb-1">
          Title
        </label>
        <input
          id="rv-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sums up your experience"
          className="w-full border rounded-lg p-2.5 text-sm"
        />
      </div>

      <div>
        <label htmlFor="rv-body" className="block text-sm mb-1">
          Your review
        </label>
        <textarea
          id="rv-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows="4"
          placeholder="How is the quality? Did it match the photos?"
          className="w-full border rounded-lg p-2.5 text-sm"
          required
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 cursor-pointer"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        Post review
      </button>
    </form>
  );
}

function ProductReviews({ productId, rating, numReviews }) {
  const { userInfo } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [distribution, setDistribution] = useState({});
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [starFilter, setStarFilter] = useState(0);

  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await axios.get(`/api/products/${productId}/reviews`, {
        params: {
          pageNumber: page,
          sort,
          rating: starFilter || undefined,
        },
      });

      setReviews(data.reviews);
      setDistribution(data.distribution);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load reviews");
    } finally {
      setLoading(false);
    }
  }, [productId, page, sort, starFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!userInfo) {
      setMyReview(null);
      return;
    }

    axios
      .get(`/api/products/${productId}/reviews/mine`)
      .then(({ data }) => setMyReview(data))
      .catch(() => setMyReview(null));
  }, [productId, userInfo]);

  const deleteHandler = async (id) => {
    const ok = await confirm({
      title: "Delete this review?",
      message: "It will be removed from the product page.",
      confirmLabel: "Delete",
      danger: true,
    });

    if (!ok) return;

    try {
      await axios.delete(`/api/reviews/${id}`);
      if (myReview?._id === id) setMyReview(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete this review");
    }
  };

  const onPosted = () => {
    setMyReview({ pending: true });
    setPage(1);
    setSort("newest");
    setStarFilter(0);
    load();
  };

  return (
    <section className="border-t mt-12 pt-10">
      <h2 className="text-2xl font-bold mb-6">Reviews</h2>

      {error && (
        <p className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-6 text-sm">
          {error}
        </p>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div>
          <div className="border rounded-lg p-5">
            <p className="text-4xl font-bold">
              {numReviews > 0 ? rating.toFixed(1) : "—"}
            </p>

            <div className="mt-2">
              <StarRating value={rating} size={16} showCount={false} />
            </div>

            <p className="text-sm text-gray-500 mt-2">
              {numReviews > 0
                ? `Based on ${numReviews} review${numReviews === 1 ? "" : "s"}`
                : "No reviews yet"}
            </p>

            {total > 0 && (
              <div className="mt-5 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const n = distribution[star] || 0;
                  const percent = total ? (n / total) * 100 : 0;
                  const active = starFilter === star;

                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setStarFilter(active ? 0 : star);
                        setPage(1);
                      }}
                      className={`w-full flex items-center gap-2 text-sm cursor-pointer rounded px-1 py-0.5 ${
                        active ? "bg-gray-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="w-3 text-gray-600">{star}</span>
                      <Star
                        size={12}
                        className="text-amber-400 fill-amber-400"
                      />

                      <span className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <span
                          className="block h-full bg-amber-400"
                          style={{ width: `${percent}%` }}
                        />
                      </span>

                      <span className="w-8 text-right text-xs text-gray-500">
                        {n}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {starFilter > 0 && (
              <button
                type="button"
                onClick={() => {
                  setStarFilter(0);
                  setPage(1);
                }}
                className="text-sm text-blue-600 hover:underline mt-3 cursor-pointer"
              >
                Show all reviews
              </button>
            )}
          </div>

          <div className="mt-4">
            {!userInfo ? (
              <p className="text-sm text-gray-600">
                <Link to="/login" className="text-blue-600 hover:underline">
                  Sign in
                </Link>{" "}
                to write a review.
              </p>
            ) : myReview ? (
              <p className="text-sm text-gray-600">
                You have already reviewed this product.
              </p>
            ) : (
              <ReviewForm productId={productId} onDone={onPosted} />
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500 py-8">
              <Loader2 size={18} className="animate-spin" />
              Loading reviews
            </div>
          ) : reviews.length === 0 ? (
            <div className="border rounded-lg py-12 text-center">
              <MessageSquare size={32} className="mx-auto text-gray-300" />
              <p className="mt-3 font-medium">
                {starFilter ? "No reviews with that rating" : "No reviews yet"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {starFilter
                  ? "Try a different star filter."
                  : "Be the first to share your thoughts."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Dropdown
                  value={sort}
                  onChange={(v) => {
                    setSort(v);
                    setPage(1);
                  }}
                  options={[
                    { value: "newest", label: "Newest first" },
                    { value: "oldest", label: "Oldest first" },
                    { value: "rating-desc", label: "Highest rated" },
                    { value: "rating-asc", label: "Lowest rated" },
                  ]}
                  className="w-44"
                  align="right"
                />
              </div>

              <div className="space-y-4">
                {reviews.map((review) => {
                  const canDelete =
                    userInfo &&
                    (userInfo.isAdmin ||
                      (review.user &&
                        String(review.user) === String(userInfo._id)));

                  return (
                    <div key={review._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{review.author}</p>

                            {review.verifiedPurchase && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-700">
                                <BadgeCheck size={13} />
                                Verified purchase
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500">
                            {review.city && `${review.city} · `}
                            {formatDate(review.createdAt)}
                          </p>
                        </div>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteHandler(review._id)}
                            title="Delete review"
                            className="p-1.5 rounded text-red-600 hover:bg-red-100 cursor-pointer shrink-0"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      <div className="mt-2">
                        <StarRating
                          value={review.rating}
                          size={14}
                          showCount={false}
                        />
                      </div>

                      {review.title && (
                        <p className="font-medium mt-2">{review.title}</p>
                      )}

                      <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                        {review.body}
                      </p>
                    </div>
                  );
                })}
              </div>

              <Pagination page={page} pages={pages} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default ProductReviews;
