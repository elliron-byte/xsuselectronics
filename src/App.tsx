import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Team from "./pages/Team";
import Devices from "./pages/Devices";
import AdminDashboard from "./pages/AdminDashboard";
import IncomeRecord from "./pages/IncomeRecord";
import RechargeRecord from "./pages/RechargeRecord";
import WithdrawRecord from "./pages/WithdrawRecord";
import BonusCode from "./pages/BonusCode";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/team" element={<Team />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/income-record" element={<IncomeRecord />} />
          <Route path="/recharge-record" element={<RechargeRecord />} />
          <Route path="/withdraw-record" element={<WithdrawRecord />} />
          <Route path="/bonus-code" element={<BonusCode />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
