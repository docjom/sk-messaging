import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useInternetConnection } from "../hooks/CheckInternetConnection";
import NoInternetImage from "../assets/NoInternet.svg";

export const NoInternetPage = () => {
  const navigate = useNavigate();
  const { isOnline } = useInternetConnection();

  useEffect(() => {
    if (isOnline) {
      navigate("/");
    }
  }, [isOnline, navigate]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500">
      <div className="text-center">
        <div className="flex justify-center items-center">
          <img src={NoInternetImage} alt="" className="size-32" />
        </div>

        <h1 className="text-2xl sm:text-4xl text-white font-bold mb-4">
          No Internet Connection
        </h1>

        <p className="text-base text-gray-300 mb-8 max-w-md mx-auto">
          Please check your internet connection and try again. ArisChat needs an
          active connection to work properly.
        </p>

        <div className="flex justify-center items-center gap-4">
          <Button
            type="button"
            variant=""
            onClick={handleRetry}
            className="border shadow bg-white text-gray-700 hover:bg-gray-100"
          >
            <Icon icon="solar:refresh-broken" width="24" height="24" />
            Retry
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="border shadow text-white hover:bg-white hover:text-gray-700"
            onClick={() => navigate("/")}
          >
            <Icon icon="solar:home-broken" width="24" height="24" />
            Go Home
          </Button>
        </div>

        <div className="mt-8 text-sm text-gray-400">
          <p>Troubleshooting tips:</p>
          <ul className="mt-2 space-y-1">
            <li>• Check your WiFi or mobile data connection</li>
            <li>• Try refreshing the page</li>
            <li>• Contact your internet service provider</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
