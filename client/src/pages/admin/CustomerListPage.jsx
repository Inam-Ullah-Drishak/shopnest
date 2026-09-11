import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Loader2,
  AlertCircle,
  Users,
  Search,
  X,
  Shield,
  Ban,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminNav from "../../components/AdminNav.jsx";
import Dropdown from "../../components/Dropdown.jsx";
import Pagination from "../../components/Pagination.jsx";
import { formatPrice, formatDate } from "../../utils/format.js";
import { PAGE_SIZE } from "../../utils/constants.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";

function CustomerListPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get("keyword") || "";
  const role = searchParams.get("role") || "all";
  const sort = searchParams.get("sort") || "newest";
  const page = Number(searchParams.get("page")) || 1;

  const [searchInput, setSearchInput] = useState(keyword);
  const [lastKeyword, setLastKeyword] = useState(keyword);

  if (keyword !== lastKeyword) {
    setLastKeyword(keyword);
    setSearchInput(keyword);
  }

  const [customers, setCustomers] = useState([]);
  const [pages, setPages] = useState(1);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  usePageTitle("Customers");
  const filtersActive = keyword || role !== "all" || sort !== "newest";

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) navigate("/login");
  }, [userInfo, navigate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const { data } = await axios.get("/api/customers", {
          params: {
            keyword,
            role,
            sort,
            pageNumber: page,
            pageSize: PAGE_SIZE,
          },
        });

        setCustomers(data.customers);
        setPages(data.pages);
        setCount(data.count);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load customers");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [keyword, role, sort, page]);

  const setParam = (changes) => {
    const next = { keyword, role, sort, page: 1, ...changes };

    Object.keys(next).forEach((k) => {
      if (!next[k] || next[k] === "all") delete next[k];
    });

    setSearchParams(next);
  };

  const patch = (updated) =>
    setCustomers((prev) =>
      prev.map((c) => (c._id === updated._id ? { ...c, ...updated } : c)),
    );

  const roleHandler = async (customer) => {
    const making = !customer.isAdmin;

    if (
      !window.confirm(
        making
          ? `Give ${customer.name} full admin access?`
          : `Remove admin access from ${customer.name}?`,
      )
    )
      return;

    setBusyId(customer._id);
    setError("");

    try {
      const { data } = await axios.put(`/api/customers/${customer._id}/role`, {
        isAdmin: making,
      });

      patch(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not change the role");
    } finally {
      setBusyId(null);
    }
  };

  const blockHandler = async (customer) => {
    const blocking = !customer.isBlocked;

    if (
      !window.confirm(
        blocking
          ? `Suspend ${customer.name}? They will not be able to sign in.`
          : `Restore access for ${customer.name}?`,
      )
    )
      return;

    setBusyId(customer._id);
    setError("");

    try {
      const { data } = await axios.put(`/api/customers/${customer._id}/block`, {
        isBlocked: blocking,
      });

      patch(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update this account");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-8">
      <AdminNav />

      <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? "Loading" : `${count} account${count === 1 ? "" : "s"}`}
            {filtersActive && !loading && " matching your filters"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam({ keyword: searchInput });
          }}
          className="relative flex-1 min-w-56"
        >
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email"
            className="w-full border rounded-lg py-2.5 pl-9 pr-3 text-sm"
          />
        </form>

        <Dropdown
          value={role}
          onChange={(v) => setParam({ role: v })}
          options={[
            { value: "all", label: "Everyone" },
            { value: "customer", label: "Customers" },
            { value: "admin", label: "Admins" },
            { value: "blocked", label: "Suspended" },
          ]}
          className="w-40"
        />

        <Dropdown
          value={sort}
          onChange={(v) => setParam({ sort: v })}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "name-asc", label: "Name A–Z" },
            { value: "spend-desc", label: "Highest spend" },
            { value: "orders-desc", label: "Most orders" },
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

      {error && (
        <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-6">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-12">
          <Loader2 size={18} className="animate-spin" />
          Loading customers
        </div>
      ) : customers.length === 0 ? (
        <div className="border rounded-lg py-16 text-center">
          <Users size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 font-medium">
            {filtersActive ? "No accounts match" : "No customers yet"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {filtersActive
              ? "Try a different search or filter."
              : "Accounts appear here as people register."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="p-3 font-medium">Customer</th>
                  <th className="p-3 font-medium">Joined</th>
                  <th className="p-3 font-medium">Orders</th>
                  <th className="p-3 font-medium">Lifetime spend</th>
                  <th className="p-3 font-medium">Last order</th>
                  <th className="p-3"></th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => {
                  const isSelf = customer._id === userInfo?._id;
                  const busy = busyId === customer._id;

                  return (
                    <tr
                      key={customer._id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium truncate">
                                {customer.name}
                              </p>

                              {customer.isAdmin && (
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                                  <Shield size={11} />
                                  Admin
                                </span>
                              )}

                              {customer.isBlocked && (
                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">
                                  <Ban size={11} />
                                  Suspended
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-gray-500 truncate">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-gray-600 whitespace-nowrap">
                        {formatDate(customer.createdAt)}
                      </td>

                      <td className="p-3 text-gray-600">
                        {customer.orderCount || 0}
                      </td>

                      <td className="p-3 font-medium whitespace-nowrap">
                        {formatPrice(customer.totalSpent || 0)}
                      </td>

                      <td className="p-3 text-gray-600 whitespace-nowrap">
                        {customer.lastOrderAt ? (
                          formatDate(customer.lastOrderAt)
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex gap-1 justify-end items-center">
                          {!isSelf && (
                            <>
                              <button
                                onClick={() => roleHandler(customer)}
                                disabled={busy}
                                title={
                                  customer.isAdmin
                                    ? "Remove admin access"
                                    : "Make admin"
                                }
                                className={`p-2 rounded disabled:opacity-50 cursor-pointer ${
                                  customer.isAdmin
                                    ? "text-blue-600 hover:bg-blue-100"
                                    : "text-gray-400 hover:bg-gray-200"
                                }`}
                              >
                                {busy ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Shield size={16} />
                                )}
                              </button>

                              <button
                                onClick={() => blockHandler(customer)}
                                disabled={busy || customer.isAdmin}
                                title={
                                  customer.isAdmin
                                    ? "Remove admin access first"
                                    : customer.isBlocked
                                      ? "Restore access"
                                      : "Suspend account"
                                }
                                className={`p-2 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
                                  customer.isBlocked
                                    ? "text-red-600 hover:bg-red-100"
                                    : "text-gray-400 hover:bg-red-100 hover:text-red-600"
                                }`}
                              >
                                <Ban size={16} />
                              </button>
                            </>
                          )}

                          <Link
                            to={`/admin/customer/${customer._id}`}
                            title="View customer"
                            className="p-2 rounded hover:bg-gray-200 text-gray-600 inline-flex"
                          >
                            <ChevronRight size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            pages={pages}
            onChange={(n) => setParam({ page: n })}
          />
        </>
      )}
    </div>
  );
}

export default CustomerListPage;
