import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/useUserStore";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
export const AdminHome = () => {
  const { userProfile } = useUserStore();

  return (
    <div className="min-h-screen p-4 ">
      <div className="flex justify-between items-center">
        {" "}
        <div className="text-3xl flex justify-start items-center gap-3 font-bold mb-6">
          Welcome {userProfile.displayName}{" "}
          <Badge className="capitalize">{userProfile.role}</Badge>
        </div>
        <div>
          <Link to="/dashboard">
            <Button>
              {" "}
              <ArrowRight />
              Go to chats
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
