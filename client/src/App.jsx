import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Footer from "./components/Footer.jsx";
import HomePage from "./pages/HomePage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CartPage from "./pages/CartPage.jsx";
import ShippingPage from "./pages/ShippingPage.jsx";
import PlaceOrderPage from "./pages/PlaceOrderPage.jsx";
import OrderPage from "./pages/OrderPage.jsx";
import MyOrdersPage from "./pages/MyOrdersPage.jsx";
import WishlistPage from "./pages/WishlistPage.jsx";
import CollectionsPage from "./pages/CollectionsPage.jsx";
import CollectionPage from "./pages/CollectionPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import DashboardPage from "./pages/admin/DashboardPage.jsx";
import ProductListPage from "./pages/admin/ProductListPage.jsx";
import ProductFormPage from "./pages/admin/ProductFormPage.jsx";
import OrderListPage from "./pages/admin/OrderListPage.jsx";
import CategoryListPage from "./pages/admin/CategoryListPage.jsx";
import CollectionListPage from "./pages/admin/CollectionListPage.jsx";
import CollectionFormPage from "./pages/admin/CollectionFormPage.jsx";
import CouponListPage from "./pages/admin/CouponListPage.jsx";
import CouponFormPage from "./pages/admin/CouponFormPage.jsx";
import CustomerListPage from "./pages/admin/CustomerListPage.jsx";
import CustomerDetailPage from "./pages/admin/CustomerDetailPage.jsx";

function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main
        className={`flex-1 w-full ${
          isAdmin ? "max-w-screen-2xl mx-auto" : "max-w-7xl mx-auto"
        }`}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collection/:slug" element={<CollectionPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/myorders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            }
          />
          <Route path="/cart" element={<CartPage />} />
          <Route
            path="/shipping"
            element={
              <ProtectedRoute>
                <ShippingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placeorder"
            element={
              <ProtectedRoute>
                <PlaceOrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order/:id"
            element={
              <ProtectedRoute>
                <OrderPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute adminOnly>
                <ProductListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/product/new"
            element={
              <ProtectedRoute adminOnly>
                <ProductFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/product/:id/edit"
            element={
              <ProtectedRoute adminOnly>
                <ProductFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute adminOnly>
                <CategoryListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/collections"
            element={
              <ProtectedRoute adminOnly>
                <CollectionListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/collection/new"
            element={
              <ProtectedRoute adminOnly>
                <CollectionFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/collection/:id/edit"
            element={
              <ProtectedRoute adminOnly>
                <CollectionFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/coupons"
            element={
              <ProtectedRoute adminOnly>
                <CouponListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/coupon/new"
            element={
              <ProtectedRoute adminOnly>
                <CouponFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/coupon/:id/edit"
            element={
              <ProtectedRoute adminOnly>
                <CouponFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute adminOnly>
                <OrderListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute adminOnly>
                <CustomerListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customer/:id"
            element={
              <ProtectedRoute adminOnly>
                <CustomerDetailPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!isAdmin && <Footer />}
    </div>
  );
}

export default App;