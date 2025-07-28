import { SidebarProvider, SidebarTrigger } from "../../components/ui/sidebar";
import { DashboardSidebar } from "@/admin/components/DashboardSidebar";

export default function Layout({ children }) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main className="w-full">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
