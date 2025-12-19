import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BlockedUserProvider } from "@/hooks/useBlockedUser";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Team from "./pages/Team";
import Devices from "./pages/Devices";
import AdminDashboard from "./pages/AdminDashboard";
import UserReferrals from "./pages/UserReferrals";
import IncomeRecord from "./pages/IncomeRecord";
import RechargeRecord from "./pages/RechargeRecord";
import WithdrawRecord from "./pages/WithdrawRecord";
import BonusCode from "./pages/BonusCode";
import Withdrawal from "./pages/Withdrawal";
import WithdrawalAccounts from "./pages/WithdrawalAccounts";
import Recharge from "./pages/Recharge";
import OperatorSelection from "./pages/OperatorSelection";
import PaymentConfirmation from "./pages/PaymentConfirmation";
import About from "./pages/About";
import AboutCompany from "./pages/AboutCompany";
import AdminAboutContent from "./pages/AdminAboutContent";
import CustomerService from "./pages/CustomerService";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper for protected user routes that checks blocked status
const ProtectedUserRoute = ({ children }: { children: React.ReactNode }) => (
  <BlockedUserProvider>{children}</BlockedUserProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedUserRoute><Dashboard /></ProtectedUserRoute>} />
          <Route path="/profile" element={<ProtectedUserRoute><Profile /></ProtectedUserRoute>} />
          <Route path="/team" element={<ProtectedUserRoute><Team /></ProtectedUserRoute>} />
          <Route path="/devices" element={<ProtectedUserRoute><Devices /></ProtectedUserRoute>} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/referrals/:uniqueCode" element={<UserReferrals />} />
          <Route path="/admin/about-content" element={<AdminAboutContent />} />
          <Route path="/income-record" element={<ProtectedUserRoute><IncomeRecord /></ProtectedUserRoute>} />
          <Route path="/recharge-record" element={<ProtectedUserRoute><RechargeRecord /></ProtectedUserRoute>} />
          <Route path="/withdraw-record" element={<ProtectedUserRoute><WithdrawRecord /></ProtectedUserRoute>} />
          <Route path="/bonus-code" element={<ProtectedUserRoute><BonusCode /></ProtectedUserRoute>} />
          <Route path="/withdrawal" element={<ProtectedUserRoute><Withdrawal /></ProtectedUserRoute>} />
          <Route path="/withdrawal-accounts" element={<ProtectedUserRoute><WithdrawalAccounts /></ProtectedUserRoute>} />
          <Route path="/recharge" element={<ProtectedUserRoute><Recharge /></ProtectedUserRoute>} />
          <Route path="/operator-selection" element={<ProtectedUserRoute><OperatorSelection /></ProtectedUserRoute>} />
          <Route path="/payment-confirmation" element={<ProtectedUserRoute><PaymentConfirmation /></ProtectedUserRoute>} />
          <Route path="/about" element={<ProtectedUserRoute><About /></ProtectedUserRoute>} />
          <Route path="/about-company" element={<ProtectedUserRoute><AboutCompany /></ProtectedUserRoute>} />
          <Route path="/customer-service" element={<ProtectedUserRoute><CustomerService /></ProtectedUserRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
