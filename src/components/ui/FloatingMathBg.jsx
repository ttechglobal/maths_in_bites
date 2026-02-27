// Decorative background — the floating math symbols on onboarding screens.

const SYMBOLS = ["∑", "π", "√", "∞", "∫", "÷", "×", "²", "θ", "Δ"];

export default function FloatingMathBg() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {SYMBOLS.map((sym, i) => (
        <div key={i} className="math-float" style={{
          left: `${8 + i * 9}%`,
          top:  `${5 + (i % 4) * 22}%`,
          fontSize: 28 + (i % 3) * 14,
          animation: `float ${3 + i * 0.3}s ease-in-out infinite`,
          animationDelay: `${i * 0.25}s`,
        }}>
          {sym}
        </div>
      ))}
    </div>
  );
}