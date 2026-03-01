import { useState, useRef, useEffect } from 'react';
import { C } from '../../constants/colors';

export default function TopBar({ user, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 200,
      background: "rgba(255,251,240,0.95)", backdropFilter: "blur(12px)",
      borderBottom: `2px solid ${C.border}`,
      padding: "12px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: `linear-gradient(135deg,${C.fire},${C.sun})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, boxShadow: `0 3px 0 ${C.fire}55`,
        }}>🧮</div>
        <span style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 20, color: C.navy }}>
          Maths<span style={{ color: C.fire }}>In</span><span style={{ color: C.sun }}>Bites</span>
        </span>
      </div>

      {/* Right: XP + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* XP badge */}
        <div style={{
          background: "#fff", border: `2px solid ${C.border}`,
          borderRadius: 50, padding: "5px 14px",
          fontSize: 13, fontWeight: 800, color: C.navy,
          boxShadow: "0 2px 0 #E8DDD0",
        }}>⭐ {user.xp} XP</div>

        {/* Avatar — clickable */}
        <div ref={ref} style={{ position: 'relative' }}>
          <div
            onClick={() => setOpen(o => !o)}
            style={{
              width: 38, height: 38, borderRadius: 12,
              background: `linear-gradient(135deg,${C.sky},${C.purple})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: "#fff",
              boxShadow: `0 3px 0 ${C.sky}55`,
              cursor: 'pointer',
              border: open ? `2px solid ${C.purple}` : '2px solid transparent',
              transition: 'border-color 0.15s',
              userSelect: 'none',
            }}
          >
            {(user.name || '?')[0].toUpperCase()}
          </div>

          {/* Dropdown */}
          {open && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              background: '#fff', borderRadius: 18,
              boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
              border: `1.5px solid ${C.border}`,
              minWidth: 200, zIndex: 999,
              overflow: 'hidden',
              animation: 'fadeUp 0.18s ease',
            }}>
              {/* Profile header */}
              <div style={{
                padding: '16px 18px 12px',
                borderBottom: `1.5px solid ${C.border}`,
                background: `linear-gradient(135deg,${C.sky}10,${C.purple}08)`,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: `linear-gradient(135deg,${C.sky},${C.purple})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 900, color: '#fff',
                  marginBottom: 8,
                }}>
                  {(user.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 16, color: C.navy, lineHeight: 1.2 }}>
                  {user.name || 'Student'}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginTop: 2 }}>
                  ⭐ {user.xp} XP
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '8px 6px' }}>
                <DropdownItem
                  icon="⚙️"
                  label="Settings"
                  onClick={() => { setOpen(false); onNavigate?.('settings'); }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DropdownItem({ icon, label, onClick, danger }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
        background: hover ? (danger ? `${C.rose}10` : `${C.sky}10`) : 'transparent',
        color: danger ? C.rose : C.navy,
        fontWeight: 700, fontSize: 14,
        transition: 'background 0.12s',
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
    </div>
  );
}