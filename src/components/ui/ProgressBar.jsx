import { C } from '../../constants/colors';

export default function ProgressBar({ pct, color = C.fire, height = 10 }) {
  return (
    <div style={{ background: "#EDE8E0", borderRadius: 50, height, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${pct}%`,
        borderRadius: 50,
        background: `linear-gradient(90deg, ${color}, ${C.sun})`,
        animation: "fillBar 1s ease forwards",
        transition: "width 0.8s ease",
      }} />
    </div>
  );
}