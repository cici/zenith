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
          {menuItems.map((item) => (
            <li key={item.label}>
              <a
                href={item.label === "Dashboard" ? "/" : `/${item.label.toLowerCase()}`}
                className={
                  `group flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-400 ` +
                  (item.active
                    ? "bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-white shadow-md relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-purple-500 before:via-blue-500 before:to-cyan-400 before:rounded-l-lg"
                    : "hover:bg-[#343a40] hover:text-white")
                }
                aria-current={item.active ? "page" : undefined}
                tabIndex={0}
              >
                <item.icon size={18} className={item.active ? "text-white" : "text-[#adb5bd] group-hover:text-white transition-colors duration-200"} />
                <span className="text-[13.5px] font-medium font-[Poppins] tracking-wide">
                  {item.label}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="px-3 py-4 mt-auto">
        <button
          className="w-full flex items-center gap-2 text-[#adb5bd] hover:text-white hover:bg-[#343a40] rounded-lg px-4 py-2 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
          aria-label="Settings"
        >
          <Settings size={18} />
          <span className="text-[13.5px] font-medium font-[Poppins] tracking-wide">Settings</span>
        </button>
      </div>
    </nav>
  );
}
