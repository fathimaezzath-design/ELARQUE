import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "../components/admin/AdminLogin";
import ProtectedAdminRoute from "../components/admin/ProtectedAdminRoute";
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../components/admin/AdminDashboard";
import UserManagement from "../components/admin/UserManagement";
import CategoryManagement from "../components/admin/CategoryManagement";
import ProductManagement from "../components/admin/ProductManagement";
import AddProduct from "../components/admin/AddProduct";
import EditProduct from "../components/admin/EditProduct";
import VariantManagement from "../components/admin/VariantManagement";
import AddVariant from "../components/admin/AddVariant";
import EditVariant from "../components/admin/EditVariant";
import OrderManagement from "../components/admin/OrderManagement";
import ReturnManagement from "../components/admin/ReturnManagement";
import UpdateReturnStatus from "../components/admin/UpdateReturnStatus";
import CouponManagement from "../components/admin/CouponManagement";
import AddCoupon from "../components/admin/AddCoupon";
import EditCoupon from "../components/admin/EditCoupon";
import SalesReport from "../components/admin/SalesReport";
import OffersManagement from "../components/admin/OffersManagement";
import AddOffer from "../components/admin/AddOffer";
import EditOffer from "../components/admin/EditOffer";

function AdminRoutes() {
  return (
    <Routes>
      {/* Public Admin Route - Without Admin Navbar */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected Admin Routes - Wrapped with Unified Admin Navbar Layout */}
      <Route
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/orders" element={<OrderManagement />} />
        <Route path="/admin/returns" element={<ReturnManagement />} />
        <Route path="/admin/returns/:id" element={<UpdateReturnStatus />} />
        <Route path="/admin/returns/update/:id" element={<UpdateReturnStatus />} />
        <Route path="/admin/products" element={<ProductManagement />} />
        <Route path="/admin/products/add" element={<AddProduct />} />
        <Route path="/admin/products/edit/:id" element={<EditProduct />} />
        <Route path="/admin/variants" element={<VariantManagement />} />
        <Route path="/admin/variants/add" element={<AddVariant />} />
        <Route
          path="/admin/variants/edit/:productId/:variantId"
          element={<EditVariant />}
        />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/categories" element={<CategoryManagement />} />
        <Route path="/admin/coupons" element={<CouponManagement />} />
        <Route path="/admin/coupons/add" element={<AddCoupon />} />
        <Route path="/admin/coupons/edit/:id" element={<EditCoupon />} />
        <Route path="/admin/offers" element={<OffersManagement />} />
        <Route path="/admin/offers/add" element={<AddOffer />} />
        <Route path="/admin/offers/edit/:id" element={<EditOffer />} />
        <Route path="/admin/sales-report" element={<SalesReport />} />
      </Route>

      {/* Fallback for any unknown /admin sub-routes */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default AdminRoutes;
