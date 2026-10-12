import { Routes, Route } from "react-router-dom";
import AdminLogin from "../components/admin/AdminLogin";
import ProtectedAdminRoute from "../components/admin/ProtectedAdminRoute";
import AdminLayout from "../layouts/AdminLayout";
import UserManagement from "../components/admin/UserManagement";
import CategoryManagement from "../components/admin/CategoryManagement";
import ProductManagement from "../components/admin/ProductManagement";
import AddProduct from "../components/admin/AddProduct";
import EditProduct from "../components/admin/EditProduct";
import VariantManagement from "../components/admin/VariantManagement";
import AddVariant from "../components/admin/AddVariant";
import EditVariant from "../components/admin/EditVariant";

// Temporary minimal placeholder to verify successful /admin navigation
function AdminPlaceholder() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#090306",
        color: "#f7f1eb",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Poppins', sans-serif",
        textAlign: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <h1
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "36px",
          color: "#dfc28d",
          letterSpacing: "6px",
          margin: "0 0 12px 0",
          textTransform: "uppercase",
        }}
      >
        ELARQUE Admin
      </h1>
      <p
        style={{
          color: "#b59f8c",
          fontSize: "13px",
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        Admin authentication successful.
      </p>
    </div>
  );
}

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
        <Route path="/admin" element={<AdminPlaceholder />} />
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
      </Route>
    </Routes>
  );
}

export default AdminRoutes;
