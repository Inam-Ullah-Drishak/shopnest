import { Link } from "react-router-dom";
import { ImageOff } from "lucide-react";
import Carousel from "./Carousel.jsx";
import SectionHeader from "./SectionHeader.jsx";

function CollectionGrid({ collections = [], title = "Collections", seeAllLink = "/collections" }) {
  if (!collections || collections.length === 0) return null;

  return (
    <section className="px-8 py-10 ">
      <SectionHeader title={title} to={seeAllLink} />

      <Carousel itemClass="w-72 sm:w-80">
        {collections.map((collection) => (
          <Link
            key={collection._id}
            to={`/collection/${collection.slug}`}
            className="group block"
          >
            <div className="aspect-3/2 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
              {collection.image ? (
                <img
                  src={collection.image}
                  alt={collection.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              ) : (
                <ImageOff size={24} className="text-gray-300" />
              )}
            </div>

            <h3 className="font-medium mt-3 truncate">{collection.title}</h3>

            {collection.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {collection.description}
              </p>
            )}
          </Link>
        ))}
      </Carousel>
    </section>
  );
}

export default CollectionGrid;