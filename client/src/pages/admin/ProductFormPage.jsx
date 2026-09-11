import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Upload,
  ImageOff,
  X,
  Star,
  Loader2,
  AlertCircle,
  Link2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import VariantEditor from "../../components/admin/VariantEditor.jsx";
import Dropdown from "../../components/Dropdown.jsx";
import { uploadImages, thumb } from "../../utils/upload.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";

function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    compareAtPrice: "",
    category: "",
    countInStock: "",
    status: "active",
    isFeatured: false,
  });
  usePageTitle(isEdit ? "Edit product" : "New product");
  const [images, setImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [optionTypes, setOptionTypes] = useState([]);
  const [variants, setVariants] = useState([]);

  const [urlInput, setUrlInput] = useState("");
  const [categories, setCategories] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const hasVariants = variants.length > 0;

  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) navigate("/login");
  }, [userInfo, navigate]);

  useEffect(() => {
    axios
      .get("/api/categories")
      .then(({ data }) => setCategories(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;

    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`/api/products/${id}`);

        setForm({
          name: data.name,
          description: data.description,
          price: data.price,
          compareAtPrice: data.compareAtPrice ?? "",
          category: data.categoryName || data.category?.name || "",
          countInStock: data.countInStock,
          status: data.status || "active",
          isFeatured: Boolean(data.isFeatured),
        });

        setImages(data.images || []);
        setTags(data.tags || []);

        setOptionTypes(
          (data.optionTypes || []).map((t) => ({
            name: t.name,
            values: [...t.values],
          })),
        );

        setVariants(
          (data.variants || []).map((v) => ({
            options: v.options.map((o) => ({ name: o.name, value: o.value })),
            sku: v.sku || "",
            price: v.price,
            countInStock: v.countInStock,
            image: v.image || "",
          })),
        );
      } catch (err) {
        setError(err.response?.data?.message || "Could not load this product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, isEdit]);

  const uploadHandler = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setError("");
    setUploading(true);

    try {
      // One request for all of them; the server uploads in parallel
      const urls = await uploadImages(files, "products");
      setImages((prev) => [...prev, ...urls]);
    } catch (err) {
      setError(
        err.response?.data?.message || "Upload failed. Try another file.",
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const addUrlHandler = () => {
    const url = urlInput.trim();
    if (!url) return;

    if (images.includes(url)) {
      setError("That image is already added");
      return;
    }

    setImages((prev) => [...prev, url]);
    setUrlInput("");
    setError("");
  };

  const removeImage = (index) => {
    const removed = images[index];
    setImages((prev) => prev.filter((_, i) => i !== index));

    setVariants((prev) =>
      prev.map((v) => (v.image === removed ? { ...v, image: "" } : v)),
    );
  };

  const makePrimary = (index) =>
    setImages((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || tags.includes(tag)) {
      setTagInput("");
      return;
    }

    setTags((prev) => [...prev, tag]);
    setTagInput("");
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");

    if (hasVariants && variants.some((v) => v.price <= 0)) {
      setError("Every variant needs a price above zero");
      return;
    }

    setSaving(true);

    const basePrice = hasVariants
      ? Math.min(...variants.map((v) => v.price))
      : Number(form.price) || 0;

    const payload = {
      name: form.name,
      description: form.description,
      price: basePrice,
      compareAtPrice:
        form.compareAtPrice === "" ? null : Number(form.compareAtPrice),
      category: form.category,
      countInStock: hasVariants
        ? variants.reduce((sum, v) => sum + v.countInStock, 0)
        : Number(form.countInStock) || 0,
      images,
      tags,
      status: form.status,
      isFeatured: form.isFeatured,
      optionTypes: hasVariants
        ? optionTypes.filter((t) => t.name.trim() && t.values.length > 0)
        : [],
      variants,
    };

    try {
      if (isEdit) {
        await axios.put(`/api/products/${id}`, payload);
      } else {
        await axios.post("/api/products", payload);
      }

      navigate("/admin/products");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save this product");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Loading product
      </div>
    );
  }

  // Nested categories, indented so the tree is readable in a flat dropdown
  const categoryOptions = [
    { value: "", label: "Choose a category" },
    ...categories
      .filter((c) => !c.parent)
      .flatMap((parent) => [
        { value: parent.name, label: parent.name },
        ...categories
          .filter((c) => c.parent === parent._id)
          .map((child) => ({
            value: child.name,
            label: `\u00A0\u00A0\u00A0\u00A0${child.name}`,
          })),
      ]),
  ];

  return (
    <div className="max-w-3xl mx-auto p-8">
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        All products
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">
        {isEdit ? "Edit product" : "New product"}
      </h1>

      {error && (
        <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-6">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={submitHandler} className="space-y-6">
        <div>
          <p className="font-medium text-sm mb-2">Images</p>

          {images.length > 0 ? (
            <div className="grid grid-cols-4 gap-3 mb-3">
              {images.map((src, index) => (
                <div
                  key={`${src}-${index}`}
                  className="relative aspect-square border rounded-lg overflow-hidden bg-gray-50 group"
                >
                  <img
                    src={thumb(src, 300)}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />

                  {index === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-gray-900/75 text-white text-[11px] text-center py-0.5">
                      Main
                    </span>
                  )}

                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    {index !== 0 && (
                      <button
                        type="button"
                        onClick={() => makePrimary(index)}
                        title="Make main image"
                        className="bg-white/90 rounded p-1 hover:bg-white cursor-pointer"
                      >
                        <Star size={13} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      title="Remove"
                      className="bg-white/90 rounded p-1 text-red-600 hover:bg-white cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500 border rounded-lg p-4 mb-3">
              <ImageOff size={18} className="text-gray-300" />
              No images yet
            </div>
          )}

          <label
            className={`inline-flex items-center gap-2 border rounded-lg px-4 py-2 text-sm ${
              uploading
                ? "opacity-50 cursor-wait"
                : "cursor-pointer hover:bg-gray-50"
            }`}
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {uploading ? "Uploading" : "Upload images"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={uploadHandler}
              disabled={uploading}
              className="hidden"
            />
          </label>

          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <Link2
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addUrlHandler();
                  }
                }}
                placeholder="Paste an image URL"
                className="w-full border rounded-lg py-2 pl-9 pr-3 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={addUrlHandler}
              className="border rounded-lg px-4 text-sm hover:bg-gray-50 cursor-pointer"
            >
              Add
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            The first image is shown on cards and in the cart. Up to 8 at a
            time, 5 MB each.
          </p>
        </div>

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
          <label
            htmlFor="description"
            className="block mb-1 font-medium text-sm"
          >
            Description
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            rows="4"
            className="w-full border rounded-lg p-2.5"
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="block mb-1 font-medium text-sm">Category</p>
            <Dropdown
              value={form.category}
              onChange={(v) => setField("category", v)}
              options={categoryOptions}
              placeholder="Choose a category"
            />
          </div>

          <div>
            <p className="block mb-1 font-medium text-sm">Status</p>
            <Dropdown
              value={form.status}
              onChange={(v) => setField("status", v)}
              options={[
                { value: "active", label: "Active — visible in store" },
                { value: "draft", label: "Draft — hidden" },
              ]}
            />
          </div>
        </div>

        <div>
          <label htmlFor="tags" className="block mb-1 font-medium text-sm">
            Tags
          </label>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full pl-3 pr-1.5 py-1 text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="text-gray-400 hover:text-red-600 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              id="tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="ruby, matte-gold"
              className="flex-1 border rounded-lg p-2.5 text-sm"
            />
            <button
              type="button"
              onClick={addTag}
              className="border rounded-lg px-4 text-sm hover:bg-gray-50 cursor-pointer"
            >
              Add tag
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tags are searchable by customers.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="price" className="block mb-1 font-medium text-sm">
              Price (Rs)
            </label>
            <input
              id="price"
              type="number"
              min="0"
              value={
                hasVariants
                  ? Math.min(...variants.map((v) => v.price))
                  : form.price
              }
              onChange={(e) => setField("price", e.target.value)}
              disabled={hasVariants}
              className="w-full border rounded-lg p-2.5 disabled:bg-gray-100 disabled:text-gray-500"
              required={!hasVariants}
            />
            {hasVariants && (
              <p className="text-xs text-gray-500 mt-1">
                Set per variant below.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="compare" className="block mb-1 font-medium text-sm">
              Compare at (Rs)
            </label>
            <input
              id="compare"
              type="number"
              min="0"
              value={form.compareAtPrice}
              onChange={(e) => setField("compareAtPrice", e.target.value)}
              placeholder="Optional"
              className="w-full border rounded-lg p-2.5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Shown struck through if higher than the price.
            </p>
          </div>

          <div>
            <label htmlFor="stock" className="block mb-1 font-medium text-sm">
              Stock
            </label>
            <input
              id="stock"
              type="number"
              min="0"
              value={
                hasVariants
                  ? variants.reduce((sum, v) => sum + v.countInStock, 0)
                  : form.countInStock
              }
              onChange={(e) => setField("countInStock", e.target.value)}
              disabled={hasVariants}
              className="w-full border rounded-lg p-2.5 disabled:bg-gray-100 disabled:text-gray-500"
              required={!hasVariants}
            />
            {hasVariants && (
              <p className="text-xs text-gray-500 mt-1">
                Total across variants.
              </p>
            )}
          </div>
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => setField("isFeatured", e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-sm">Feature this product on the home page</span>
        </label>

        <VariantEditor
          optionTypes={optionTypes}
          setOptionTypes={setOptionTypes}
          variants={variants}
          setVariants={setVariants}
          basePrice={form.price}
          images={images}
        />

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? "Save changes" : "Create product"}
          </button>

          <Link
            to="/admin/products"
            className="px-5 py-2.5 rounded-lg border hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default ProductFormPage;
