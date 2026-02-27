import { useEffect } from "react";
import { C } from '../../constants/colors';

export default function XPPopup({ amount, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed",
      bottom: 100,
      left: "50%",
      transform: "translateX(-50%)",
      background: `linear-gradient(135deg, ${C.fire}, ${C.sun})`,
      color: "#fff",
      fontFamily: "'Baloo 2'",
      fontWeight: 900,
      fontSize: 22,
      padding: "10px 28px",
      borderRadius: 50,
      boxShadow: "0 8px 24px rgba(255,112,67,0.45)",
      zIndex: 9000,
      animation: "xpPop 1.2s ease forwards",
      pointerEvents: "none",
    }}>
      +{amount} XP ⭐
    </div>
  );
}