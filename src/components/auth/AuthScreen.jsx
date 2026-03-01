// src/components/auth/AuthScreen.jsx
// ============================================================
// Sign in / Sign up screen. Shown when user is not logged in.
// On signup: collects name + email + password, then immediately
// saves name to user_profiles so onboarding skips the name step
// and goes straight to class/exam selection.
// ============================================================

import { useState } from "react";
import { C } from '../../constants/colors';
import { supabase, signIn, signUp } from '../../lib/supabase';
import Btn from '../ui/Btn';
import FloatingMathBg from '../ui/FloatingMathBg';

export default function AuthScreen({ onAuthSuccess }) {
  const [tab,      setTab]      = useState("signin");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    if (tab === "signup") {
      if (!name.trim()) { setError("Please enter your name"); setLoading(false); return; }

      const result = await signUp(email, password, name.trim());
      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      // Upsert name directly — don't rely solely on the DB trigger
      const userId = result.data?.user?.id;
      if (userId) {
        await supabase
          .from('user_profiles')
          .upsert({ id: userId, name: name.trim() }, { onConflict: 'id' });
      }

      onAuthSuccess?.();
    } else {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error.message);
      } else {
        onAuthSuccess?.();
      }
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg,#FFF8E1,#FFF3E0,#E8F5E9)",
      padding: 24, position: "relative", overflow: "hidden",
    }}>
      <FloatingMathBg />

      <div className="anim-fadeUp" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24, margin: "0 auto 16px",
            background: `linear-gradient(135deg,${C.fire},${C.sun})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, boxShadow: `0 6px 0 ${C.fire}55`,
          }}>🧮</div>
          <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 36, color: C.navy, lineHeight: 1 }}>
            Maths<span style={{ color: C.fire }}>In</span><span style={{ color: C.sun }}>Bites</span>
          </h1>
          <p style={{ color: C.muted, fontWeight: 600, marginTop: 6 }}>
            {tab === "signup" ? "Create your free account" : "Welcome back! Sign in to continue"}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex", background: "#EDE8E0", borderRadius: 18,
          padding: 4, marginBottom: 20,
        }}>
          {[["signin","Sign In"],["signup","Sign Up"]].map(([id, label]) => (
            <div key={id} onClick={() => { setTab(id); setError(null); }} style={{
              flex: 1, textAlign: "center", padding: "10px 0",
              borderRadius: 14, cursor: "pointer",
              background: tab === id ? "#fff" : "transparent",
              fontWeight: 800, fontSize: 14,
              color: tab === id ? C.fire : C.muted,
              boxShadow: tab === id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
            }}>{label}</div>
          ))}
        </div>

        {/* Form */}
        <div className="card" style={{ padding: 28 }}>
          {tab === "signup" && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontWeight: 800, fontSize: 13, color: C.navy, marginBottom: 6 }}>
                👤 Your Name
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Chioma, Emeka…"
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `2px solid ${C.border}`, fontSize: 15, fontWeight: 700, color: C.navy }}
              />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontWeight: 800, fontSize: 13, color: C.navy, marginBottom: 6 }}>
              📧 Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `2px solid ${C.border}`, fontSize: 15, fontWeight: 700, color: C.navy }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontWeight: 800, fontSize: 13, color: C.navy, marginBottom: 6 }}>
              🔒 Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `2px solid ${C.border}`, fontSize: 15, fontWeight: 700, color: C.navy }}
            />
          </div>

          {error && (
            <div style={{
              background: `${C.rose}12`, border: `1.5px solid ${C.rose}44`,
              borderRadius: 12, padding: "10px 14px", marginBottom: 16,
              fontSize: 13, fontWeight: 700, color: C.rose,
            }}>
              ⚠️ {error}
            </div>
          )}

          <Btn
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            size="lg"
            style={{ width: "100%" }}
          >
            {loading ? "Please wait…" : tab === "signup" ? "Create Account 🚀" : "Sign In →"}
          </Btn>
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: C.muted, fontWeight: 600 }}>
          Free • No credit card • Works offline after first load
        </p>
      </div>
    </div>
  );
}
