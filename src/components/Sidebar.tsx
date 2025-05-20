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
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import { ROUTES } from "@/routes/routes";
import { NavLink } from "react-router-dom";

const dashboardMenuItems = [
  { icon: Home, label: "Productivity", to: ROUTES.DASHBOARD.PRODUCTIVITY },
  { icon: BarChart, label: "Analytics", to: ROUTES.DASHBOARD.ANALYTICS },
  { icon: User, label: "Wellness", to: ROUTES.DASHBOARD.WELLNESS },
];

const otherMenuItems = [
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: BookOpen, label: "Reading", href: "/reading" },
  { icon: Music, label: "Guitar", href: "/guitar" },
  { icon: Utensils, label: "Meals", href: "/meals" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function MainSidebar() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <nav aria-label="Main navigation" className="bg-[#262e35] text-[#e9ecef] w-60 min-h-screen flex flex-col font-[Poppins]">
      <div className="py-6">
        <div className="flex items-center justify-center mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent tracking-tight font-[Poppins]">
            Zenith
          </h2>
        </div>
      </div>
      <div className="flex-1">
        <ul className="space-y-1 px-2">
          {dashboardMenuItems.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-400 font-[Poppins] text-[13.5px] font-medium tracking-wide ` +
                  (isActive
                    ? "bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-white shadow-md font-bold"
                    : "hover:bg-[#343a40] hover:text-white text-[#adb5bd]")
                }
                tabIndex={0}
              >
                <item.icon size={18} className="mr-2" />
                {item.label}
              </NavLink>
            </li>
          ))}
          {otherMenuItems.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="group flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-400 text-[13.5px] font-medium font-[Poppins] tracking-wide hover:bg-[#343a40] hover:text-white text-[#adb5bd]"
                tabIndex={0}
              >
                <item.icon size={18} className="mr-2" />
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
