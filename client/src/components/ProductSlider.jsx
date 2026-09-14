import ProductCard from "./ProductCard.jsx";
import Carousel from "./Carousel.jsx";
import SectionHeader from "./SectionHeader.jsx";

function ProductSlider({ title, seeAllLink, products = [] }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="px-8 py-10">
      <SectionHeader title={title} to={seeAllLink} />

      <Carousel itemClass="w-56 sm:w-64">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </Carousel>
    </section>
  );
}

export default ProductSlider;