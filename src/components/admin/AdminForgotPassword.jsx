// src/components/admin/AdminForgotPassword.jsx
// ============================================================
// Forgot-password screen for the admin portal.
// Sends a Supabase password-reset email.
// ============================================================

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { C } from '../../constants/colors';

export default function AdminForgotPassword({ onBack }) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState(null);

  const handleReset = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);

    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/login`,
    });

    setLoading(false);
    if (resetErr) {
      setError(resetErr.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg,#1a2340,#22304f,#1a2340)',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
            background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
          }}>📩</div>
          <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 26, color: '#fff', margin: '0 0 6px' }}>
            Reset Password
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 13, margin: 0 }}>
            We'll send a reset link to your admin email
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 22, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
              <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 20, color: C.navy, marginBottom: 10 }}>
                Reset link sent!
              </div>
              <p style={{ color: C.muted, fontWeight: 600, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                Check your inbox at <strong>{email}</strong> for a password reset link.
              </p>
              <button onClick={onBack} style={{
                background: 'none', border: 'none', color: C.fire,
                fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 15, cursor: 'pointer',
              }}>← Back to Login</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: 13, color: C.navy, marginBottom: 6 }}>
                  📧 Admin Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
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

              {error && (
                <div style={{
                  background: '#FFF0F0', border: '1.5px solid #FFB8B8',
                  borderRadius: 12, padding: '10px 14px', marginBottom: 16,
                  fontSize: 13, fontWeight: 700, color: '#C0392B',
                }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleReset}
                disabled={loading || !email}
                style={{
                  width: '100%', padding: '13px', borderRadius: 14, border: 'none',
                  background: loading || !email ? '#ccc' : 'linear-gradient(135deg,#FF6B35,#FF9500)',
                  color: '#fff', fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 16,
                  cursor: loading || !email ? 'not-allowed' : 'pointer',
                  marginBottom: 14,
                }}
              >
                {loading ? '⏳ Sending…' : 'Send Reset Link'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <button onClick={onBack} style={{
                  background: 'none', border: 'none', color: C.muted,
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>← Back to Login</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
