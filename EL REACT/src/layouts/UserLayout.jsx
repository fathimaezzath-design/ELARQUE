import React from "react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

function UserLayout({ children }) {
  return (
    <div className="el-user-layout">
      <Navbar />
      <main className="el-user-main">{children}</main>
      <Footer />
      <style>{`
        .el-user-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--el-cream, #FAF6F0);
          color: var(--el-text-dark, #1A1A1A);
          font-family: var(--font-sans, 'Poppins', sans-serif);
        }
        .el-user-main {
          flex: 1;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

export default UserLayout;
