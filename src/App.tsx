import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import ProfilePage from "@/pages/Profile";
import ThemeManagerPage from "@/pages/ThemeManager";
import AccountManagerPage from "@/pages/AccountManager";
import LoginForm from "@/components/LoginForm";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { TodoProvider } from '@/contexts/TodoContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { defaultThemeConfig } from "@/types/theme";
import { Suspense, lazy } from "react";
import DashboardLoader from "@/components/ui/DashboardLoader";
import { ROUTES } from "@/routes/routes";

const queryClient = new QueryClient();

// Wrap TodoProvider inside the routes so it can access the auth context
const AppContent = () => {
  const { user } = useAuth();
  const userId = user?.id || 'demo-user';

  const ProductivityDashboard = lazy(() => import("@/pages/ProductivityDashboard"));
  const WellnessDashboard = lazy(() => import("@/pages/WellnessDashboard"));
  const AnalyticsDashboard = lazy(() => import("@/pages/AnalyticsDashboard"));

  return (
    <TimerProvider>
      <TodoProvider userId={userId}>
        <BrowserRouter>
          <Routes>
            {/* Temporarily redirect root to /index to bypass login (Task #11) */}
            <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.INDEX} replace />} />
            {/* Original Login Route - commented out for now
            <Route path={ROUTES.ROOT} element={<LoginForm />} />
            */}
            <Route
              path={ROUTES.INDEX}
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.PROFILE}
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.THEME}
              element={
                <ProtectedRoute>
                  <ThemeManagerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ACCOUNT}
              element={
                <ProtectedRoute>
                  <AccountManagerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.DASHBOARD.PRODUCTIVITY}
              element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardLoader />}>
                    <ProductivityDashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.DASHBOARD.WELLNESS}
              element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardLoader />}>
                    <WellnessDashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.DASHBOARD.ANALYTICS}
              element={
                <ProtectedRoute>
                  <Suspense fallback={<DashboardLoader />}>
                    <AnalyticsDashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TodoProvider>
    </TimerProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider defaultTheme={defaultThemeConfig}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

