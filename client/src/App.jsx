import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import CartPage from './pages/CartPage.jsx';
import ShippingPage from './pages/ShippingPage.jsx';
import PlaceOrderPage from './pages/PlaceOrderPage.jsx';
import OrderPage from './pages/OrderPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import ProductListPage from './pages/admin/ProductListPage.jsx';
import ProductEditPage from './pages/admin/ProductEditPage.jsx';
import OrderListPage from './pages/admin/OrderListPage.jsx';

function App() {
  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/myorders" element={<MyOrdersPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/shipping" element={<ShippingPage />} />
          <Route path="/placeorder" element={<PlaceOrderPage />} />
          <Route path="/order/:id" element={<OrderPage />} />

          <Route path="/admin/products" element={<ProductListPage />} />
          <Route
            path="/admin/product/:id/edit"
            element={<ProductEditPage />}
          />
          <Route path="/admin/orders" element={<OrderListPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;