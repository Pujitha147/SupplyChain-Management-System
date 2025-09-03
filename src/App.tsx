import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Verify from "./pages/Verify";
import Report from "./pages/Report";
import NotFound from "./pages/NotFound";
// Admin pages
import AdminUsers from "./pages/admin/Users";
import AdminReports from "./pages/admin/Reports";
import AdminAnalytics from "./pages/admin/Analytics";
// Manufacturer pages
import ManufacturerMedicines from "./pages/manufacturer/Medicines";
import ManufacturerBatches from "./pages/manufacturer/Batches";
import ManufacturerTransactions from "./pages/manufacturer/Transactions";
// Distributor pages
import DistributorInventory from "./pages/distributor/Inventory";
import DistributorShipments from "./pages/distributor/Shipments";
// Retailer pages
import RetailerInventory from "./pages/retailer/Inventory";
import RetailerSales from "./pages/retailer/Sales";
// Profile page
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/report" element={<Report />} />
            
            {/* Admin routes */}
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            
            {/* Manufacturer routes */}
            <Route path="/manufacturer/medicines" element={<ManufacturerMedicines />} />
            <Route path="/manufacturer/batches" element={<ManufacturerBatches />} />
            <Route path="/manufacturer/transactions" element={<ManufacturerTransactions />} />
            
            {/* Distributor routes */}
            <Route path="/distributor/inventory" element={<DistributorInventory />} />
            <Route path="/distributor/shipments" element={<DistributorShipments />} />
            
            {/* Retailer routes */}
            <Route path="/retailer/inventory" element={<RetailerInventory />} />
            <Route path="/retailer/sales" element={<RetailerSales />} />
            
            {/* Profile route */}
            <Route path="/profile" element={<Profile />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
