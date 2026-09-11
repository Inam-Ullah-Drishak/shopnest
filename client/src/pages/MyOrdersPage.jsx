import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Package, ChevronRight, Loader2, ImageOff, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import OrderStatus from "../components/OrderStatus.jsx";
import Dropdown from "../components/Dropdown.jsx";
import Pagination from "../components/Pagination.jsx";
import { formatPrice, formatDate } from "../utils/format.js";
import { PAGE_SIZE } from "../utils/constants.js";
import { usePageTitle } from "../hooks/usePageTitle.js";

function MyOrdersPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get("status") || "all";
  const page = Number(searchParams.get("page")) || 1;

  const [orders, setOrders] = useState([]);
  const [pages, setPages] = useState(1);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const filtersActive = status !== "all";
  usePageTitle("Your orders");
  useEffect(() => {
    if (!userInfo) navigate("/login");
  }, [userInfo, navigate]);

  useEffect(() => {
    if (!userInfo) return;

    const fetchOrders = async () => {
      setLoading(true);

      try {
        const { data } = await axios.get("/api/orders/mine", {
          params: { status, pageNumber: page, pageSize: PAGE_SIZE },
        });

        setOrders(data.orders);
        setPages(data.pages);
        setCount(data.count);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load your orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userInfo, status, page]);

  const setParam = (changes) => {
    const next = { status, page: 1, ...changes };

    Object.keys(next).forEach((k) => {
      if (!next[k] || next[k] === "all") delete next[k];
    });

    setSearchParams(next);
  };

  const pageHandler = (n) => {
    setParam({ page: n });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Loading your orders
      </div>
    );
  }

  if (error) return <p className="p-8 text-red-600">{error}</p>;

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Your orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {count} order{count === 1 ? "" : "s"}
            {filtersActive && " matching your filter"}
          </p>
        </div>

        {(count > 0 || filtersActive) && (
          <div className="flex gap-2">
            <Dropdown
              value={status}
              onChange={(v) => setParam({ status: v })}
              options={[
                { value: "all", label: "All orders" },
                { value: "pending", label: "Order received" },
                { value: "confirmed", label: "Confirmed" },
                { value: "processing", label: "Being packed" },
                { value: "shipped", label: "On the way" },
                { value: "delivered", label: "Delivered" },
                { value: "cancelled", label: "Cancelled" },
              ]}
              className="w-44"
              align="right"
            />

            {filtersActive && (
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="inline-flex items-center gap-1.5 border rounded-lg px-3 py-2.5 text-sm hover:bg-gray-50 cursor-pointer"
              >
                <X size={15} />
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="border rounded-lg py-16 text-center">
          <Package size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 font-medium">
            {filtersActive ? "No orders match" : "No orders yet"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {filtersActive
              ? "Try a different filter."
              : "Anything you buy will show up here."}
          </p>

          {filtersActive ? (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="inline-flex items-center gap-2 border px-4 py-2.5 rounded-lg hover:bg-gray-50 mt-5 cursor-pointer"
            >
              <X size={16} />
              Clear filter
            </button>
          ) : (
            <Link
              to="/shop"
              className="inline-block bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 mt-5"
            >
              Start shopping
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order._id}
                to={`/order/${order._id}`}
                className="flex items-center gap-4 border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="hidden sm:flex -space-x-3 shrink-0">
                  {order.orderItems.slice(0, 3).map((item, i) => (
                    <div
                      key={i}
                      className="w-11 h-11 rounded border-2 border-white bg-gray-50 overflow-hidden flex items-center justify-center"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageOff size={13} className="text-gray-300" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium">{formatPrice(order.totalPrice)}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(order.createdAt)} · {order.orderItems.length}{" "}
                    item{order.orderItems.length > 1 ? "s" : ""}
                  </p>
                </div>

                <div className="shrink-0">
                  <OrderStatus status={order.status} customer />
                </div>

                <ChevronRight size={18} className="text-gray-400 shrink-0" />
              </Link>
            ))}
          </div>

          <Pagination page={page} pages={pages} onChange={pageHandler} />
        </>
      )}
    </div>
  );
}

export default MyOrdersPage;
