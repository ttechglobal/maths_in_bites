// src/components/admin/AdminLoginScreen.jsx
// ============================================================
// Standalone admin login — only accessible at /admin/login.
//
// ADMIN CREDENTIALS — change these in Supabase Auth if needed:
//   Email:    admin@mathsinbites.com
//   Password: update via Supabase Dashboard → Authentication → Users
//
// The login simply verifies the email matches ADMIN_EMAIL after
// a successful Supabase sign-in. No role columns required.
// ============================================================

import { useState } from 'react';
import { signIn } from '../../lib/supabase';
import FloatingMathBg from '../ui/FloatingMathBg';
import { C } from '../../constants/colors';

// ── Single source of truth for the admin email ───────────────
// To change: update this constant AND update the email in
// Supabase Dashboard → Authentication → Users.
const ADMIN_EMAIL = 'admin@mathsinbites.com';

export default function AdminLoginScreen({ onLoginSuccess }) {
  const [email,    setEmail]    = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    // 1. Authenticate with Supabase
    const { data, error: authErr } = await signIn(email, password);
    if (authErr) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    // 2. Confirm the signed-in email matches the admin email
    const signedInEmail = data?.user?.email?.toLowerCase();
    if (signedInEmail !== ADMIN_EMAIL.toLowerCase()) {
      // Someone else's credentials — reject immediately
      await import('../../lib/supabase').then(m => m.supabase.auth.signOut());
      setError('Access restricted. This portal is for administrators only.');
      setLoading(false);
      return;
    }

    // 3. All good — hand off to the portal
    setLoading(false);
    onLoginSuccess(data.user);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(160deg,#1a2340,#22304f,#1a2340)',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle background */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.08 }}>
        <FloatingMathBg dark />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 18px',
            background: 'linear-gradient(135deg,#FF6B35,#FF9500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, boxShadow: '0 6px 0 rgba(255,107,53,0.4)',
          }}>🔐</div>
          <h1 style={{
            fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 30,
            color: '#fff', margin: '0 0 8px',
          }}>
            Admin Portal
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 14, margin: 0 }}>
            MathsInBites CMS — Restricted Access
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 800, fontSize: 13, color: C.navy, marginBottom: 6 }}>
              📧 Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="admin@example.com"
              autoFocus
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                border: `2px solid ${C.border}`, fontSize: 15,
                fontWeight: 700, color: C.navy, background: '#FAFAF8',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 800, fontSize: 13, color: C.navy, marginBottom: 6 }}>
              🔒 Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                border: `2px solid ${C.border}`, fontSize: 15,
                fontWeight: 700, color: C.navy, background: '#FAFAF8',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FFF0F0', border: '1.5px solid #FFB8B8',
              borderRadius: 12, padding: '10px 14px', marginBottom: 16,
              fontSize: 13, fontWeight: 700, color: '#C0392B',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              background: loading || !email || !password
                ? '#ccc'
                : 'linear-gradient(135deg,#FF6B35,#FF9500)',
              color: '#fff',
              fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 17,
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(255,107,53,0.35)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '⏳ Verifying…' : 'Sign In to Admin Portal →'}
          </button>

          {/* Forgot password link */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <a
              href="/admin/forgot-password"
              style={{ fontSize: 13, color: C.muted, fontWeight: 700, textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = C.fire}
              onMouseLeave={e => e.target.style.color = C.muted}
            >
              Forgot password?
            </a>
          </div>
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
          This area is restricted to authorised administrators only.
        </p>
      </div>
    </div>
  );
}
