import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import ShopPage from './pages/ShopPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import CartPage from './pages/CartPage.jsx';
import ShippingPage from './pages/ShippingPage.jsx';
import PlaceOrderPage from './pages/PlaceOrderPage.jsx';
import OrderPage from './pages/OrderPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import CollectionsPage from './pages/CollectionsPage.jsx';
import CollectionPage from './pages/CollectionPage.jsx';
import DashboardPage from './pages/admin/DashboardPage.jsx';
import ProductListPage from './pages/admin/ProductListPage.jsx';
import ProductFormPage from './pages/admin/ProductFormPage.jsx';
import OrderListPage from './pages/admin/OrderListPage.jsx';
import CategoryListPage from './pages/admin/CategoryListPage.jsx';
import CollectionListPage from './pages/admin/CollectionListPage.jsx';
import CollectionFormPage from './pages/admin/CollectionFormPage.jsx';

function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <>
      <Header />

      <main
        className={isAdmin ? 'max-w-screen-2xl mx-auto' : 'max-w-6xl mx-auto'}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collection/:slug" element={<CollectionPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/myorders" element={<MyOrdersPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/shipping" element={<ShippingPage />} />
          <Route path="/placeorder" element={<PlaceOrderPage />} />
          <Route path="/order/:id" element={<OrderPage />} />

          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/products" element={<ProductListPage />} />
          <Route path="/admin/product/new" element={<ProductFormPage />} />
          <Route path="/admin/product/:id/edit" element={<ProductFormPage />} />
          <Route path="/admin/categories" element={<CategoryListPage />} />
          <Route path="/admin/collections" element={<CollectionListPage />} />
          <Route
            path="/admin/collection/new"
            element={<CollectionFormPage />}
          />
          <Route
            path="/admin/collection/:id/edit"
            element={<CollectionFormPage />}
          />
          <Route path="/admin/orders" element={<OrderListPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;