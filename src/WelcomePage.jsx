import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

export const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Pagud Kanaba sa buhay?</h1>

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
