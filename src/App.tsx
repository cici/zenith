
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "@/components/LoginForm";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { isSupabaseConfigured } from "@/services/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

const queryClient = new QueryClient();

const ConfigWarning = () => {
  if (isSupabaseConfigured()) return null;
  
  return (
    <Alert variant="destructive" className="mb-4 mx-4 mt-4">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertTitle>Supabase Configuration Missing</AlertTitle>
      <AlertDescription>
        Supabase URL and/or Anon Key are not set. Please create a .env file with VITE_SUPABASE_URL and 
        VITE_SUPABASE_ANON_KEY variables, or connect to Supabase via the Supabase integration button.
      </AlertDescription>
    </Alert>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="zenith-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <ConfigWarning />
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
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
