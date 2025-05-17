import React, { useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import TodoWidget from "@/components/widgets/TodoWidget";
import ExerciseWidget from "@/components/widgets/ExerciseWidget";
import AddWidgetDialog from "@/components/AddWidgetDialog";
import MainLayout from "@/layouts/MainLayout";
import Dashboard from '@/components/Dashboard';
import { WeatherWidget } from '@/components/widgets/WeatherWidget';
import WidgetContainer from '@/components/WidgetContainer';

const Index: React.FC = () => {
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);

  return (
    <MainLayout>
      <Dashboard onAddWidgetClick={() => setIsAddWidgetOpen(true)} />
    </MainLayout>
  );
};

export default Index;
