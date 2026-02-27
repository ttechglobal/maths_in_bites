import { C } from '../../constants/colors';
import FloatingMathBg from '../ui/FloatingMathBg';
import Pill from '../ui/Pill';

const MODES = [
  { mode: "school", emoji: "🏫", label: "School Mode", desc: "Follow your class curriculum step by step", color: C.sky },
  { mode: "exam",   emoji: "📋", label: "Exam Mode",   desc: "Prepare for WAEC, JAMB, NECO & more",      color: C.fire },
];

export default function ModeSelect({ onSelect }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <FloatingMathBg />
      <div className="anim-fadeUp" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }} className="anim-float">🎓</div>
          <h2 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 36, color: C.navy }}>How do you learn?</h2>
          <p style={{ color: C.muted, fontWeight: 600, marginTop: 6 }}>Choose your learning path</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {MODES.map(({ mode, emoji, label, desc, color }) => (
            <div key={mode} className="card" onClick={() => onSelect(mode)} style={{
              padding: 28, textAlign: "center", cursor: "pointer",
              border: `3px solid ${color}22`, position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", right: -10, bottom: -10, fontSize: 64, opacity: 0.06, transform: "rotate(-15deg)" }}>{emoji}</div>
              <div style={{ fontSize: 48, marginBottom: 14 }}>{emoji}</div>
              <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 20, color: C.navy, marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, lineHeight: 1.55 }}>{desc}</div>
              <div style={{ marginTop: 16 }}><Pill color={color}>Select →</Pill></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}