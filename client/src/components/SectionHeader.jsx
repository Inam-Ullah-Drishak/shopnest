import { Link } from "react-router-dom";

// The heading and "See all" pairing that sits above each home page carousel.
// Markup matches the inline version in CategoryCarousel so the sections line up.
function SectionHeader({ title, to }) {
  return (
    <div className="flex items-baseline justify-between mb-6">
      <h2 className="text-2xl font-bold">{title}</h2>

      {to && (
        <Link to={to} className="text-sm text-gray-600 hover:underline">
          See all
        </Link>
      )}
    </div>
  );
}

export default SectionHeader;