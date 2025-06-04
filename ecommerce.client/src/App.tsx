import { Toaster } from 'sonner';
import './App.css';
import { AuthStatus } from './components/auth/AuthStatus';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Skeleton } from './components/ui/skeleton';
import { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { InventoryLogView } from './components/dashboard/views/InventoryLogView';
import { PurchaseView } from './components/dashboard/views/PurchaseView';
import { SaleView } from './components/dashboard/views/SaleView';
import { CategoryManagementForm } from './components/dashboard/forms/CategoryManagementForm';
import { StockManagementForm } from './components/dashboard/forms/StockManagementForm';
import { SupplierManagementForm } from './components/dashboard/forms/SupplierManagementForm';
import { UserManagementForm } from './components/dashboard/forms/UserManagementForm';
import { UnitManagementForm } from './components/dashboard/forms/UnitManagementForm';
import { Loader2 } from 'lucide-react';
import { ItemManagementForm } from './components/dashboard/forms/ItemManagementForm';
import { FinancialReportsContainer } from './components/dashboard/views/FinancialReportsContainer';
import { ThemeProvider } from './contexts/theme-provider';
import { JournalLedgerView } from './components/dashboard/views/JournalLedgerView';
import { ProfitLossView } from './components/dashboard/reports/ProfitLossView';

function AppContent() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const [showRegister, setShowRegister] = useState(false); 

    // Navigation handlers
    const navigateToRegister = () => setShowRegister(true);
    const navigateToLogin = () => setShowRegister(false);

    // Display loading indicator while checking auth status
    if (isLoading) {
        return (
            <div className="flex h-screen animate-pulse bg-muted/10 dark:bg-muted/30"> {/* Animate pulse for all skeletons */}
                {/* Sidebar Skeleton */}
                <div className="hidden border-r bg-background/50 dark:bg-background/30 md:block md:w-60 lg:w-64 p-4 space-y-6">
                {/* Sidebar Header/Logo Skeleton */}
                <div className="flex items-center space-x-3 px-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-6 w-28" />
                </div>
                {/* Sidebar Nav Links Skeleton */}
                <div className="space-y-3 px-2">
                    <Skeleton className="h-8 w-full rounded-md" />
                    <Skeleton className="h-8 w-full rounded-md" />
                    <Skeleton className="h-8 w-5/6 rounded-md" />
                    <Skeleton className="h-8 w-full rounded-md" />
                </div>
                {/* Sidebar Collapsible Section Skeleton (mimicking the "Add" section) */}
                <div className="pt-4 mt-auto border-t border-border/50 dark:border-border/30 px-2">
                    <Skeleton className="h-8 w-full rounded-md" />
                    <div className="pl-4 mt-3 space-y-2">
                        <Skeleton className="h-6 w-full rounded-md" />
                        <Skeleton className="h-6 w-4/5 rounded-md" />
                    </div>
                </div>
                </div>
            
                {/* Main Area Skeleton */}
                <div className="flex flex-col flex-1">
                {/* Header Skeleton */}
                <div className="flex h-14 lg:h-[60px] items-center justify-between border-b border-border/50 dark:border-border/30 bg-background/50 dark:bg-background/30 px-6">
                    <Skeleton className="h-6 w-48" /> {/* Placeholder for breadcrumbs or search */}
                    <Skeleton className="h-8 w-8 rounded-full" /> {/* User avatar placeholder */}
                </div>
            
                {/* Content Area Skeleton */}
                <main className="flex-1 p-6">
                    <div className="space-y-6">
                    {/* Page Title and Action Button Skeleton */}
                    <div className="flex items-center justify-between mb-8">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-9 w-36 rounded-md" />
                    </div>
            
                    {/* Informative loading text - more integrated */}
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground space-y-3">
                        <Loader2 className="h-7 w-7 animate-spin" />
                        <span className="text-lg">Loading authentication status...</span>
                        <span className="text-sm">Please wait a moment.</span>
                    </div>
            
                    {/* Main Content Block Skeleton (e.g., for a Table or large Card) */}
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-5 w-1/6" />
                        </div>
                        <Skeleton className="h-72 w-full rounded-lg" />
                    </div>
            
                    {/* Optional: Smaller content blocks if you often have them */}
                    {/* <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
                        <Skeleton className="h-36 w-full rounded-lg" />
                        <Skeleton className="h-36 w-full rounded-lg" />
                        <Skeleton className="h-36 w-full rounded-lg" />
                    </div> */}
                    </div>
                </main>
                </div>
            </div>
            );
    }
    return (
        <Routes>
          {/* Public routes for login/registration */}
          {!isAuthenticated && (
            <>
              <Route
                path="/login"
                element={
                  <PublicAuthLayout showRegister={showRegister} onNavigateToRegister={navigateToRegister} onNavigateToLogin={navigateToLogin} />
                }
              />
              <Route
                path="/register"
                element={
                    <PublicAuthLayout showRegister={true} onNavigateToRegister={navigateToRegister} onNavigateToLogin={navigateToLogin} />
                }
              />
            </>
          )}
    
          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="inventory" replace />} />
            <Route path="inventory" element={<InventoryLogView />} />
            <Route path="purchases" element={<PurchaseView />} />
            <Route path="sales" element={<SaleView />} />
            <Route path="reports" element={<Outlet/>}>
              <Route path="balance" element={<FinancialReportsContainer />} />
              <Route path="profit-loss-report" element={< ProfitLossView />} />
            </Route>
            <Route path="finance" element={<Outlet/>}> 
              <Route path="journal" element={<JournalLedgerView />} />
            </Route>
            <Route path="add" element={<Outlet/>}> 
              <Route path="item" element={<ItemManagementForm />} />
              <Route path="category" element={<CategoryManagementForm />} />
              <Route path="supplier" element={<SupplierManagementForm/>} />
              <Route path="stock" element={<StockManagementForm/>} />
              <Route path="unit" element={<UnitManagementForm/>} />
              {user?.username == 'admin' && (
                <Route path="user" element={<UserManagementForm />} />)}
            </Route>
          </Route>
    
          {/* Fallback route - redirect to dashboard if logged in, else to login */}
          <Route
            path="*"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      );
}

// A layout for public login/register pages
const PublicAuthLayout: React.FC<{
    showRegister: boolean;
    onNavigateToRegister: () => void;
    onNavigateToLogin: () => void;
  }> = ({ showRegister, onNavigateToRegister, onNavigateToLogin }) => {
    return (
      <div className="container mx-auto p-4">
          <div className="absolute top-4 right-4">
              <AuthStatus /> {/* Still shows logged out status here */}
          </div>
           <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
              {showRegister ? (
                  <RegisterForm onNavigateToLogin={onNavigateToLogin} />
              ) : (
                  <LoginForm onNavigateToRegister={onNavigateToRegister} />
              )}
          </div>
      </div>
    );
};

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <AuthProvider>
            <AppContent />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      );
}

export default App;