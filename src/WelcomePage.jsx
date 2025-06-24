import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import Logo from "./assets/logo.jpg"; // Assuming you have a logo image
export const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center mb-20">
        <div className="flex justify-center items-center">
          <img src={Logo} alt="" className="size-20" />
        </div>
        <h1 className="text-4xl mt-10 not-last-of-type:mx-20 font-bold mb-4">
          Welcome to ArisChat – Where Conversations Come Alive
        </h1>

        <div className="flex justify-center items-center gap-2">
          <Button
            type="button"
            variant="default"
            className=" border shadow"
            onClick={() => navigate("/Login")}
          >
            <Icon icon="solar:login-broken" width="24" height="24" />
            Login
          </Button>
          <Button
            type="button"
            variant="ghost"
            className=" border shadow"
            onClick={() => navigate("/Register")}
          >
            <Icon icon="solar:add-circle-broken" width="24" height="24" />
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};
