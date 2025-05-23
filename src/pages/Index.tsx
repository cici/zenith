import React, { useState } from "react";
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
import { useDashboardStore } from '@/store/dashboardStore';

const Index: React.FC = () => {
  const {
    dashboards,
    activeDashboardId,
    setActiveDashboard,
    addWidgetToDashboard,
    createDashboard,
  } = useDashboardStore();
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const { toast } = useToast();

  // Get the active dashboard and its widgets
  const activeDashboard = dashboards.find(d => d.id === activeDashboardId) || dashboards[0];
  const widgets = activeDashboard?.widgets || [];

  // Handler for adding a widget
  const handleAddWidget = (type: string) => {
    if (!activeDashboard) return;
    if (widgets.some(w => w.type === type)) {
      toast({
        title: "Widget already added",
        description: "You cannot add the same widget more than once.",
        variant: "destructive",
      });
      setIsAddWidgetOpen(false);
      return;
    }
    // Create a new widget object (customize as needed)
    const newWidget = {
      id: Date.now().toString(),
      user_id: 'demo-user',
      dashboard_id: activeDashboard.id,
      type,
      config: {},
      position: widgets.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addWidgetToDashboard(activeDashboard.id, newWidget);
    setIsAddWidgetOpen(false);
  };

  // Handler for dashboard selection
  const handleDashboardSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveDashboard(e.target.value);
  };

  // Handler for creating a new dashboard
  const handleCreateDashboard = async () => {
    await createDashboard({ name: `Dashboard ${dashboards.length + 1}` });
    // Optionally set as active
    setActiveDashboard(dashboards[dashboards.length - 1]?.id);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen h-full w-full flex bg-muted">
        <MainSidebar />
        <div className="flex-1 flex flex-col w-full h-full">
          <Header onAddWidgetClick={() => setIsAddWidgetOpen(true)} />
          <DynamicBreadcrumbs />
          <div className="flex items-center gap-4 p-4">
            <select value={activeDashboard?.id || ''} onChange={handleDashboardSelect} className="border rounded px-2 py-1">
              {dashboards.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button onClick={handleCreateDashboard} className="border rounded px-2 py-1">+ New Dashboard</button>
          </div>
          <main className="flex-1 flex flex-col w-full h-full p-6">
            {activeDashboard && (
              <Dashboard
                dashboardId={activeDashboard.id}
                widgets={widgets}
                // Pass other props as needed
              />
            )}
            {activeDashboard && (
              <AddWidgetDialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen} onAddWidget={handleAddWidget} dashboardId={activeDashboard.id} />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
