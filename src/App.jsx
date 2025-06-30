import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { WelcomePage } from "./WelcomePage";
import Register from "./pages/Register";
import { NoInternetPage } from "./pages/NoInternet";
import { useUserStore } from "@/stores/useUserStore";

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
    return <div className="flex items-center justify-center h-screen"></div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/no-internet" element={<NoInternetPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Login />} />
      </Routes>
    </Router>
  );
}

export default App;
