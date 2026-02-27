import { useState } from "react";
import { C } from '../../constants/colors';
import Btn from '../ui/Btn';
import FloatingMathBg from '../ui/FloatingMathBg';

export default function NameEntry({ onNext }) {
  const [name, setName] = useState("");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <FloatingMathBg />
      <div className="anim-fadeUp" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div className="anim-float" style={{ fontSize: 64, marginBottom: 16 }}>👋</div>
        <h2 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 36, color: C.navy, marginBottom: 8 }}>
          What's your name?
        </h2>
        <p style={{ color: C.muted, fontWeight: 600, marginBottom: 28, lineHeight: 1.6 }}>
          We'll use this to personalise your experience!
        </p>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Chioma, Emeka, David…"
          onKeyDown={e => e.key === "Enter" && name.trim() && onNext(name.trim())}
          style={{
            width: "100%", padding: "16px 20px", borderRadius: 18, fontSize: 17, fontWeight: 700,
            border: `2.5px solid ${C.border}`, color: C.navy, background: "#fff",
            boxShadow: "0 4px 0 #E8DDD0", marginBottom: 20,
          }}
        />
        <Btn onClick={() => onNext(name.trim())} disabled={!name.trim()} size="lg" style={{ width: "100%" }}>
          Let's Go, {name || "Champ"}! 🚀
        </Btn>
      </div>
    </div>
  );
}