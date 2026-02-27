import { useState } from "react";
import { C } from '../../constants/colors';
import Btn from '../ui/Btn';

const STEPS = (name) => [
  { emoji: "📚", title: "Pick a Topic",       body: `Hey ${name}! MathsInBites covers every maths topic for your class or exam.` },
  { emoji: "📜", title: "Read the Lesson",    body: "Each lesson is one beautiful scroll — intro, explanation, worked examples, all in order." },
  { emoji: "✏️", title: "Answer & Progress",  body: "Complete the practice questions at the end. Answer correctly to unlock the next lesson!" },
  { emoji: "⭐", title: "Earn XP & Badges",   body: "Every correct answer earns XP. Build streaks, unlock badges, climb the leaderboard!" },
  { emoji: "🏆", title: "You're Ready!",      body: `Go crush those maths goals, ${name}! Your success story starts NOW! 💪` },
];

export default function TutorialOverlay({ name, onDone }) {
  const [step, setStep] = useState(0);
  const steps = STEPS(name);
  const s = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(26,26,46,0.72)", zIndex: 9000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      backdropFilter: "blur(4px)",
    }}>
      <div className="anim-popIn card" style={{ maxWidth: 380, width: "100%", padding: 40, textAlign: "center", position: "relative" }}>
        <div className="anim-float" style={{ fontSize: 72, marginBottom: 16 }}>{s.emoji}</div>
        <h3 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 28, color: C.navy, marginBottom: 10 }}>{s.title}</h3>
        <p style={{ color: C.muted, fontWeight: 600, fontSize: 16, lineHeight: 1.7, marginBottom: 28 }}>{s.body}</p>

        {/* Dot indicators */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 50,
              background: i === step ? C.fire : C.border,
              transition: "all 0.3s",
            }} />
          ))}
        </div>

        <Btn onClick={() => isLast ? onDone() : setStep(s => s + 1)} size="lg" style={{ width: "100%" }}>
          {isLast ? "Start Learning! 🎯" : "Next →"}
        </Btn>
      </div>
    </div>
  );
}