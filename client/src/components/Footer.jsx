import { Link } from 'react-router-dom';
import { Truck, Wallet, RotateCcw } from 'lucide-react';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t mt-16">
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <p className="text-lg font-bold">ShopNest</p>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Necklaces, bangles and earrings for everyday and for occasions.
              Delivered across Pakistan.
            </p>
          </div>

          <div>
            <p className="font-medium text-sm mb-3">Shop</p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link to="/shop" className="hover:text-gray-900">
                  All products
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-gray-900">
                  Collections
                </Link>
              </li>
              <li>
                <Link to="/shop?onSale=true" className="hover:text-gray-900">
                  On sale
                </Link>
              </li>
              <li>
                <Link to="/shop?sort=newest" className="hover:text-gray-900">
                  New arrivals
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-sm mb-3">Account</p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link to="/profile" className="hover:text-gray-900">
                  Your profile
                </Link>
              </li>
              <li>
                <Link to="/myorders" className="hover:text-gray-900">
                  Your orders
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-gray-900">
                  Your cart
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-sm mb-3">Delivery and returns</p>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li className="flex gap-2">
                <Truck size={15} className="shrink-0 mt-0.5" />
                Free over Rs 5,000
              </li>
              <li className="flex gap-2">
                <Wallet size={15} className="shrink-0 mt-0.5" />
                Cash on delivery
              </li>
              <li className="flex gap-2">
                <RotateCcw size={15} className="shrink-0 mt-0.5" />
                Seven day returns
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-10 pt-6 flex flex-wrap justify-between gap-3 text-sm text-gray-500">
          <p>© {year} ShopNest. A portfolio project.</p>
          <p>Built with MongoDB, Express, React and Node.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;