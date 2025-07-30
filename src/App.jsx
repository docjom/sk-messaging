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

function App() {
  const { user, initAuthListener } = useUserStore();

  useEffect(() => {
    initAuthListener();
  }, [initAuthListener]);

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
