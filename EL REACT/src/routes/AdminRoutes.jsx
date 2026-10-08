import { Routes, Route } from "react-router-dom";
import AdminLogin from "../components/admin/AdminLogin";
import ProtectedAdminRoute from "../components/admin/ProtectedAdminRoute";
import UserManagement from "../components/admin/UserManagement";
import CategoryManagement from "../components/admin/CategoryManagement";
import ProductManagement from "../components/admin/ProductManagement";

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
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminPlaceholder />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedAdminRoute>
            <ProductManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedAdminRoute>
            <UserManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedAdminRoute>
            <CategoryManagement />
          </ProtectedAdminRoute>
        }
      />
      <Route path="/admin/login" element={<AdminLogin />} />
    </Routes>
  );
}


export default AdminRoutes;
