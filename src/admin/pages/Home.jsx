import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Users,
  MessageSquare,
  Server,
  Settings,
  Shield,
  Activity,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { motion } from "motion/react";
import { useUserStore } from "@/stores/useUserStore";
import { useMessageActionStore } from "@/stores/useMessageActionStore";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

import { useFirebaseStats } from "../hooks/useFirebaseStats";
import { useSystemMaintenance } from "../hooks/useSystemMaintenance";
import { Link } from "react-router-dom";
import { Roles } from "@/scripts/roles";

export const AdminHome = () => {
  const { isSystemUnderMaintenance, handleMaintenanceToggle } =
    useSystemMaintenance();

  const { userProfile } = useUserStore();
  const { setUsers } = useMessageActionStore();

  // Use the dynamic stats hook
  const firebaseStats = useFirebaseStats();

  useEffect(() => {
    if (!userProfile) return;
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersRef,
      (querySnapshot) => {
        const usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
      },
      (error) => {
        console.error("Error fetching users:", error);
      }
    );
    return () => unsubscribe();
  }, [userProfile, setUsers]);

  // Dynamic stats configuration
  const stats = [
    {
      title: "Total Users",
      value: firebaseStats.loading ? "..." : firebaseStats.totalUsers,
      icon: Users,
      description: "Registered users",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      trend: firebaseStats.totalUsers > 0 ? "up" : "neutral",
    },
    // {
    //   title: "Active Chats",
    //   value: firebaseStats.loading ? "..." : firebaseStats.activeChats,
    //   icon: MessageSquare,
    //   description: "All conversations",
    //   color: "text-chart-2",
    //   bgColor: "bg-chart-2/10",
    //   trend: "neutral",
    // },
    // {
    //   title: "Messages Today",
    //   value: firebaseStats.loading ? "..." : firebaseStats.messagesToday,
    //   icon: Activity,
    //   description: "Messages sent today",
    //   color: "text-chart-3",
    //   bgColor: "bg-chart-3/10",
    //   trend:
    //     firebaseStats.messagesToday > firebaseStats.messagesThisWeek / 7
    //       ? "up"
    //       : "down",
    // },
    {
      title: "Active Users",
      value: firebaseStats.loading ? "..." : firebaseStats.onlineUsers,
      icon: TrendingUp,
      description: "Currently active",
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      trend: "neutral",
    },
  ];

  // Additional stats that could be useful
  const additionalStats = [
    // {
    //   title: "Messages This Week",
    //   value: firebaseStats.loading ? "..." : firebaseStats.messagesThisWeek,
    //   icon: Clock,
    //   description: "Weekly activity",
    //   color: "text-chart-5",
    //   bgColor: "bg-chart-5/10",
    // },
  ];

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <motion.div
          className="bg-card rounded-lg border shadow-sm p-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  <span className="hidden sm:inline">Welcome back,</span>{" "}
                  {userProfile.displayName}
                </h1>
                <Badge
                  className="capitalize"
                  variant={
                    userProfile.role === Roles.ADMIN
                      ? "default"
                      : userProfile.role === Roles.SUPER_ADMIN
                      ? "destructive"
                      : userProfile.role === Roles.HR
                      ? "secondary"
                      : "outline"
                  }
                >
                  {userProfile.role}
                </Badge>
                {firebaseStats.loading && (
                  <Badge variant="outline" className="animate-pulse">
                    Loading stats...
                  </Badge>
                )}
                {firebaseStats.error && (
                  <Badge variant="destructive">Stats error</Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Manage your system and monitor performance
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild>
                <a href="/dashboard" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Go to chats
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </motion.div>

        {(userProfile.role === Roles.SUPER_ADMIN ||
          userProfile.role === Roles.ADMIN) && (
          <>
            {/* System Controls */}
            <motion.div
              className="bg-card rounded-lg border shadow-sm p-6"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">System Maintenance</h3>
                    <p className="text-sm text-muted-foreground">
                      Toggle maintenance mode for system updates
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isSystemUnderMaintenance && (
                    <div className="flex items-center gap-2 text-orange-500">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                  )}
                  <Switch
                    checked={isSystemUnderMaintenance}
                    onCheckedChange={handleMaintenanceToggle}
                    aria-label="Toggle maintenance mode"
                  />
                </div>
              </div>

              {isSystemUnderMaintenance && (
                <motion.div
                  className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Maintenance mode is active - Users will see the
                      maintenance page
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </>
        )}

        <Separator />

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 * (index + 2) }}
              >
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <IconComponent className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold">
                        {typeof stat.value === "number"
                          ? stat.value.toLocaleString()
                          : stat.value}
                      </div>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground">
                          {stat.description}
                        </p>
                        {stat.trend === "up" && (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Stats */}
        {!firebaseStats.loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {additionalStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 + 0.1 * index }}
                >
                  <Card className="hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <IconComponent className={`h-4 w-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold">
                          {typeof stat.value === "number"
                            ? stat.value.toLocaleString()
                            : stat.value}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {stat.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Error Display */}
        {firebaseStats.error && (
          <motion.div
            className="bg-destructive/10 border border-destructive/20 rounded-lg p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm text-destructive">
              Error loading stats: {firebaseStats.error}
            </p>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          className="bg-card rounded-lg border shadow-sm p-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link to={"/admin/management"}>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                View All Users ({firebaseStats.totalUsers})
              </Button>
            </Link>
            {/* <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Analytics
            </Button>
            <Button variant="outline" size="sm">
              <Server className="h-4 w-4 mr-2" />
              System Logs
            </Button> */}
            <Link to={"/admin/settings"}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
