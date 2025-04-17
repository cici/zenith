
import { Home, BarChart, Calendar, BookOpen, Music, Utensils, User, Settings } from "lucide-react";
import { 
  Sidebar, 
  SidebarContent,
  SidebarHeader,
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarFooter,
  useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: Home, label: "Dashboard", active: true },
  { icon: BarChart, label: "Analytics" },
  { icon: Calendar, label: "Calendar" },
  { icon: BookOpen, label: "Reading" },
  { icon: Music, label: "Guitar" },
  { icon: Utensils, label: "Meals" },
  { icon: User, label: "Profile" },
];

export function MainSidebar() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <Sidebar>
      <SidebarHeader className="py-6">
        <div className="flex items-center justify-center mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
            Zenith
          </h2>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton 
                asChild 
                isActive={item.active}
                tooltip={item.label}
              >
                <a href={item.label === "Dashboard" ? "/" : `/${item.label.toLowerCase()}`}>
                  <item.icon />
                  <span>{item.label}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="px-3 py-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2"
          onClick={() => {}}
        >
          <Settings size={16} />
          <span>Settings</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
