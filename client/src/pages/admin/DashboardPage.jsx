import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {LineChart,Line,BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,} from 'recharts';
import {Loader2,AlertCircle,TrendingUp,ShoppingBag,Users,Package,AlertTriangle,ImageOff,ChevronRight,} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminNav from '../../components/AdminNav.jsx';
import Dropdown from '../../components/Dropdown.jsx';
import { formatPrice, formatDate } from '../../utils/format.js';
import { usePageTitle } from "../../hooks/usePageTitle.js";

// YYYY-MM-DD for a Date, in the browser's own timezone. toISOString would
// give the UTC date, which is the wrong day for anyone east of Greenwich
// after 7pm.
const dayKey = (date) => {
  const pad = (n) => String(n).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

// Step a whole number of calendar days from a key, via UTC midnights so a
// DST change cannot swallow or repeat a day
const shiftKey = (key, deltaDays) => {
  const [y, m, d] = key.split('-').map(Number);

  return new Date(Date.UTC(y, m - 1, d) + deltaDays * 86400000)
    .toISOString()
    .slice(0, 10);
};
function StatCard({ icon: Icon, label, value, sub, tone = 'default' }) {
  const tones = {
    default: 'text-gray-400',
    warning: 'text-amber-500',
    good: 'text-green-600',
  };

  return (
    <div className="border rounded-lg p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <Icon size={18} className={tones[tone]} />
      </div>

      <p className="text-2xl font-bold mt-2">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function DashboardPage() {
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const [preset, setPreset] = useState('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  usePageTitle('Dashboard');

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) navigate('/login');
  }, [userInfo, navigate]);

  // One window drives every panel. Presets are turned into real dates here
  // rather than sent as a day count, so the server only deals with one shape.
  const { from, to } = useMemo(() => {
    if (preset === 'custom') {
      if (!customFrom || !customTo) return { from: '', to: '' };

      // Picking the end before the start is an easy slip, so read it either way
      return customFrom <= customTo
        ? { from: customFrom, to: customTo }
        : { from: customTo, to: customFrom };
    }

    const end = dayKey(new Date());

    return { from: shiftKey(end, -(Number(preset) - 1)), to: end };
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    // A half-finished custom range would ask for everything; wait for both
    if (!from || !to) return;

    const load = async () => {
      setLoading(true);

      try {
        const range = { from, to };

        // Low stock and recent orders are "right now" panels, so no range
        const [s, r, t, c, l, o] = await Promise.all([
          axios.get('/api/dashboard/summary', { params: range }),
          axios.get('/api/dashboard/revenue', { params: range }),
          axios.get('/api/dashboard/top-products', {
            params: { ...range, limit: 8 },
          }),
          axios.get('/api/dashboard/by-category', { params: range }),
          axios.get('/api/dashboard/low-stock', { params: { limit: 6 } }),
          axios.get('/api/dashboard/recent-orders', { params: { limit: 5 } }),
        ]);

        setSummary(s.data);
        setRevenue(r.data);
        setTopProducts(t.data);
        setByCategory(c.data);
        setLowStock(l.data);
        setRecentOrders(o.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load the dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [from, to]);

  if (loading) {
    return (
      <div className="p-8">
        <AdminNav />
        <div className="flex items-center gap-2 text-gray-500 py-12">
          <Loader2 size={18} className="animate-spin" />
          Loading dashboard
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <AdminNav />
        <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const hasSales = summary.paidOrders > 0;

  // Short labels so a 30-day axis stays readable
  const chartData = revenue.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
    }),
  }));

  return (
    <div className="p-8">
      <AdminNav />

      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {from && to
              ? `${formatDate(from)} to ${formatDate(to)}`
              : 'Pick both dates to see the range'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {preset === 'custom' && (
            <>
              <input
                type="date"
                value={customFrom}
                max={dayKey(new Date())}
                onChange={(e) => setCustomFrom(e.target.value)}
                aria-label="From date"
                className="border rounded-lg px-3 py-2.5 text-sm"
              />

              <input
                type="date"
                value={customTo}
                max={dayKey(new Date())}
                onChange={(e) => setCustomTo(e.target.value)}
                aria-label="To date"
                className="border rounded-lg px-3 py-2.5 text-sm"
              />
            </>
          )}

          <Dropdown
            value={preset}
            onChange={(v) => {
              setPreset(v);

              // Open the custom pickers on the window they were just looking
              // at, so the dashboard does not blank out
              if (v === 'custom' && !customFrom && !customTo) {
                setCustomFrom(from);
                setCustomTo(to);
              }
            }}
            options={[
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' },
              { value: '365', label: 'Last year' },
              { value: 'custom', label: 'Custom range' },
            ]}
            className="w-44"
            align="right"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={TrendingUp}
          label="Revenue"
          value={formatPrice(summary.revenue)}
          sub={`${summary.paidOrders} paid order${
            summary.paidOrders === 1 ? '' : 's'
          }`}
          tone="good"
        />

        <StatCard
          icon={ShoppingBag}
          label="Orders"
          value={summary.totalOrders}
          sub={`${summary.pendingOrders} awaiting delivery`}
        />

        <StatCard
          icon={Users}
          label="Customers"
          value={summary.customers}
          sub={`${summary.reviews} reviews left`}
        />

        <StatCard
          icon={summary.lowStock > 0 ? AlertTriangle : Package}
          label="Products"
          value={summary.products}
          sub={
            summary.lowStock > 0
              ? `${summary.lowStock} running low`
              : 'Stock levels healthy'
          }
          tone={summary.lowStock > 0 ? 'warning' : 'default'}
        />
      </div>

      {hasSales ? (
        <div className="border rounded-lg p-5 mb-8">
          <div className="flex flex-wrap justify-between items-baseline gap-2 mb-5">
            <h2 className="font-bold">Revenue</h2>
            <p className="text-sm text-gray-500">
              Average order {formatPrice(summary.averageOrderValue)} ·{' '}
              {summary.itemsSold} items sold
            </p>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 1000 ? `${Math.round(v / 1000)}k` : v
                }
              />
              <Tooltip
                formatter={(value, name) =>
                  name === 'revenue' ? formatPrice(value) : value
                }
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#111827"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="border rounded-lg py-16 text-center mb-8">
          <TrendingUp size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 font-medium">No sales yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Charts appear once orders start coming in. Place a test order and
            mark it delivered to see this fill up.
          </p>
        </div>
      )}

      {hasSales && (
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="border rounded-lg p-5">
            <h2 className="font-bold mb-5">Best sellers</h2>

            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${Math.round(v / 1000)}k` : v
                  }
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={110}
                  tickFormatter={(v) =>
                    v.length > 18 ? `${v.slice(0, 18)}…` : v
                  }
                />
                <Tooltip formatter={(value) => formatPrice(value)} />
                <Bar dataKey="revenue" fill="#111827" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border rounded-lg p-5">
            <h2 className="font-bold mb-5">By category</h2>

            {byCategory.length === 0 ? (
              <p className="text-sm text-gray-500">Nothing sold yet.</p>
            ) : (
              <div className="space-y-3">
                {byCategory.slice(0, 8).map((row) => {
                  const max = byCategory[0].revenue || 1;
                  const percent = (row.revenue / max) * 100;

                  return (
                    <div key={row.category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate">{row.category}</span>
                        <span className="text-gray-500 shrink-0 ml-3">
                          {formatPrice(row.revenue)}
                        </span>
                      </div>

                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-navy"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-5">
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="font-bold">Running low</h2>
            <Link
              to="/admin/products?stock=low"
              className="text-sm text-gray-600 hover:text-navy"
            >
              See all
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">Everything is well stocked.</p>
          ) : (
            <div className="space-y-2">
              {lowStock.map((product) => (
                <Link
                  key={product._id}
                  to={`/admin/product/${product._id}/edit`}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                >
                  <div className="w-9 h-9 shrink-0 rounded border bg-gray-50 overflow-hidden flex items-center justify-center">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageOff size={13} className="text-gray-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      {product.categoryName}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {product.lowVariants?.length > 0 ? (
                      <div className="space-y-0.5">
                        {product.lowVariants.slice(0, 2).map((v) => (
                          <p
                            key={v.label}
                            className={`text-xs px-2 py-0.5 rounded ${
                              v.countInStock === 0
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {v.label}: {v.countInStock}
                          </p>
                        ))}

                        {product.lowVariants.length > 2 && (
                          <p className="text-xs text-gray-400">
                            +{product.lowVariants.length - 2} more
                          </p>
                        )}
                      </div>
                    ) : (
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          product.countInStock === 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {product.countInStock === 0
                          ? 'Out'
                          : `${product.countInStock} left`}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-5">
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="font-bold">Recent orders</h2>
            <Link
              to="/admin/orders"
              className="text-sm text-gray-600 hover:text-navy"
            >
              See all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <Link
                  key={order._id}
                  to={`/order/${order._id}`}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {order.user?.name || 'Deleted user'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.createdAt)} · {order.orderItems.length}{' '}
                      item{order.orderItems.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  <span className="text-sm font-medium shrink-0">
                    {formatPrice(order.totalPrice)}
                  </span>

                  <ChevronRight size={16} className="text-gray-400 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;