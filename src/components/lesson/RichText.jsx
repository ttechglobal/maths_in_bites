// RichText — renders lesson text with formatting + mixed fractions
// Patterns:
//   **bold** → orange bold
//   *italic* → styled blue
//   "2 3/4"  → MixedFraction: BIG whole number + small stacked fraction
//   "3/4"    → stacked fraction

import { C } from '../../constants/colors';

// Detect "whole num/den" e.g. "2 3/4" or "1 1/2"
function parseMixed(str) {
  const m = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  return m ? { whole: m[1], num: m[2], den: m[3] } : null;
}

// Small stacked fraction ⁿ⁄d
function StackFrac({ num, den }) {
  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      verticalAlign: 'middle', lineHeight: 1.05, margin: '0 1px',
    }}>
      <span style={{ fontSize: '0.62em', fontWeight: 800, borderBottom: '1.5px solid currentColor', lineHeight: 1.3, paddingBottom: 0 }}>{num}</span>
      <span style={{ fontSize: '0.62em', fontWeight: 800, lineHeight: 1.2 }}>{den}</span>
    </span>
  );
}

// Mixed fraction — whole is VISUALLY LARGE, fraction part is small & raised
function MixedFrac({ whole, num, den }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      gap: 1, verticalAlign: 'middle', margin: '0 3px',
    }}>
      {/* Big bold whole number */}
      <span style={{ fontSize: '1em', fontWeight: 900, lineHeight: 1 }}>{whole}</span>
      {/* Small stacked fraction right next to it */}
      <StackFrac num={num} den={den} />
    </span>
  );
}

// Tokenise text: split on "N N/D" and "N/D" patterns
function tokenise(text) {
  const re = /(\d+\s+\d+\/\d+|\d+\/\d+)/g;
  const tokens = [];
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ t: 'text', v: text.slice(last, m.index) });
    const mf = parseMixed(m[0]);
    if (mf) {
      tokens.push({ t: 'mixed', ...mf });
    } else {
      const [n, d] = m[0].split('/');
      tokens.push({ t: 'frac', num: n, den: d });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push({ t: 'text', v: text.slice(last) });
  return tokens;
}

// Render plain text with **bold** and *italic*
function Plain({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**'))
          return <strong key={i} style={{ color: C.fire, fontWeight: 800 }}>{p.slice(2, -2)}</strong>;
        if (p.startsWith('*') && p.endsWith('*'))
          return <em key={i} style={{ color: C.sky, fontWeight: 700, fontStyle: 'normal' }}>{p.slice(1, -1)}</em>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export default function RichText({ text, className = '' }) {
  if (!text) return null;
  const tokens = tokenise(String(text));
  return (
    <span className={className}>
      {tokens.map((tok, i) => {
        if (tok.t === 'mixed') return <MixedFrac key={i} whole={tok.whole} num={tok.num} den={tok.den} />;
        if (tok.t === 'frac')  return <StackFrac  key={i} num={tok.num} den={tok.den} />;
        return <Plain key={i} text={tok.v} />;
      })}
    </span>
  );
}