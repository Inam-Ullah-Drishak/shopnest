import { Link } from 'react-router-dom';
import { Compass, Search, Home } from 'lucide-react';

function NotFoundPage() {
  return (
    <div className="p-8 py-24 text-center">
      <Compass size={44} className="mx-auto text-gray-300" />

      <h1 className="text-3xl font-bold mt-5">This page doesn't exist</h1>

      <p className="text-gray-600 mt-2 max-w-md mx-auto">
        The link may be broken, or the page may have moved. Nothing you did
        wrong.
      </p>

      <div className="flex flex-wrap gap-3 justify-center mt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700"
        >
          <Home size={16} />
          Go home
        </Link>

        <Link
          to="/shop"
          className="inline-flex items-center gap-2 border px-5 py-2.5 rounded-lg hover:bg-gray-50"
        >
          <Search size={16} />
          Browse the shop
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;