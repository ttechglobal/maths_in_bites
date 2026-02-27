import { C } from '../../constants/colors';

export default function Pill({ children, color = C.fire, bg }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 12px",
      borderRadius: 50,
      background: bg || `${color}18`,
      color,
      fontWeight: 800,
      fontSize: 12,
      border: `1.5px solid ${color}30`,
    }}>
      {children}
    </span>
  );
}