import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Home, Inbox, Settings, MessageCircleMore } from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";
import { Roles } from "@/scripts/roles";

export function DashboardSidebar() {
  const { userProfile } = useUserStore();
  const items = [
    { title: "Home", url: "/admin/home", icon: Home },
    { title: "User Management", url: "/admin/management", icon: Inbox },
    { title: "Settings", url: "/admin/settings", icon: Settings },
    ...(userProfile.role === Roles.SUPER_ADMIN
      ? [
          {
            title: "AllChats",
            url: "/admin/dsad45fdfdsf34534543dfgfdg54534fdgdfghfh645",
            icon: MessageCircleMore,
          },
        ]
      : []),
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ADMIN DASHBOARD</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
