import React, { useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import TodoWidget from "@/components/widgets/TodoWidget";
import ExerciseWidget from "@/components/widgets/ExerciseWidget";
import AddWidgetDialog from "@/components/AddWidgetDialog";
import MainLayout from "@/layouts/MainLayout";
import Dashboard from '@/components/Dashboard';

const Index: React.FC = () => {
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [widgets, setWidgets] = useState([
    {
      id: 'todo-1',
      type: 'todo',
      title: 'To-Do List',
      color: 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-400/30'
    },
    {
      id: 'exercise-1',
      type: 'exercise',
      title: 'Exercise Tracking',
      color: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/30'
    }
  ]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addWidget = (type: string) => {
    const newId = `${type}-${Date.now()}`;
    let title = '';
    let color = '';
    switch (type) {
      case 'todo':
        title = 'To-Do List';
        color = 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-400/30';
        break;
      case 'exercise':
        title = 'Exercise Tracking';
        color = 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/30';
        break;
      default:
        title = 'New Widget';
        color = 'bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-gray-400/30';
    }
    setWidgets([
      ...widgets,
      {
        id: newId,
        type,
        title,
        color
      }
    ]);
    setIsAddWidgetOpen(false);
  };

  const renderWidget = (widget: any) => {
    switch (widget.type) {
      case 'todo':
        return <TodoWidget key={widget.id} id={widget.id} title={widget.title} color={widget.color} />;
      case 'exercise':
        return <ExerciseWidget key={widget.id} id={widget.id} title={widget.title} color={widget.color} />;
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <Dashboard />
      <div className="flex justify-between items-center mb-6">
        <Button 
          onClick={() => setIsAddWidgetOpen(true)} 
          className="gap-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          + Add Widget
        </Button>
      </div>
      <DndContext 
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={widgets.map((w) => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets.map(renderWidget)}
          </div>
        </SortableContext>
      </DndContext>
      <AddWidgetDialog
        open={isAddWidgetOpen}
        onOpenChange={setIsAddWidgetOpen}
        onAddWidget={addWidget}
      />
    </MainLayout>
  );
};

export default Index;
