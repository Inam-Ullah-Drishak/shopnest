import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import "./index.css";
import App from "./App.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import { ConfirmProvider } from "./context/ConfirmContext.jsx";

axios.defaults.withCredentials = true;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  </StrictMode>,
);
