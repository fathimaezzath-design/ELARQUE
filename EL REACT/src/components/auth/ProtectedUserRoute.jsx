import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";

/**
 * Safely decodes JWT payload on the client side
 */
function parseJwtPayload(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.trim().split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Validates whether the stored customer token is non-empty, valid JWT, and unexpired
 */
function isCustomerTokenValid(token) {
  if (!token || typeof token !== "string" || !token.trim()) {
    return false;
  }

  const payload = parseJwtPayload(token);
  if (!payload || typeof payload !== "object") {
    return false;
  }

  if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
    return false;
  }

  return true;
}

/**
 * ProtectedUserRoute
 * Ensures private customer routes are only accessible with a valid, unexpired customer JWT session.
 * Clears ONLY customer authentication data (token and user) upon invalid/expired session.
 * Does not touch admin credentials or interfere with public/auth routes.
 */
function ProtectedUserRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!isCustomerTokenValid(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedUserRoute;
