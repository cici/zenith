import React, { useState } from 'react';
import { Responsive, WidthProvider, Layouts, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import WidgetContainer from '@/components/WidgetContainer';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Define initial layouts for different breakpoints
const initialLayouts: Layouts = {
  lg: [
    { i: 'a', x: 0, y: 0, w: 4, h: 2, static: false, minW: 2, minH: 1, maxW: 6, maxH: 4 },
    { i: 'b', x: 4, y: 0, w: 4, h: 2, minW: 2, minH: 1, maxW: 8, maxH: 4 },
    { i: 'c', x: 8, y: 0, w: 4, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 4 },
    { i: 'd', x: 0, y: 2, w: 12, h: 2, minW: 3, minH: 1, maxW: 12, maxH: 4 },
  ],
  md: [
    { i: 'a', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 1, maxW: 5, maxH: 4 },
    { i: 'b', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 1, maxW: 5, maxH: 4 },
    { i: 'c', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 1, maxW: 5, maxH: 4 },
    { i: 'd', x: 0, y: 2, w: 9, h: 2, minW: 3, minH: 1, maxW: 9, maxH: 4 },
  ],
  sm: [
    { i: 'a', x: 0, y: 0, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 4 },
    { i: 'b', x: 0, y: 2, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 4 },
    { i: 'c', x: 0, y: 4, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 4 },
    { i: 'd', x: 0, y: 6, w: 6, h: 2, minW: 2, minH: 1, maxW: 6, maxH: 4 },
  ],
  xs: [
    { i: 'a', x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 4 },
    { i: 'b', x: 0, y: 2, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 4 },
    { i: 'c', x: 0, y: 4, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 4 },
    { i: 'd', x: 0, y: 6, w: 4, h: 2, minW: 2, minH: 1, maxW: 4, maxH: 4 },
  ],
  xxs: [ // You might need an xxs breakpoint depending on your design
    { i: 'a', x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 3 },
    { i: 'b', x: 0, y: 2, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 3 },
    { i: 'c', x: 0, y: 4, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 3 },
    { i: 'd', x: 0, y: 6, w: 2, h: 2, minW: 1, minH: 1, maxW: 2, maxH: 3 },
  ],
};

// Define breakpoints and corresponding column counts
const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const cols = { lg: 12, md: 9, sm: 6, xs: 4, xxs: 2 };

const Dashboard: React.FC = () => {
  const [layouts, setLayouts] = useState<Layouts>(initialLayouts);

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    // Note: `allLayouts` contains layouts for all breakpoints.
    // You might want to save only the layout for the current breakpoint or all of them.
    console.log('Current Layout:', currentLayout);
    console.log('All Layouts:', allLayouts);
    // Update the state for persistence or other logic
    setLayouts(allLayouts);
    // TODO: Implement saving layout changes (e.g., to Supabase as per task 3.4)
  };

  // Example widget data/config - replace with actual data fetching and widget rendering logic
  const widgets = [
    { id: 'a', title: 'Widget A', content: 'Content for Widget A', isLoading: false, error: undefined },
    { id: 'b', title: 'Widget B (Loading)', content: 'Content for Widget B', isLoading: true, error: undefined },
    { id: 'c', title: 'Widget C (Error)', content: 'Content for Widget C', isLoading: false, error: 'Failed to load data.' },
    { id: 'd', title: 'Widget D', content: 'Content for Widget D', isLoading: false, error: undefined },
  ];

  return (
    <div className="flex flex-col min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={150} // Adjust row height as needed
        margin={[10, 10]} // Margin between items [horizontal, vertical]
        containerPadding={[10, 10]} // Padding for the container [horizontal, vertical]
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle" // Specify the drag handle selector
        preventCollision={true}
        isDraggable={true}
        isResizable={true}
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="overflow-hidden"> {/* Outer div needed by react-grid-layout */}
            <WidgetContainer
              title={widget.title}
              isLoading={widget.isLoading}
              error={widget.error}
            >
              {/* Render actual widget content here */}
              {widget.content}
            </WidgetContainer>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default Dashboard; 