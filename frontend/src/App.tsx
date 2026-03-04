import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { WebAppProvider } from '@vkruglikov/react-telegram-web-app';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Home } from '@/pages/Home';
import { MasterBookings } from '@/pages/master/Bookings';
import { MasterServices } from '@/pages/master/Services';
import { MasterProfile } from '@/pages/master/Profile';
import { ClientMasters } from '@/pages/client/Masters';
import { ClientBooking } from '@/pages/client/Booking';
import { ClientBookings } from '@/pages/client/Bookings';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Protected Route component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Login component
function Login() {
  const { login, isLoading } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">CRM для мастеров</h1>
        <p className="text-muted-foreground">
          Управляйте записями и клиентами в Telegram
        </p>
        <Button 
          onClick={login} 
          disabled={isLoading}
          className="w-full max-w-xs"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Вход...
            </>
          ) : (
            'Войти через Telegram'
          )}
        </Button>
      </div>
    </div>
  );
}

// App Routes
function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Home /> : <Login />} />
      
      {/* Master Routes */}
      <Route 
        path="/master" 
        element={
          <ProtectedRoute allowedRoles={['master']}>
            <Home />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/master/bookings" 
        element={
          <ProtectedRoute allowedRoles={['master']}>
            <MasterBookings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/master/services" 
        element={
          <ProtectedRoute allowedRoles={['master']}>
            <MasterServices />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/master/profile" 
        element={
          <ProtectedRoute allowedRoles={['master']}>
            <MasterProfile />
          </ProtectedRoute>
        } 
      />

      {/* Client Routes */}
      <Route 
        path="/client" 
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <Home />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/client/masters" 
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientMasters />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/client/book/:masterId" 
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientBooking />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/client/bookings" 
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientBookings />
          </ProtectedRoute>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App
function App() {
  return (
    <WebAppProvider>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <AppRoutes />
        </div>
      </AuthProvider>
    </WebAppProvider>
  );
}

export default App;
