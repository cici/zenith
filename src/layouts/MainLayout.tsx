import { ReactNode, useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { MainSidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { User, Settings, LogOut, Palette, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getProfileById } from '@/services/profileService';
import { WeatherWidget } from '@/components/widgets/WeatherWidget';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Fetch user profile to get avatar URL
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (user && user.id !== 'demo-user') {
        try {
          const profile = await getProfileById(user.id);
          if (profile?.avatar_url) {
            setAvatarUrl(profile.avatar_url);
          }
        } catch (error) {
          console.error('Error fetching user avatar:', error);
        }
      }
    };
    
    fetchUserAvatar();
  }, [user]);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <MainSidebar />
        <SidebarInset className="bg-gradient-to-b from-background to-background/95 w-full">
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-b-muted/20 py-4">
            <div className="container flex items-center justify-between px-8 max-w-[2000px] mx-auto w-full">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">Dashboard</h2>
              </div>
              <div className="flex items-center gap-6">
                <ThemeToggle />
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex items-center gap-3 cursor-pointer">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={avatarUrl || "/placeholder.svg"} alt="User avatar" />
                          <AvatarFallback>
                            <User size={20} />
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                          {user?.user_metadata?.name || 'User Profile'}
                        </span>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/account" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Account Security</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/theme" className="cursor-pointer">
                          <Palette className="mr-2 h-4 w-4" />
                          <span>Theme Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </header>
          <main className="container py-6 px-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
} 