import { C } from '../../constants/colors';

const COLORS = [C.sun, C.fire, C.mint, C.sky, C.yellow, C.purple, C.rose];

export default function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    left:  `${Math.random() * 100}%`,
    color: COLORS[i % 7],
    size:  7 + Math.random() * 9,
    delay: Math.random() * 0.6,
    dur:   1.8 + Math.random() * 0.8,
    shape: Math.random() > 0.5 ? "50%" : "3px",
  }));

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          left: p.left,
          top: -20,
          width: p.size,
          height: p.size,
          borderRadius: p.shape,
          background: p.color,
          animation: `confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
        }} />
      ))}
    </div>
  );
}