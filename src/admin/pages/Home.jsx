import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/useUserStore";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMessageActionStore } from "@/stores/useMessageActionStore";
export const AdminHome = () => {
  const { userProfile } = useUserStore();
  const { users } = useMessageActionStore();
  // const { activeUsers, blockedUsers, deletedUsers } = users.reduce(
  //   (acc, u) => {
  //     if (u.deleted === "deleted") {
  //       acc.deletedUsers.push(u);
  //     } else if (u.blocked) {
  //       acc.blockedUsers.push(u);
  //     } else {
  //       acc.activeUsers.push(u);
  //     }

  //     return acc;
  //   },
  //   { activeUsers: [], blockedUsers: [], deletedUsers: [] }
  // );

  return (
    <div className="min-h-screen p-4 ">
      <div className="flex justify-between items-center">
        {" "}
        <div className="text-3xl flex justify-start items-center gap-3 font-bold">
          <span className="hidden sm:flex"> Welcome</span>{" "}
          {userProfile.displayName}{" "}
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
      <div className="my-2 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold">
            {users?.length}
          </CardContent>
        </Card>
        {/* <Card>
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold">
            {activeUsers.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Blocked Users</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold">
            {blockedUsers.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Deleted Users</CardTitle>
          </CardHeader>
          <CardContent className="text-4xl font-bold">
            {deletedUsers.length}
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
};
