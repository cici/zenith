import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Dashboard from '@/components/Dashboard';
import { widgets } from '@/data/widgets';
import MainLayout from '@/layouts/MainLayout';
import DashboardTabs from '@/components/DashboardTabs';
import templateService from '@/services/TemplateService';

// Example usage: /dashboard/analytics?period=month&view=detailed
const analyticsWidgetIds = ['practiceGoals', 'statisticsDashboard', 'todo'];

const ANALYTICS_TEMPLATE_ID = 'analytics-default';

const AnalyticsDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const period = searchParams.get('period') || 'week';
  const view = searchParams.get('view') || 'summary';

  // Error state for template loading
  const [templateError, setTemplateError] = useState<string | null>(null);

  let template;
  try {
    template = templateService.getTemplateById(ANALYTICS_TEMPLATE_ID);
  } catch (err: any) {
    template = null;
    setTimeout(() => setTemplateError(err.message || 'Failed to load dashboard template.'), 0);
  }

  // Customization state: widget positions (id -> type)
  const [widgetPositions, setWidgetPositions] = useState<{ [key: string]: string }>(
    template ? Object.fromEntries(template.widgets.map(w => [w.id, w.type])) : {}
  );

  // Reset to template defaults
  const handleReset = () => {
    if (template) {
      setWidgetPositions(Object.fromEntries(template.widgets.map(w => [w.id, w.type])));
    }
  };

  // Optionally filter widgets if Dashboard expects a registry
  // const analyticsWidgets = widgets.filter(w => analyticsWidgetIds.includes(w.id));

  if (templateError) {
    return (
      <MainLayout>
        <DashboardTabs />
        <div className="flex flex-col items-center justify-center min-h-[300px] text-red-600 font-semibold">
          <span>Error: {templateError}</span>
        </div>
      </MainLayout>
    );
  }

  if (!template) {
    return null; // Or a loading spinner
  }

  return (
    <MainLayout>
      <DashboardTabs />
      <div className="flex justify-end mb-2">
        <button
          className="px-3 py-1 rounded bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 text-white font-[Poppins] text-sm shadow hover:opacity-90"
          onClick={handleReset}
        >
          Reset to Template Defaults
        </button>
      </div>
      <Dashboard
        template={template}
        widgetPositions={widgetPositions}
        setWidgetPositions={setWidgetPositions}
        period={period}
        view={view}
        // widgets={analyticsWidgets} // If Dashboard supports a widgets prop
        // layoutName="analytics" // If Dashboard supports a layoutName prop
      />
    </MainLayout>
  );
};

export default AnalyticsDashboard; 