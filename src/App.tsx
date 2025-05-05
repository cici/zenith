import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import LoginForm from "@/components/LoginForm";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { TodoProvider } from '@/contexts/TodoContext';

const queryClient = new QueryClient();

// Wrap TodoProvider inside the routes so it can access the auth context
const AppContent = () => {
  const { user } = useAuth();
  const userId = user?.id || 'demo-user';

  return (
    <TodoProvider userId={userId}>
      <BrowserRouter>
        <Routes>
          {/* Temporarily redirect root to /index to bypass login (Task #11) */}
          <Route path="/" element={<Navigate to="/index" replace />} />
          {/* Original Login Route - commented out for now
          <Route path="/" element={<LoginForm />} />
          */}
          <Route
            path="/index"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TodoProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="zenith-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

