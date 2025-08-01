import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initAuthListener = useUserStore((s) => s.initAuthListener);

  useEffect(() => {
    initAuthListener();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
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
