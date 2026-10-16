import React from "react";
import { Navigate, Outlet } from "react-router-dom";

/**
 * Safely decodes a JWT payload on the client side.
 * NOTE: This is client-side structure & expiration validation only.
 * Cryptographic signature verification is strictly enforced by backend middleware.
 */
const parseJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;

  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonString = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonString);
  } catch {
    try {
      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }
};

/**
 * Validates whether the stored token is a structurally valid, unexpired administrator JWT.
 */
const isTokenValidAdmin = (token) => {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload !== "object") {
    return false;
  }

  // Reject expired tokens (exp in seconds vs Date.now() in ms)
  if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
    return false;
  }

  // Reject tokens that do not possess authorized administrator roles
  const allowedRoles = ["admin", "superadmin"];
  if (!payload.role || !allowedRoles.includes(payload.role)) {
    return false;
  }

  return true;
};

const ProtectedAdminRoute = ({ children }) => {
  const adminToken = localStorage.getItem("adminToken");

  if (!isTokenValidAdmin(adminToken)) {
    // Clear potentially corrupted or expired admin credentials from localStorage
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    return <Navigate to="/admin/login" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedAdminRoute;
