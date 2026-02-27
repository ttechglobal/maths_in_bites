import { C } from '../../constants/colors';

export default function TopBar({ user, onAdminClick }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 200,
      background: "rgba(255,251,240,0.92)", backdropFilter: "blur(12px)",
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

      {/* Right: streak, XP, avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="anim-bounce" style={{
          background: `linear-gradient(135deg,${C.fire},${C.sun})`,
          borderRadius: 50, padding: "4px 14px",
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 14, fontWeight: 900, color: "#fff",
          boxShadow: `0 3px 0 ${C.fire}55`,
        }}>🔥 {user.streak}</div>

        <div style={{
          background: "#fff", border: `2px solid ${C.border}`,
          borderRadius: 50, padding: "4px 14px",
          fontSize: 14, fontWeight: 800, color: C.navy,
          boxShadow: "0 2px 0 #E8DDD0",
        }}>⭐ {user.xp} XP</div>

        <div
          style={{
            width: 36, height: 36, borderRadius: 12,
            background: `linear-gradient(135deg,${C.sky},${C.purple})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900, color: "#fff", cursor: "pointer",
            boxShadow: `0 3px 0 ${C.sky}55`,
          }}
          onClick={onAdminClick}
          title="Admin Dashboard"
        >
          {user.name[0].toUpperCase()}
        </div>
      </div>
    </div>
  );
}