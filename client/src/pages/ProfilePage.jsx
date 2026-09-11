import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Package,
  Heart,
  Shield,
  Calendar,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate } from "../utils/format.js";
import { usePageTitle } from "../hooks/usePageTitle.js";

function ProfilePage() {
  const { userInfo, login, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "" });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  usePageTitle("Your profile");
  useEffect(() => {
    if (!userInfo) navigate("/login");
  }, [userInfo, navigate]);

  useEffect(() => {
    if (!userInfo) return;

    const load = async () => {
      try {
        const { data } = await axios.get("/api/users/profile");
        setProfile(data);
        setForm({ name: data.name, email: data.email });
      } catch (err) {
        setError(err.response?.data?.message || "Could not load your profile");

        if (err.response?.status === 401) {
          logout();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userInfo, navigate, logout]);

  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setPassword = (field, value) =>
    setPasswords((prev) => ({ ...prev, [field]: value }));

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    setSaved("");

    const changingPassword = Boolean(passwords.newPassword);

    if (
      changingPassword &&
      passwords.newPassword !== passwords.confirmPassword
    ) {
      setError("The two new passwords do not match");
      return;
    }

    setSaving(true);

    try {
      const { data } = await axios.put("/api/users/profile", {
        name: form.name,
        email: form.email,
        currentPassword: passwords.currentPassword || undefined,
        newPassword: passwords.newPassword || undefined,
      });

      setProfile(data);

      // Keep the header and menu in step with the new name
      login(data);

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSaved(
        changingPassword ? "Your details and password are saved" : "Saved",
      );

      setTimeout(() => setSaved(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save your changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Loading your profile
      </div>
    );
  }

  if (!profile) return <p className="p-8 text-red-600">{error}</p>;

  const dirty =
    form.name !== profile.name ||
    form.email !== profile.email ||
    Boolean(passwords.newPassword);

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="flex items-center gap-4 mb-6">
        <span className="w-14 h-14 shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-xl font-medium text-gray-600">
          {profile.name.charAt(0).toUpperCase()}
        </span>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{profile.name}</h1>

            {profile.isAdmin && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                <Shield size={12} />
                Admin
              </span>
            )}
          </div>

          {profile.createdAt && (
            <p className="text-sm text-gray-500 mt-0.5 inline-flex items-center gap-1.5">
              <Calendar size={14} />
              Member since {formatDate(profile.createdAt)}
            </p>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        <Link
          to="/myorders"
          className="flex items-center gap-3 border rounded-lg p-4 hover:bg-gray-50"
        >
          <Package size={18} className="text-gray-400" />
          <span className="font-medium">Your orders</span>
        </Link>

        <Link
          to="/wishlist"
          className="flex items-center gap-3 border rounded-lg p-4 hover:bg-gray-50"
        >
          <Heart size={18} className="text-gray-400" />
          <span className="font-medium">Saved items</span>
        </Link>
      </div>

      {error && (
        <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-6">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {saved && (
        <div className="flex gap-2 bg-green-50 border border-green-200 text-green-700 p-3 rounded mb-6">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{saved}</p>
        </div>
      )}

      <form onSubmit={submitHandler} className="space-y-6">
        <div className="border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-gray-400" />
            <h2 className="font-bold">Your details</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block mb-1 font-medium text-sm">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="w-full border rounded-lg p-2.5"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block mb-1 font-medium text-sm">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className="w-full border rounded-lg p-2.5"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                You sign in with this address.
              </p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-5">
          <h2 className="font-bold mb-1">Change password</h2>
          <p className="text-sm text-gray-500 mb-4">
            Leave these empty if you are only updating your details.
          </p>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="current"
                className="block mb-1 font-medium text-sm"
              >
                Current password
              </label>
              <input
                id="current"
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPassword("currentPassword", e.target.value)}
                autoComplete="current-password"
                className="w-full border rounded-lg p-2.5"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="newpass"
                  className="block mb-1 font-medium text-sm"
                >
                  New password
                </label>
                <input
                  id="newpass"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPassword("newPassword", e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  className="w-full border rounded-lg p-2.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  At least 6 characters.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirm"
                  className="block mb-1 font-medium text-sm"
                >
                  Confirm new password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPassword("confirmPassword", e.target.value)
                  }
                  autoComplete="new-password"
                  className="w-full border rounded-lg p-2.5"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Save changes
          </button>

          {dirty && (
            <button
              type="button"
              onClick={() => {
                setForm({ name: profile.name, email: profile.email });
                setPasswords({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
                setError("");
              }}
              className="px-5 py-2.5 rounded-lg border hover:bg-gray-50 cursor-pointer"
            >
              Discard
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ProfilePage;
