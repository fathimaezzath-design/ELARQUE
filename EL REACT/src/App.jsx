import AppRoutes from "./routes/AppRoutes";
import ToastNotification from "./components/common/ToastNotification";

function App() {
  return (
    <>
      <AppRoutes />
      <ToastNotification />
    </>
  );
}

export default App;