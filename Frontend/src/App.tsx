import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Components
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Inventory Pages
import Items from './pages/inventory/Items';
import BOMs from './pages/inventory/BOMs';
import Locations from './pages/inventory/Locations';
import Warehouses from './pages/inventory/Warehouses';
import InventoryTransfer from './pages/inventory/InventoryTransfer';
import InventoryLedger from './pages/inventory/Ledger';
import InventoryValuation from './pages/inventory/Valuation';

// Purchase Pages
import PurchaseOrders from './pages/purchases/Orders';
import Vendors from './pages/purchases/Vendors';

// Sales Pages
import SalesOrders from './pages/sales/Orders';
import Customers from './pages/sales/Customers';

// Production Pages
import ProductionOrders from './pages/production/Orders';
import WipSummary from './pages/production/WipSummary';

// Reports
import Reports from './pages/Reports';

// User Management
import UserManagement from './pages/UserManagement';

// Cash Management Pages  
import Cashbook from './pages/cash/Cashbook';
import CustomerPayments from './pages/cash/CustomerPayments';
import VendorPayments from './pages/cash/VendorPayments';
import SalesReceipts from './pages/cash/SalesReceipts';
import PurchasePayments from './pages/cash/PurchasePayments';

// Management Pages
import CompanySettings from './pages/management/CompanySettings';
import SystemSettings from './pages/management/SystemSettings';
import FiscalCalendar from './pages/management/FiscalCalendar';
import ApprovalFlows from './pages/management/ApprovalFlows';
import RoleManagement from './pages/management/RoleManagement';
import EnhancedUserManagement from './pages/management/EnhancedUserManagement';
import ChartOfAccounts from './pages/management/ChartOfAccounts';
import CashAccountManagement from './pages/management/CashAccountManagement';

// Asset Pages
import AssetDashboard from './pages/assets/AssetDashboard';
import AssetRegister from './pages/assets/AssetRegister';
import AssetCategories from './pages/assets/AssetCategories';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
}

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/" replace /> : <Login />
              } 
            />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            {/* Inventory Routes */}
            <Route path="/inventory/items" element={
              <ProtectedRoute>
                <Items />
              </ProtectedRoute>
            } />
            <Route path="/inventory/boms" element={
              <ProtectedRoute>
                <BOMs />
              </ProtectedRoute>
            } />
            <Route path="/inventory/locations" element={
              <ProtectedRoute>
                <Locations />
              </ProtectedRoute>
            } />
            <Route path="/inventory/warehouses" element={
              <ProtectedRoute>
                <Warehouses />
              </ProtectedRoute>
            } />
            <Route path="/inventory/transfers" element={
              <ProtectedRoute>
                <InventoryTransfer />
              </ProtectedRoute>
            } />
            <Route path="/inventory/ledger" element={
              <ProtectedRoute>
                <InventoryLedger />
              </ProtectedRoute>
            } />
            <Route path="/inventory/valuation" element={
              <ProtectedRoute>
                <InventoryValuation />
              </ProtectedRoute>
            } />
            
            {/* Purchase Routes */}
            <Route path="/purchases/orders" element={
              <ProtectedRoute>
                <PurchaseOrders />
              </ProtectedRoute>
            } />
            <Route path="/purchases/vendors" element={
              <ProtectedRoute>
                <Vendors />
              </ProtectedRoute>
            } />
            
            {/* Sales Routes */}
            <Route path="/sales/orders" element={
              <ProtectedRoute>
                <SalesOrders />
              </ProtectedRoute>
            } />
            <Route path="/sales/customers" element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            } />
            
            {/* Production Routes */}
            <Route path="/production/orders" element={
              <ProtectedRoute>
                <ProductionOrders />
              </ProtectedRoute>
            } />
            <Route path="/production/wip" element={
              <ProtectedRoute>
                <WipSummary />
              </ProtectedRoute>
            } />
            
            {/* Reports Routes */}
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            
            {/* Cash Management Routes */}
            <Route path="/assets" element={
              <ProtectedRoute>
                <AssetDashboard />
              </ProtectedRoute>
            } />
            <Route path="/assets/register" element={
              <ProtectedRoute>
                <AssetRegister />
              </ProtectedRoute>
            } />
            <Route path="/assets/categories" element={
              <ProtectedRoute>
                <AssetCategories />
              </ProtectedRoute>
            } />
            
            {/* Cash Management Routes */}
            <Route path="/cash/cashbook" element={
              <ProtectedRoute>
                <Cashbook />
              </ProtectedRoute>
            } />
            <Route path="/cash/customer-payments" element={
              <ProtectedRoute>
                <CustomerPayments />
              </ProtectedRoute>
            } />
            <Route path="/cash/vendor-payments" element={
              <ProtectedRoute>
                <VendorPayments />
              </ProtectedRoute>
            } />
            <Route path="/cash/sales-receipts" element={
              <ProtectedRoute>
                <SalesReceipts />
              </ProtectedRoute>
            } />
            <Route path="/cash/purchase-payments" element={
              <ProtectedRoute>
                <PurchasePayments />
              </ProtectedRoute>
            } />
            
            {/* User Management Routes */}
            <Route path="/users" element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            } />
            
            {/* Management Routes */}
            <Route path="/management/company" element={
              <ProtectedRoute>
                <CompanySettings />
              </ProtectedRoute>
            } />
            <Route path="/management/settings" element={
              <ProtectedRoute>
                <SystemSettings />
              </ProtectedRoute>
            } />
            <Route path="/management/fiscal" element={
              <ProtectedRoute>
                <FiscalCalendar />
              </ProtectedRoute>
            } />
            <Route path="/management/chart-of-accounts" element={
              <ProtectedRoute>
                <ChartOfAccounts />
              </ProtectedRoute>
            } />
            <Route path="/management/cash-accounts" element={
              <ProtectedRoute>
                <CashAccountManagement />
              </ProtectedRoute>
            } />
            <Route path="/management/approvals" element={
              <ProtectedRoute>
                <ApprovalFlows />
              </ProtectedRoute>
            } />
            <Route path="/management/roles" element={
              <ProtectedRoute>
                <RoleManagement />
              </ProtectedRoute>
            } />
            <Route path="/management/users" element={
              <ProtectedRoute>
                <EnhancedUserManagement />
              </ProtectedRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;