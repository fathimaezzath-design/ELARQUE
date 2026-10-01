import UserRoutes from "./UserRoutes";
import AdminRoutes from "./AdminRoutes";

function AppRoutes() {
  return (
    <>
      <UserRoutes />
      <AdminRoutes />
    </>
  );
}

export default AppRoutes;