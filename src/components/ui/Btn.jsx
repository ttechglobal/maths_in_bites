import { C } from '../../constants/colors';

export default function Btn({ children, onClick, color = C.fire, textColor = "#fff", outline, disabled, size = "md", style: sx = {} }) {
  const pad = size === "lg" ? "14px 36px" : size === "sm" ? "7px 16px" : "10px 24px";
  const fs  = size === "lg" ? 18 : size === "sm" ? 13 : 15;
  return (
    <button
      className="btn"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: outline ? "transparent" : color,
        color: outline ? color : textColor,
        border: outline ? `2px solid ${color}` : "none",
        borderRadius: 50,
        padding: pad,
        fontSize: fs,
        boxShadow: outline ? "none" : `0 4px 0 ${color}66`,
        ...sx,
      }}
    >
      {children}
    </button>
  );
}