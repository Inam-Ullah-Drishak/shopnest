/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  LayoutGrid,
  Eye,
  EyeOff,
  ImageOff,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminNav from "../../components/AdminNav.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useConfirm } from "../../context/ConfirmContext.jsx";

function CollectionListPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [collections, setCollections] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  usePageTitle("Collections");
  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate("/login");
      return;
    }

    const fetchCollections = async () => {
      try {
        const { data } = await axios.get("/api/collections");
        setCollections(data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load collections");
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [userInfo, navigate]);

  const deleteHandler = async (collection) => {
    const ok = await confirm({
      title: `Delete "${collection.title}"?`,
      message: "The products in it are not deleted.",
      confirmLabel: "Delete",
      danger: true,
    });

    if (!ok) return;

    setDeletingId(collection._id);
    setError("");

    try {
      await axios.delete(`/api/collections/${collection._id}`);
      setCollections((prev) => prev.filter((c) => c._id !== collection._id));
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not delete this collection",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8">
      <AdminNav />

      <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold">Collections</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Group products for promotions. A product can be in several
            collections.
          </p>
        </div>

        <Link
          to="/admin/collection/new"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700"
        >
          <Plus size={18} />
          New collection
        </Link>
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
          Loading collections
        </div>
      ) : collections.length === 0 ? (
        <div className="border rounded-lg py-16 text-center">
          <LayoutGrid size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 font-medium">No collections yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Create one to feature products together, like a sale or a seasonal
            range.
          </p>
          <Link
            to="/admin/collection/new"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 mt-5"
          >
            <Plus size={18} />
            New collection
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="p-3 font-medium">Collection</th>
                <th className="p-3 font-medium">Products</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>

            <tbody>
              {collections.map((collection) => (
                <tr key={collection._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 shrink-0 rounded border bg-gray-50 overflow-hidden flex items-center justify-center">
                        {collection.image ? (
                          <img
                            src={collection.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageOff size={16} className="text-gray-300" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {collection.title}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          /{collection.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 text-gray-600">
                    {collection.productCount ??
                      collection.products?.length ??
                      0}
                  </td>

                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs ${
                        collection.isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {collection.isPublished ? (
                        <Eye size={13} />
                      ) : (
                        <EyeOff size={13} />
                      )}
                      {collection.isPublished ? "Live" : "Hidden"}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <Link
                        to={`/admin/collection/${collection._id}/edit`}
                        title="Edit"
                        className="p-2 rounded hover:bg-gray-200 text-gray-600"
                      >
                        <Pencil size={16} />
                      </Link>

                      <button
                        onClick={() => deleteHandler(collection)}
                        disabled={deletingId === collection._id}
                        title="Delete"
                        className="p-2 rounded hover:bg-red-100 text-red-600 disabled:opacity-50 cursor-pointer"
                      >
                        {deletingId === collection._id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CollectionListPage;
