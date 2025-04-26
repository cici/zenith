
import React, { useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Plus, User } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <MainSidebar />
        <SidebarInset className="bg-gradient-to-b from-background to-background/95 w-full">
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-b-muted/20 py-4">
            <div className="flex items-center justify-between px-8 max-w-[2000px] mx-auto w-full">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <h2 className="text-2xl font-semibold">Dashboard</h2>
              </div>
              
              <div className="flex items-center gap-6">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleTheme}
                  className="bg-muted/30 border-border/50"
                  title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </Button>
                
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/placeholder.svg" alt="User avatar" />
                    <AvatarFallback>
                      <User size={20} />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-base font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                    John Doe
                  </span>
                </div>
              </div>
            </div>
          </header>

          <main className="py-8 px-8 overflow-y-auto max-w-[2000px] mx-auto w-full" style={{ height: "calc(100vh - 73px)" }}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                Your Dashboard
              </h2>
              
              <Button 
                onClick={() => setIsAddWidgetOpen(true)} 
                className="gap-2 px-4 py-2 text-base bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <Plus size={18} />
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
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
