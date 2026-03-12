import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Batches from "./pages/Batches";
import Notifications from "./pages/Notifications";
import Scanner from "./pages/Scanner";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import { useBatchStatusRealtime } from "@/lib/queries";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 30 * 1000,
    },
  },
});

// Отдельный компонент чтобы хук мог использовать QueryClient из провайдера
function AppRoutes() {
  // Одна Realtime-подписка на всё приложение —
  // при смене статуса партии в БД UI обновляется автоматически
  useBatchStatusRealtime();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppRoutes />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
