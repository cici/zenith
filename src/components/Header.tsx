import React from "react";
import { Bell, Settings, Plus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";

interface HeaderProps {
  onAddWidgetClick?: () => void;
  allowAddWidget?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onAddWidgetClick, allowAddWidget = true }) => {
  return (
    <header className="w-full flex items-center justify-between bg-white dark:bg-[#262e35] shadow-sm px-5 py-2.5 border-b border-[#e9ecef] dark:border-[#2c2c40] h-[60px] font-[Poppins]">
      {/* Left: Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight font-[Poppins] text-[#495057] dark:text-[#e9ecef]">
          Dashboard
          <span className="block h-1 w-12 mt-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 rounded-full" aria-hidden="true"></span>
        </h1>
        {onAddWidgetClick && allowAddWidget && (
          <Button size="sm" className="ml-2 font-[Poppins] text-[13.5px] font-medium tracking-wide flex items-center gap-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-white hover:opacity-90 transition" onClick={onAddWidgetClick} aria-label="Add Widget">
            <Plus className="w-4 h-4 mr-1" /> Add Widget
          </Button>
        )}
      </div>
      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative group focus-visible:ring-2 focus-visible:ring-cyan-400">
          <Bell className="w-5 h-5 text-[#495057] dark:text-[#e9ecef] group-hover:text-cyan-400 transition-colors duration-200" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 border-2 border-white dark:border-[#262e35]" aria-hidden="true"></span>
        </Button>
        <Button variant="ghost" size="icon" aria-label="Settings" className="focus-visible:ring-2 focus-visible:ring-cyan-400">
          <Settings className="w-5 h-5 text-[#495057] dark:text-[#e9ecef] hover:text-cyan-400 transition-colors duration-200" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-full">
              <Avatar>
                <AvatarImage src="/profile.jpg" alt="Profile" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header; 