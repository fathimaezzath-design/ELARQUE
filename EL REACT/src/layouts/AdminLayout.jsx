import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import { Menu } from "lucide-react";
import "./AdminLayout.css";

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="el-admin-layout">
      {/* Mobile Top Header */}
      <header className="el-admin-mobile-header">
        <button
          type="button"
          className="el-admin-mobile-toggle-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open Admin Menu"
        >
          <Menu size={20} />
        </button>
        <span className="el-admin-mobile-brand">ELARQUE</span>
      </header>

      {/* Admin Sidebar matching reference screenshot */}
      <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="el-admin-main-wrapper">
        <main className="el-admin-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
