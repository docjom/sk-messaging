import { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
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

function App() {
  // Use only the Zustand store for user state
  const { user, initialized, initAuthListener } = useUserStore();

  useEffect(() => {
    initAuthListener();

    // Cleanup function
    return () => {
      useUserStore.getState().cleanup();
    };
  }, [initAuthListener]);

  // Show loading until auth state is initialized
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
        <Route path="/dashboard" element={user ? <Dashboard /> : <Login />} />
        <Route path="/adminDashboard" element={<AdminDashboard />}>
          <Route index element={<AdminHome />} />
          <Route path="home" element={<AdminHome />} />
          <Route path="management" element={<Management />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
