import { C } from '../../constants/colors';
import Btn from '../ui/Btn';
import FloatingMathBg from '../ui/FloatingMathBg';

const FEATURE_PILLS = ["🏫 School Mode", "📋 Exam Mode", "⚡ Instant Feedback", "🏆 XP & Badges"];

export default function SplashScreen({ onStart }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, #FFF8E1 0%, #FFF3E0 50%, #E8F5E9 100%)",
      padding: 24, position: "relative", overflow: "hidden",
    }}>
      <FloatingMathBg />
      <div className="anim-fadeUp" style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 460 }}>
        <div className="anim-float" style={{ marginBottom: 24 }}>
          <div style={{
            width: 110, height: 110, borderRadius: 32, margin: "0 auto",
            background: `linear-gradient(135deg, ${C.fire}, ${C.sun})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 54, boxShadow: `0 8px 0 ${C.fire}55, 0 16px 40px ${C.fire}33`,
          }}>🧮</div>
        </div>

        <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 54, lineHeight: 1.05, marginBottom: 8, color: C.navy }}>
          Maths<span style={{ color: C.fire }}>In</span><span style={{ color: C.sun }}>Bites</span>
        </h1>

        <p style={{ fontSize: 18, color: C.muted, fontWeight: 600, marginBottom: 36, lineHeight: 1.65 }}>
          Bite-sized maths lessons. Real explanations.<br />
          <span style={{ color: C.fire, fontWeight: 800 }}>Earn your way forward!</span> 🚀
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 40 }}>
          {FEATURE_PILLS.map(f => (
            <span key={f} style={{
              background: "#fff", border: `2px solid ${C.border}`,
              borderRadius: 50, padding: "6px 16px", fontSize: 13, fontWeight: 700, color: C.navy,
              boxShadow: "0 2px 0 #E8DDD0",
            }}>{f}</span>
          ))}
        </div>

        <Btn onClick={onStart} size="lg" style={{ width: "100%", maxWidth: 340 }}>
          Start Learning! 🎯
        </Btn>

        <p style={{ marginTop: 14, fontSize: 12, color: C.muted, fontWeight: 600 }}>
          Free • No account needed • Works offline
        </p>
      </div>
    </div>
  );
}