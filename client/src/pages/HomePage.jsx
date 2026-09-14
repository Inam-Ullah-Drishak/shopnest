import { useState, useEffect } from "react";
import axios from "axios";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

import HeroBanner from "../components/HeroBanner.jsx";
import CategoryCarousel from "../components/CategoryCarousel.jsx";
import ProductSlider from "../components/ProductSlider.jsx";
import CollectionGrid from "../components/CollectionGrid.jsx";
import FeatureHighlights from "../components/FeatureHighlights.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";

function HomePage() {
  usePageTitle("");

  const [featured, setFeatured] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [onSale, setOnSale] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Bumped by "Try again" to re-run the effect below. Keeping the fetch inside
  // the effect avoids calling a setState-bearing callback from it.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        // Featured is its own request now. Filtering the newest twelve for
        // isFeatured meant an older featured product could never appear.
        const [newest, sale, picks, cats, cols] = await Promise.all([
          axios.get("/api/products", {
            params: { sort: "newest", pageSize: 12 },
          }),
          axios.get("/api/products", {
            params: { onSale: "true", pageSize: 12 },
          }),
          axios.get("/api/products", {
            params: { featured: "true", pageSize: 12 },
          }),
          axios.get("/api/categories"),
          axios.get("/api/collections", { params: { published: "true" } }),
        ]);

        setArrivals(newest.data.products);
        setOnSale(sale.data.products);
        setFeatured(picks.data.products);
        setCategories(cats.data);
        setCollections(cols.data);
      } catch (err) {
        // Every section returns null on empty data, so without this the page
        // renders completely blank and looks like the store has nothing in it
        setError(
          err.response?.data?.message ||
            "We couldn't load the store just now. Please try again.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [attempt]);

  if (loading) {
    return (
      <div className="p-4 flex items-center gap-2 text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Loading
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-8 py-20 flex flex-col items-center text-center gap-4">
        <AlertCircle size={28} className="text-red-500" />

        <p className="text-gray-700 max-w-sm">{error}</p>

        <button
          type="button"
          onClick={() => setAttempt((n) => n + 1)}
          className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-lg text-sm hover:bg-navy-dark cursor-pointer"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    );
  }

  const hero =
    featured.find((p) => p.image && p.countInStock > 0) ||
    arrivals.find((p) => p.image && p.countInStock > 0);

  return (
    <div>
      <HeroBanner hero={hero} />
      <CategoryCarousel categories={categories} />

      <ProductSlider
        title="Featured"
        seeAllLink="/shop"
        products={featured}
      />

      <ProductSlider
        title="On sale"
        seeAllLink="/shop?onSale=true"
        products={onSale}
      />

      <CollectionGrid collections={collections} />

      <ProductSlider
        title="Just arrived"
        seeAllLink="/shop?sort=newest"
        products={arrivals}
      />

      <FeatureHighlights />
    </div>
  );
}

export default HomePage;