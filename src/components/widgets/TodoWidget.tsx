import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Trash2, GripVertical, Plus, Settings } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
};

type TodoWidgetProps = {
  id: string;
  title: string;
};

const TodoWidget = ({ id, title }: TodoWidgetProps) => {
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: '1', text: 'Create dashboard layout', completed: true },
    { id: '2', text: 'Implement dark mode', completed: false },
    { id: '3', text: 'Add drag and drop functionality', completed: false },
  ]);
  const [newTodo, setNewTodo] = useState('');

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: Date.now().toString(), text: newTodo, completed: false }]);
      setNewTodo('');
    }
  };

  const toggleTodo = (todoId: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (todoId: string) => {
    setTodos(todos.filter((todo) => todo.id !== todoId));
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const completionPercentage = todos.length > 0 
    ? Math.round((completedCount / todos.length) * 100) 
    : 0;

  return (
    <Card ref={setNodeRef} style={style} className="shadow-md">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <div className="flex items-center">
          <div {...attributes} {...listeners} className="cursor-grab mr-2">
            <GripVertical size={16} className="text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" title="Widget Settings">
          <Settings size={14} />
        </Button>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="mb-4">
          <Progress value={completionPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {completedCount} of {todos.length} tasks completed
          </div>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {todos.map((todo) => (
            <div key={todo.id} className="flex items-center group">
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-full border ${
                  todo.completed ? "bg-primary border-primary" : "border-input"
                }`}
                onClick={() => toggleTodo(todo.id)}
              >
                {todo.completed && <Check size={12} className="text-primary-foreground" />}
              </Button>
              <span
                className={`ml-2 flex-grow ${
                  todo.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {todo.text}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={() => deleteTodo(todo.id)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTodo();
          }}
          className="flex w-full gap-2"
        >
          <Input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a task..."
            className="text-sm"
          />
          <Button type="submit" size="icon" disabled={!newTodo.trim()}>
            <Plus size={16} />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default TodoWidget;
