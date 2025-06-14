import { Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

const PrivateRoute = ({ element }) => {
  const [loading, setLoading] = useState(true); // For managing loading state
  const [user, setUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Set user to currentUser once auth state is confirmed
      setLoading(false); // Stop loading when auth state is determined
    });

    return () => unsubscribe(); // Clean up the listener on component unmount
  }, [auth]);

  if (loading) {
    // While waiting for Firebase auth state to resolve, you can show a loading state or spinner
    return <div className="flex items-center justify-center h-screen"></div>;
  }

  // If there is no authenticated user, navigate to login page
  return user ? element : <Navigate to="/" />;
};

export default PrivateRoute;
