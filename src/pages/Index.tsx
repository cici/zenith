
import { useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Plus } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/Sidebar";
import TodoWidget from "@/components/widgets/TodoWidget";
import ExerciseWidget from "@/components/widgets/ExerciseWidget";
import AddWidgetDialog from "@/components/AddWidgetDialog";

const Index = () => {
  const { theme, toggleTheme } = useTheme();
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
        return <Card key={widget.id}>Unknown Widget Type</Card>;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <MainSidebar />
        <SidebarInset className="bg-gradient-to-b from-background to-background/95">
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-b-muted/20 py-3">
            <div className="container flex items-center justify-between px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <h2 className="text-xl font-semibold">Dashboard</h2>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleTheme}
                  className="bg-muted/30 border-border/50"
                  title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </Button>
              </div>
            </div>
          </header>

          <main className="container py-6 px-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">Your Dashboard</h2>
              
              <Button 
                onClick={() => setIsAddWidgetOpen(true)} 
                className="gap-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <Plus size={16} />
                Add Widget
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
          </main>

          <AddWidgetDialog
            open={isAddWidgetOpen}
            onOpenChange={setIsAddWidgetOpen}
            onAddWidget={addWidget}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
