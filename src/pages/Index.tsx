
import { useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Plus, Settings } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import TodoWidget from "@/components/widgets/TodoWidget";
import ExerciseWidget from "@/components/widgets/ExerciseWidget";
import AddWidgetDialog from "@/components/AddWidgetDialog";

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const [widgets, setWidgets] = useState([
    { id: 'todo-1', type: 'todo', title: 'To-Do List' },
    { id: 'exercise-1', type: 'exercise', title: 'Exercise Tracking' }
  ]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addWidget = (type) => {
    const newId = `${type}-${Date.now()}`;
    let title = '';
    
    switch (type) {
      case 'todo':
        title = 'To-Do List';
        break;
      case 'exercise':
        title = 'Exercise Tracking';
        break;
      default:
        title = 'New Widget';
    }
    
    setWidgets([...widgets, { id: newId, type, title }]);
    setIsAddWidgetOpen(false);
  };

  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'todo':
        return <TodoWidget key={widget.id} id={widget.id} title={widget.title} />;
      case 'exercise':
        return <ExerciseWidget key={widget.id} id={widget.id} title={widget.title} />;
      default:
        return <Card key={widget.id}>Unknown Widget Type</Card>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b p-4">
        <div className="container flex items-center justify-between">
          <h1 className="text-2xl font-bold">Zenith</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleTheme} 
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              title="Settings"
            >
              <Settings size={18} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <Button onClick={() => setIsAddWidgetOpen(true)} className="gap-1">
            <Plus size={16} />
            Add Widget
          </Button>
        </div>

        <DndContext 
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {widgets.map(renderWidget)}
            </div>
          </SortableContext>
        </DndContext>
      </main>

      <AddWidgetDialog 
        open={isAddWidgetOpen} 
        onOpenChange={setIsAddWidgetOpen} 
        onAddWidget={addWidget} 
      />
    </div>
  );
};

export default Index;
