// Renders lesson text: **bold** becomes orange, *italic* becomes blue.
import { C } from '../../constants/colors';

export default function RichText({ text, className = "" }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i} style={{ color: C.fire, fontWeight: 800 }}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("*") && p.endsWith("*"))
          return <em key={i} style={{ color: C.blue, fontWeight: 700, fontStyle: "normal" }}>{p.slice(1, -1)}</em>;
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}