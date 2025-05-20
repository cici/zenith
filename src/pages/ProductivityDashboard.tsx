import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Dashboard from '@/components/Dashboard';
import MainLayout from '@/layouts/MainLayout';
import DashboardTabs from '@/components/DashboardTabs';
import templateService from '@/services/TemplateService';

const PRODUCTIVITY_TEMPLATE_ID = 'productivity-default';

const ProductivityDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter') || '';
  const view = searchParams.get('view') || 'default';

  // Error state for template loading
  const [templateError, setTemplateError] = useState<string | null>(null);

  let template;
  try {
    template = templateService.getTemplateById(PRODUCTIVITY_TEMPLATE_ID);
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
        filter={filter}
        view={view}
      />
    </MainLayout>
  );
};

export default ProductivityDashboard; 