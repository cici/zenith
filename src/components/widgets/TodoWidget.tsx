
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Grip, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ResizableWidget from "@/components/ResizableWidget";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoWidgetProps {
  id: string;
  title: string;
  color?: string;
}

const TodoWidget = ({ id, title, color = "bg-card" }: TodoWidgetProps) => {
  const [todos, setTodos] = useState<Todo[]>([
    { id: "1", text: "Create a new widget", completed: true },
    { id: "2", text: "Design the dashboard", completed: false },
    { id: "3", text: "Add drag and drop", completed: false },
  ]);
  
  const [newTodo, setNewTodo] = useState("");
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    const todo = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false,
    };
    
    setTodos([...todos, todo]);
    setNewTodo("");
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ResizableWidget color={color} minSize={15} defaultSize={30}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="cursor-grab"
            {...attributes}
            {...listeners}
          >
            <Grip size={16} />
            <span className="sr-only">Move widget</span>
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={addTodo} className="flex space-x-2 mb-4">
            <Input
              placeholder="Add a new task..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              className="flex-1 bg-background/50"
            />
            <Button type="submit" size="sm" className="shrink-0 bg-primary/90 hover:bg-primary">
              <Plus size={16} />
            </Button>
          </form>
          
          <div className="space-y-1">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-5 w-5 rounded-full p-0 border-primary/50",
                      todo.completed && "bg-primary text-primary-foreground border-primary"
                    )}
                    onClick={() => toggleTodo(todo.id)}
                  >
                    {todo.completed && <Check size={12} />}
                    <span className="sr-only">Toggle todo</span>
                  </Button>
                  <span
                    className={cn(
                      "flex-1",
                      todo.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {todo.text}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => deleteTodo(todo.id)}
                >
                  <X size={14} />
                  <span className="sr-only">Delete todo</span>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </ResizableWidget>
    </div>
  );
};

export default TodoWidget;
