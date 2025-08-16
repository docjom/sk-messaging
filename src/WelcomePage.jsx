import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import Logo from "./assets/heading.png";
import { useEffect } from "react";
import { useInternetConnection } from "@/hooks/CheckInternetConnection";

export const WelcomePage = () => {
  const navigate = useNavigate();
  const { isOnline, wasOffline } = useInternetConnection();

  useEffect(() => {
    if (!isOnline && wasOffline) {
      navigate("/no-internet");
    }
  }, [isOnline, wasOffline, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-blue-950 via-blue-700 to-blue-500">
      <div className="text-center mb-20">
        <div className="flex justify-center items-center">
          <img src={Logo} alt="" className="h-20 w-auto" />
        </div>
        <h1 className="sm:text-4xl text-2xl text-white mt-10 not-last-of-type:mx-20 font-bold mb-4">
          Welcome to ArisChat – Where Conversations Come Alive
        </h1>

        <div className="flex justify-center items-center gap-2">
          <Button
            type="button"
            variant=""
            className=" border shadow bg-white text-blue-500"
            onClick={() => navigate("/Login")}
          >
            <Icon icon="solar:login-broken" width="24" height="24" />
            Login
          </Button>
          {/* <Button
            type="button"
            variant="ghost"
            className=" border shadow text-white"
            onClick={() => navigate("/Register")}
          >
            <Icon icon="solar:add-circle-broken" width="24" height="24" />
            Sign Up
          </Button> */}
        </div>
      </div>
    </div>
  );
};
