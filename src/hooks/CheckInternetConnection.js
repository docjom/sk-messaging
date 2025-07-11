import { useState, useEffect } from "react";
export const useInternetConnection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    const checkConnectivity = async () => {
      try {
        const response = await fetch("/message.svg", {
          method: "HEAD",
          cache: "no-cache",
        });
        setIsOnline(response.ok);
      } catch (error) {
        console.error("Connectivity check failed:", error);
        setIsOnline(false);
        setWasOffline(true);
      }
    };

    // Listen for online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const intervalId = setInterval(checkConnectivity, 30000);

    // Initial check
    checkConnectivity();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  return { isOnline, wasOffline };
};
