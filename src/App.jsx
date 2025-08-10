import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { WelcomePage } from "./WelcomePage";
import Register from "./pages/Register";
import { NoInternetPage } from "./pages/NoInternet";
import { useUserStore } from "@/stores/useUserStore";
import { AdminDashboard } from "./admin/pages/Dashboard";
import { AdminHome } from "./admin/pages/Home";
import { Management } from "./admin/pages/Management";
import { MainLoading } from "./components/loading/mainLoading";
import { AdminRoute } from "./components/auth/AdminRoute";

function App() {
  const { userProfile, initialized, initAuthListener } = useUserStore();

  useEffect(() => {
    initAuthListener();
    return () => {
      useUserStore.getState().cleanup();
    };
  }, [initAuthListener]);

  if (!initialized) {
    return <MainLoading />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/no-internet" element={<NoInternetPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={userProfile ? <Dashboard /> : <Navigate to="/login" />}
        />

        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminDashboard />}>
            <Route index element={<AdminHome />} />
            <Route path="home" element={<AdminHome />} />
            <Route path="management" element={<Management />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
