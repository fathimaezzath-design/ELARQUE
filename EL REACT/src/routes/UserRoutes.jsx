import { Routes, Route } from "react-router-dom";

import Home from "../components/home/Home";
import Collections from "../components/user/Collections";
import ProductDetails from "../components/user/ProductDetails";
import Wishlist from "../components/user/Wishlist";
import Cart from "../components/user/Cart";
import Login from "../components/auth/Login";
import Signup from "../components/auth/Signup";
import VerifyOTP from "../components/auth/VerifyOTP";
import ForgotPassword from "../components/auth/ForgotPassword";
import VerifyResetOTP from "../components/auth/VerifyResetOTP";
import ResetPassword from "../components/auth/ResetPassword";
import Profile from "../components/auth/Profile";
import EditProfile from "../components/auth/EditProfile";
import EditEmail from "../components/auth/EditEmail";
import VerifyEmail from "../components/auth/VerifyEmail";
import EmailVerified from "../components/auth/EmailVerified";
import Addresses from "../components/auth/Addresses";
import AddAddress from "../components/auth/AddAddress";
import ChangePassword from "../components/auth/ChangePassword";
import ProtectedUserRoute from "../components/auth/ProtectedUserRoute";
import Checkout from "../components/user/Checkout";
import OrderConfirmed from "../components/user/OrderConfirmed";

function UserRoutes() {
  return (
    <Routes>
      {/* Public storefront routes */}
      <Route path="/" element={<Home />} />
      <Route path="/collections" element={<Collections />} />
      <Route path="/shop" element={<Collections />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route path="/wishlist" element={<Wishlist />} />

      {/* Customer authentication routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-reset-otp" element={<VerifyResetOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected customer routes */}
      <Route
        path="/cart"
        element={
          <ProtectedUserRoute>
            <Cart />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedUserRoute>
            <Checkout />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/order-confirmed"
        element={
          <ProtectedUserRoute>
            <OrderConfirmed />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/edit-email"
        element={
          <ProtectedUserRoute>
            <EditEmail />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/verify-email"
        element={
          <ProtectedUserRoute>
            <VerifyEmail />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/email-verified"
        element={
          <ProtectedUserRoute>
            <EmailVerified />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedUserRoute>
            <Profile />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/edit-profile"
        element={
          <ProtectedUserRoute>
            <EditProfile />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/addresses"
        element={
          <ProtectedUserRoute>
            <Addresses />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/addresses/add"
        element={
          <ProtectedUserRoute>
            <AddAddress />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/addresses/edit/:id"
        element={
          <ProtectedUserRoute>
            <AddAddress />
          </ProtectedUserRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedUserRoute>
            <ChangePassword />
          </ProtectedUserRoute>
        }
      />
    </Routes>
  );
}

export default UserRoutes;