import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { MainSidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Sun, Moon, User } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <MainSidebar />
        <SidebarInset className="bg-gradient-to-b from-background to-background/95 w-full">
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-b-muted/20 py-4">
            <div className="container flex items-center justify-between px-8 max-w-[2000px] mx-auto w-full">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">Dashboard</h2>
              </div>
              <div className="flex items-center gap-6">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleTheme}
                  className="bg-muted/30 border-border/50"
                  title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </Button>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/placeholder.svg" alt="User avatar" />
                    <AvatarFallback>
                      <User size={20} />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                    John Doe
                  </span>
                </div>
              </div>
            </div>
          </header>
          <main className="container py-6 px-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
} 