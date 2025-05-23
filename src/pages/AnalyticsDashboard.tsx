import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Dashboard from '@/components/Dashboard';
import AddWidgetDialog from '@/components/AddWidgetDialog';
import { MainSidebar } from '@/components/Sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import Header from '@/components/Header';
import DashboardTabs from '@/components/DashboardTabs';
import { useDashboardStore } from '@/store/dashboardStore';
import { useToast } from '@/components/ui/use-toast';

// Example usage: /dashboard/analytics?period=month&view=detailed
const analyticsWidgetIds = ['practiceGoals', 'statisticsDashboard', 'todo'];

const ANALYTICS_TEMPLATE_ID = 'analytics-default';

const AnalyticsDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const period = searchParams.get('period') || 'week';
  const view = searchParams.get('view') || 'summary';

  // Zustand dashboard store
  const {
    dashboards,
    activeDashboardId,
    setActiveDashboard,
    addWidgetToDashboard,
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
        title: 'Widget already added',
        description: 'You cannot add the same widget more than once.',
        variant: 'destructive',
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

  if (!activeDashboard) {
    return (
      <SidebarProvider>
        <div className="min-h-screen h-full w-full flex bg-muted">
          <MainSidebar />
          <div className="flex-1 flex flex-col w-full h-full">
            <Header onAddWidgetClick={() => setIsAddWidgetOpen(true)} />
            <DashboardTabs />
            <div className="flex flex-col items-center justify-center min-h-[300px] text-red-600 font-semibold">
              <span>No active dashboard found.</span>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen h-full w-full flex bg-muted">
        <MainSidebar />
        <div className="flex-1 flex flex-col w-full h-full">
          <Header onAddWidgetClick={() => setIsAddWidgetOpen(true)} />
          <DashboardTabs />
          <main className="flex-1 flex flex-col w-full h-full p-6">
            <Dashboard
              dashboardId={activeDashboard.id}
              widgets={widgets}
              period={period}
              view={view}
            />
            <AddWidgetDialog
              open={isAddWidgetOpen}
              onOpenChange={setIsAddWidgetOpen}
              onAddWidget={handleAddWidget}
              dashboardId={activeDashboard.id}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AnalyticsDashboard; 