import React, { useState, useEffect } from "react";
import Dashboard from '@/components/Dashboard';
import AddWidgetDialog from '@/components/AddWidgetDialog';
import { MainSidebar } from '@/components/Sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import Header from '@/components/Header';
import { useToast } from "@/components/ui/use-toast";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import DynamicBreadcrumbs from "@/components/ui/DynamicBreadcrumbs";

const Index: React.FC = () => {
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [widgetPositions, setWidgetPositions] = useState<{[key: string]: string}>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('widgetPositions') : null;
    return saved ? JSON.parse(saved) : { '1': 'todo', '2': 'pomodoro', '3': 'weather', '4': 'exercise' };
  });
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('widgetPositions', JSON.stringify(widgetPositions));
    }
  }, [widgetPositions]);

  const handleAddWidget = (type: string) => {
    // Prevent duplicate widgets
    if (Object.values(widgetPositions).includes(type)) {
      toast({
        title: "Widget already added",
        description: "You cannot add the same widget more than once.",
        variant: "destructive",
      });
      setIsAddWidgetOpen(false);
      return;
    }
    // Find the next available position key
    const nextId = (Math.max(0, ...Object.keys(widgetPositions).map(Number)) + 1).toString();
    setWidgetPositions(prev => ({ ...prev, [nextId]: type }));
    setIsAddWidgetOpen(false);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen h-full w-full flex bg-muted">
        <MainSidebar />
        <div className="flex-1 flex flex-col w-full h-full">
          <Header onAddWidgetClick={() => setIsAddWidgetOpen(true)} />
          <DynamicBreadcrumbs />
          <main className="flex-1 flex flex-col w-full h-full p-6">
            <Dashboard widgetPositions={widgetPositions} setWidgetPositions={setWidgetPositions} />
            <AddWidgetDialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen} onAddWidget={handleAddWidget} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
