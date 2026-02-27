import { C } from '../../constants/colors';

const NAV_ITEMS = [
  { id: "home",     icon: "🏠", label: "Home"     },
  { id: "learn",    icon: "📚", label: "Learn"    },
  { id: "practice", icon: "🎯", label: "Practice" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

export default function BottomNav({ screen, onNavigate }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 150,
      background: "rgba(255,251,240,0.96)", backdropFilter: "blur(14px)",
      borderTop: `2px solid ${C.border}`,
      padding: "10px 0 max(10px,env(safe-area-inset-bottom))",
      display: "flex", justifyContent: "space-around",
    }}>
      {NAV_ITEMS.map(({ id, icon, label }) => (
        <div key={id} onClick={() => onNavigate(id)} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          cursor: "pointer", minWidth: 60, padding: "5px 10px", borderRadius: 16,
          background: screen === id ? `${C.fire}12` : "transparent",
          transition: "all 0.2s",
        }}>
          <span style={{ fontSize: 22, filter: screen === id ? "none" : "grayscale(0.5) opacity(0.5)" }}>{icon}</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: screen === id ? C.fire : C.muted, letterSpacing: 0.3 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}