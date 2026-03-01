// src/components/admin/AdminPortal.jsx
// ============================================================
// Top-level component for the /admin/* route tree.
// Handles its own auth flow, completely isolated from the
// student/parent app. Routes:
//   /admin              → redirect to /admin/dashboard if logged in, else /admin/login
//   /admin/login        → AdminLoginScreen
//   /admin/forgot-password → AdminForgotPassword
//   /admin/dashboard    → AdminApp (if authenticated admin)
// ============================================================

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLoginScreen from './AdminLoginScreen';
import AdminForgotPassword from './AdminForgotPassword';
import AdminApp from './AdminApp';
import { C } from '../../constants/colors';

const ADMIN_EMAIL = 'admin@mathsinbites.com';

// Derive the current sub-route from window.location
function getAdminRoute() {
  const path = window.location.pathname;
  if (path.includes('forgot-password')) return 'forgot-password';
  if (path.includes('dashboard'))       return 'dashboard';
  if (path.includes('login'))           return 'login';
  return 'root'; // /admin with no suffix
}

export default function AdminPortal() {
  const [adminUser, setAdminUser] = useState(null);  // verified admin auth user
  const [checking, setChecking]   = useState(true);  // true while verifying session
  const [route,    setRoute]      = useState(getAdminRoute());

  // ── Navigate helper (no router dependency) ──────────────────
  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setRoute(getAdminRoute());
  };

  // ── Check for an existing valid admin session on mount ───────
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setChecking(false);
        return;
      }

      // Verify the session belongs to the admin email
      const isAdmin = session.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      if (isAdmin) {
        setAdminUser(session.user);
        if (route === 'root' || route === 'login') {
          navigateTo('/admin/dashboard');
        }
      } else {
        // Not the admin account — clear the session in this context
        await supabase.auth.signOut();
      }
      setChecking(false);
    };

    checkSession();

    // Listen for popstate (browser back/forward)
    const onPop = () => setRoute(getAdminRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle successful login ──────────────────────────────────
  const handleLoginSuccess = (user) => {
    setAdminUser(user);
    navigateTo('/admin/dashboard');
  };

  // ── Handle logout ────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAdminUser(null);
    navigateTo('/admin/login');
  };

  // ── Loading spinner while verifying session ──────────────────
  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg,#1a2340,#22304f)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <div style={{
            fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 20, color: '#fff',
          }}>
            Verifying session…
          </div>
        </div>
      </div>
    );
  }

  // ── Route: forgot-password (no auth required) ────────────────
  if (route === 'forgot-password') {
    return (
      <AdminForgotPassword
        onBack={() => navigateTo('/admin/login')}
      />
    );
  }

  // ── Route: dashboard (requires admin auth) ───────────────────
  if (route === 'dashboard') {
    if (!adminUser) {
      // Not logged in — redirect to login
      navigateTo('/admin/login');
      return null;
    }
    return (
      <AdminApp
        adminUser={adminUser}
        onLogout={handleLogout}
      />
    );
  }

  // ── Route: login (default for /admin and /admin/login) ───────
  // If already logged in, bounce to dashboard
  if (adminUser && (route === 'root' || route === 'login')) {
    navigateTo('/admin/dashboard');
    return null;
  }

  return (
    <AdminLoginScreen
      onLoginSuccess={handleLoginSuccess}
    />
  );
}
