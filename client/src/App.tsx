import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import Discover from './pages/Discover';
import Search from './pages/Search';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import BlockedUsers from './pages/BlockedUsers';
import Reports from './pages/Reports';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin';
import Contact from './pages/Contact';
import Subscription from './pages/Subscription';
import './App.css';
import './responsive.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#ff4458',
      light: '#ff7889',
      dark: '#d3002c',
    },
    secondary: {
      main: '#424242',
    },
    background: {
      default: '#fafafa',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      '@media (max-width:600px)': {
        fontSize: '2rem',
      },
      '@media (max-width:480px)': {
        fontSize: '1.75rem',
      },
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: '1.75rem',
      },
      '@media (max-width:480px)': {
        fontSize: '1.5rem',
      },
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
      '@media (max-width:480px)': {
        fontSize: '1.25rem',
      },
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
      '@media (max-width:480px)': {
        fontSize: '1.125rem',
      },
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: '1.125rem',
      },
      '@media (max-width:480px)': {
        fontSize: '1rem',
      },
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      '@media (max-width:600px)': {
        fontSize: '1rem',
      },
      '@media (max-width:480px)': {
        fontSize: '0.875rem',
      },
    },
    body1: {
      fontSize: '1rem',
      '@media (max-width:600px)': {
        fontSize: '0.875rem',
      },
    },
    body2: {
      fontSize: '0.875rem',
      '@media (max-width:600px)': {
        fontSize: '0.8rem',
      },
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            paddingLeft: 16,
            paddingRight: 16,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            fontSize: '0.875rem',
            padding: '8px 16px',
          },
        },
      },
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  const adminInfo = localStorage.getItem('adminInfo');
  
  // Check if admin tokens exist and are valid
  if (!adminToken || !adminInfo) {
    console.log('Admin tokens not found, redirecting to admin login');
    return <Navigate to="/admin/login" replace />;
  }
  
  try {
    // Validate that adminInfo is valid JSON
    const admin = JSON.parse(adminInfo);
    if (!admin.id || !admin.email) {
      console.log('Invalid admin info, redirecting to admin login');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');
      return <Navigate to="/admin/login" replace />;
    }
  } catch (error) {
    console.log('Error parsing admin info, redirecting to admin login');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return !user ? <>{children}</> : <Navigate to="/dashboard" />;
};

const AdminLoginRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const adminToken = localStorage.getItem('adminToken');
  
  // If user is logged in as regular user, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If admin is already logged in, redirect to admin panel
  if (adminToken) {
    return <Navigate to="/admin" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="App">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/discover" element={
                <ProtectedRoute>
                  <Discover />
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <Search />
                </ProtectedRoute>
              } />
              <Route path="/matches" element={
                <ProtectedRoute>
                  <Matches />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/user/:userId" element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />
              <Route path="/chat/:matchId?" element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/blocked-users" element={
                <ProtectedRoute>
                  <BlockedUsers />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/subscription" element={
                <ProtectedRoute>
                  <Subscription />
                </ProtectedRoute>
              } />
                              <Route path="/contact" element={<Contact />} />
                <Route path="/admin/login" element={
                  <AdminLoginRoute>
                    <AdminLogin />
                  </AdminLoginRoute>
                } />
                <Route path="/admin" element={
                  <AdminProtectedRoute>
                    <AdminPanel />
                  </AdminProtectedRoute>
                } />
            </Routes>
            <Toaster position="top-center" />
          </div>
        </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;