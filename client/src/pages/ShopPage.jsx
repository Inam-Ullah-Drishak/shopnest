import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Search, X, Loader2, PackageOpen, Tag } from "lucide-react";
import ProductCard from "../components/ProductCard.jsx";
import Dropdown from "../components/Dropdown.jsx";
import Pagination from "../components/Pagination.jsx";
import { PAGE_SIZE } from "../utils/constants.js";
import { usePageTitle } from "../hooks/usePageTitle.js";
function ShopPage() {
  usePageTitle("Shop");
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get("keyword") || "";
  const category = searchParams.get("category") || "All";
  const stock = searchParams.get("stock") || "all";
  const sort = searchParams.get("sort") || "newest";
  const onSale = searchParams.get("onSale") === "true";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const page = Number(searchParams.get("page")) || 1;

  const [searchInput, setSearchInput] = useState(keyword);
  const [lastKeyword, setLastKeyword] = useState(keyword);

  // Keep the text box in step with the URL (back button, cleared filters).
  // Adjusting during render is React's recommended alternative to an effect.
  if (keyword !== lastKeyword) {
    setLastKeyword(keyword);
    setSearchInput(keyword);
  }

  // Same idea for the price boxes: they type freely, the URL only changes
  // when they submit, and the back button puts the boxes back in step
  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);
  const [lastRange, setLastRange] = useState(`${minPrice}|${maxPrice}`);

  if (`${minPrice}|${maxPrice}` !== lastRange) {
    setLastRange(`${minPrice}|${maxPrice}`);
    setMinInput(minPrice);
    setMaxInput(maxPrice);
  }

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState(1);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const filtersActive =
    keyword ||
    category !== "All" ||
    stock !== "all" ||
    sort !== "newest" ||
    onSale ||
    minPrice ||
    maxPrice;

  useEffect(() => {
    axios
      .get("/api/products/categories")
      .then(({ data }) => setCategories(data))
      .catch(() => {});
  }, []);

  // Filters change faster than the network answers. Each call takes a
  // ticket; a response whose ticket is no longer the newest is dropped,
  // so a slow earlier request cannot overwrite fresher results.
  const latestRequest = useRef(0);

  useEffect(() => {
    const fetchProducts = async () => {
      const requestId = latestRequest.current + 1;
      latestRequest.current = requestId;

      setLoading(true);

      try {
        const { data } = await axios.get("/api/products", {
          params: {
            keyword,
            category,
            stock,
            sort,
            onSale: onSale ? "true" : undefined,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            pageNumber: page,
            pageSize: PAGE_SIZE,
          },
        });

        if (requestId !== latestRequest.current) return;

        setProducts(data.products);
        setPages(data.pages);
        setCount(data.count);
      } catch (err) {
        if (requestId !== latestRequest.current) return;

        setError(err.response?.data?.message || "Could not load products");
      } finally {
        if (requestId === latestRequest.current) setLoading(false);
      }
    };

    fetchProducts();
  }, [keyword, category, stock, sort, onSale, minPrice, maxPrice, page]);

  // Merge one change into the URL, resetting to page 1
  const setParam = (changes) => {
    const next = {
      keyword,
      category,
      stock,
      sort,
      onSale: onSale ? "true" : "",
      minPrice,
      maxPrice,
      page: 1,
      ...changes,
    };

    Object.keys(next).forEach((k) => {
      if (!next[k] || next[k] === "All" || next[k] === "all") delete next[k];
    });

    setSearchParams(next);
  };

  const pageHandler = (n) => {
    setParam({ page: n });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => setSearchParams({});

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-5">
        {onSale ? "On sale" : "Shop all"}
      </h1>

      <div className="flex flex-wrap gap-2 mb-4">
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
            placeholder="Search by name or tag"
            className="w-full border rounded-lg py-2.5 pl-9 pr-3 text-sm"
          />
        </form>

        <button
          type="button"
          onClick={() => setParam({ onSale: onSale ? "" : "true" })}
          className={`inline-flex items-center gap-1.5 border rounded-lg px-4 py-2.5 text-sm cursor-pointer ${
            onSale
              ? "bg-navy text-white border-navy"
              : "hover:bg-gray-50"
          }`}
        >
          <Tag size={15} />
          On sale
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();

            // A backwards range returns nothing and looks broken, so swap it
            const from = Number(minInput);
            const to = Number(maxInput);
            const flip = minInput && maxInput && from > to;

            setParam({
              minPrice: flip ? maxInput : minInput,
              maxPrice: flip ? minInput : maxInput,
            });
          }}
          className="flex gap-2"
        >
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            placeholder="Min price"
            aria-label="Minimum price"
            className="w-28 border rounded-lg px-3 py-2.5 text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />

          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            placeholder="Max price"
            aria-label="Maximum price"
            className="w-28 border rounded-lg px-3 py-2.5 text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />

          <button
            type="submit"
            className="border rounded-lg px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer"
          >
            Go
          </button>
        </form>

        <Dropdown
          value={category}
          onChange={(v) => setParam({ category: v })}
          options={[
            { value: "All", label: "All categories" },
            ...categories.map((cat) => ({ value: cat, label: cat })),
          ]}
          className="w-44"
        />

        <Dropdown
          value={stock}
          onChange={(v) => setParam({ stock: v })}
          options={[
            { value: "all", label: "Show everything" },
            { value: "available", label: "In stock only" },
          ]}
          className="w-44"
        />

        <Dropdown
          value={sort}
          onChange={(v) => setParam({ sort: v })}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "rating-desc", label: "Best rated" },
            { value: "name-asc", label: "Name A–Z" },
            { value: "name-desc", label: "Name Z–A" },
            { value: "price-asc", label: "Price low to high" },
            { value: "price-desc", label: "Price high to low" },
          ]}
          className="w-48"
          align="right"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <p className="text-sm text-gray-500">
          {loading ? "Loading" : `${count} product${count === 1 ? "" : "s"}`}
        </p>

        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-navy cursor-pointer"
          >
            <X size={14} />
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-6 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-12">
          <Loader2 size={18} className="animate-spin" />
          Loading products
        </div>
      ) : products.length === 0 ? (
        <div className="border rounded-lg py-16 text-center">
          <PackageOpen size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 font-medium">Nothing matches</p>
          <p className="text-sm text-gray-500 mt-1">
            Try a different search or clear the filters.
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 border px-4 py-2.5 rounded-lg hover:bg-gray-50 mt-5 cursor-pointer"
            >
              <X size={16} />
              Clear filters
            </button>
          )}
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

export default ShopPage;