// src/main.jsx
// ============================================================
// Entry point — routes /admin/* to the Admin Portal and
// everything else to the student App.
// No router library needed; we read window.location.pathname.
// ============================================================

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import AdminPortal from './components/admin/AdminPortal.jsx';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient();

const isAdminRoute = window.location.pathname.startsWith('/admin');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {isAdminRoute ? <AdminPortal /> : <App />}
    </QueryClientProvider>
  </StrictMode>,
);
