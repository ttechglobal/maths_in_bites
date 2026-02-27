import { useState, useEffect } from "react";
import { C } from '../../constants/colors';
import { usePracticeQuestions } from '../../hooks/useContent';
import { saveProgress } from '../../services/content';
import Btn from '../ui/Btn';
import Pill from '../ui/Pill';
import ProgressBar from '../ui/ProgressBar';
import XPPopup from '../ui/XPPopup';
import Confetti from '../ui/Confetti';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseOptions(raw) {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

// ── Step 1: Pick question count ───────────────────────────────
function PracticeSetup({ subtopicName, totalAvailable, onStart, onBack }) {
  const [count, setCount] = useState(null);

  const options = [
    { n: 5,  label: '5',  sub: 'Quick warm-up' },
    { n: 10, label: '10', sub: 'Standard session' },
    { n: 20, label: '20', sub: 'Deep practice' },
    { n: Math.min(totalAvailable, 40), label: totalAvailable >= 40 ? '40' : `All ${totalAvailable}`, sub: totalAvailable >= 40 ? 'Full challenge' : 'All questions' },
  ].filter((o, i, arr) => i === 0 || o.n !== arr[i-1].n); // dedupe if pool is small

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "28px 16px 100px" }}>
      <button onClick={onBack} style={backBtnStyle}>← Back</button>

      <div className="anim-fadeUp" style={{ marginBottom: 32 }}>
        <Pill color={C.purple}>🎯 Practice</Pill>
        <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 30, color: C.navy, margin: "10px 0 6px" }}>
          {subtopicName}
        </h1>
        <p style={{ color: C.muted, fontWeight: 600, fontSize: 14 }}>
          {totalAvailable} questions available · how many do you want to answer?
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 32 }}>
        {options.map(({ n, label, sub }) => (
          <div key={n} onClick={() => setCount(n)} style={{
            padding: "24px 16px", borderRadius: 20, textAlign: "center", cursor: "pointer",
            border: `2.5px solid ${count === n ? C.purple : C.border}`,
            background: count === n ? `${C.purple}10` : "#fff",
            transition: "all 0.2s",
          }}>
            <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 36, color: count === n ? C.purple : C.navy, marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{sub}</div>
          </div>
        ))}
      </div>

      <Btn
        onClick={() => count && onStart(count)}
        disabled={!count}
        size="lg"
        color={C.purple}
        style={{ width: "100%", boxShadow: count ? `0 5px 0 ${C.purple}66` : "none" }}
      >
        Start {count ? `${count} Questions` : 'Practice'} 🚀
      </Btn>
    </div>
  );
}

// ── Step 2: Answer all questions, then submit ─────────────────
function PracticeSession({ questions, onDone, onBack }) {
  const [answers, setAnswers] = useState({}); // questionIndex → optionIndex
  const allAnswered = questions.length > 0 && questions.every((_, i) => i in answers);
  const answeredCount = Object.keys(answers).length;

  const handleSubmit = () => {
    if (!allAnswered) return;
    const results = questions.map((q, i) => ({
      question: q,
      selectedIdx: answers[i],
      isCorrect: answers[i] === q.answer,
    }));
    onDone(results);
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 16px 120px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button onClick={onBack} style={backBtnStyle}>✕ Exit</button>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Pill color={C.purple}>{answeredCount}/{questions.length} answered</Pill>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 24 }}>
        <ProgressBar pct={Math.round(answeredCount / questions.length * 100)} color={C.purple} />
      </div>

      {/* All questions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {questions.map((q, qi) => {
          const opts = parseOptions(q.options);
          const chosen = answers[qi];
          return (
            <div key={qi} className="card anim-fadeUp" style={{ padding: 24, animationDelay: `${qi * 0.04}s`, border: `2px solid ${chosen !== undefined ? C.purple + '44' : C.border}` }}>
              {/* Question number + text */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: chosen !== undefined ? `linear-gradient(135deg,${C.purple},${C.sky})` : C.border + '55', display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: chosen !== undefined ? "#fff" : C.muted }}>
                  {chosen !== undefined ? "✓" : qi + 1}
                </div>
                <p style={{ fontWeight: 700, fontSize: 15, color: C.navy, lineHeight: 1.6, margin: 0, paddingTop: 4 }}>
                  {q.question}
                </p>
              </div>
              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {opts.map((opt, oi) => {
                  const isChosen = chosen === oi;
                  return (
                    <div key={oi} onClick={() => setAnswers(a => ({ ...a, [qi]: oi }))} style={{
                      padding: "12px 16px", borderRadius: 14,
                      border: `2px solid ${isChosen ? C.purple : C.border}`,
                      background: isChosen ? `${C.purple}12` : "#F8F5F0",
                      color: isChosen ? C.purple : C.navy,
                      fontWeight: 700, fontSize: 14, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10,
                      transition: "all 0.15s",
                    }}>
                      <span style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, background: isChosen ? C.purple : C.border + '44', display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: isChosen ? "#fff" : C.muted }}>
                        {isChosen ? "●" : String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit bar — sticky at bottom */}
      <div style={{ position: "fixed", bottom: 80, left: 0, right: 0, padding: "12px 20px", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderTop: "1px solid #F0EDE8", zIndex: 50 }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          {!allAnswered && (
            <p style={{ textAlign: "center", color: C.muted, fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
              {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? 's' : ''} left to answer
            </p>
          )}
          <Btn onClick={handleSubmit} disabled={!allAnswered} size="lg" color={C.fire}
            style={{ width: "100%", boxShadow: allAnswered ? `0 5px 0 ${C.fire}66` : "none" }}>
            {allAnswered ? "Submit Answers ✓" : `Answer all ${questions.length} questions first`}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Results with review ───────────────────────────────
function PracticeResults({ results, subtopicName, userId, subtopicId, onRetryWrong, onRetryAll, onBack }) {
  const [reviewOpen, setReviewOpen] = useState({});
  const [showXP, setShowXP]         = useState(false);
  const [showConf, setShowConf]     = useState(false);

  const correct  = results.filter(r => r.isCorrect).length;
  const total    = results.length;
  const accuracy = total > 0 ? Math.round(correct / total * 100) : 0;
  const xpEarned = correct * 15; // 15 XP per correct practice answer
  const wrong    = results.filter(r => !r.isCorrect);

  const accentColor = accuracy >= 80 ? C.mint : accuracy >= 50 ? C.sun : "#E74C3C";
  const trophy      = accuracy >= 80 ? "🏆" : accuracy >= 50 ? "💪" : "📚";
  const message     = accuracy >= 80
    ? "Excellent work! You've got this topic down! 🌟"
    : accuracy >= 50
    ? "Good effort! Keep practising to improve. 💪"
    : "Don't give up — review the lesson and try again! 📖";

  // Save XP once on mount
  useEffect(() => {
    if (userId && subtopicId && xpEarned > 0) {
      saveProgress(userId, subtopicId, correct, xpEarned)
        .then(() => { setShowConf(true); setShowXP(true); setTimeout(() => setShowConf(false), 2600); })
        .catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 16px 100px" }}>
      {showConf && <Confetti />}
      {showXP && <XPPopup amount={xpEarned} onDone={() => setShowXP(false)} />}

      {/* Score card */}
      <div className="card anim-popIn" style={{ padding: "32px 24px", textAlign: "center", marginBottom: 16, background: `linear-gradient(135deg,${accentColor}08,#fff)`, border: `2px solid ${accentColor}33` }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>{trophy}</div>
        <h2 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 26, color: C.navy, marginBottom: 4 }}>
          Practice Complete!
        </h2>
        <p style={{ color: C.muted, fontWeight: 600, marginBottom: 20, fontSize: 13 }}>{subtopicName}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
          {[
            { label: "Correct",  value: correct,       color: C.mint,     icon: "✅" },
            { label: "Wrong",    value: wrong.length,  color: "#E74C3C",  icon: "❌" },
            { label: "Score",    value: `${accuracy}%`,color: accentColor,icon: "🎯" },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{ background: "#fff", borderRadius: 14, padding: "12px 6px", border: "1.5px solid #F0EDE8" }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
              <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 20, color }}>{value}</div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{label}</div>
            </div>
          ))}
        </div>

        <ProgressBar pct={accuracy} color={accentColor} height={8} />

        {xpEarned > 0 && (
          <div style={{ marginTop: 12, fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 15, color: C.sun }}>
            ⭐ +{xpEarned} XP earned!
          </div>
        )}
        <p style={{ color: C.muted, fontSize: 13, fontWeight: 600, marginTop: 8 }}>{message}</p>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <Btn onClick={onRetryAll} outline color={C.purple} style={{ flex: 1 }}>🔄 Try Again</Btn>
        {wrong.length > 0 && (
          <Btn onClick={onRetryWrong} color={C.fire} style={{ flex: 1, boxShadow: `0 4px 0 ${C.fire}55` }}>
            🎯 Retry {wrong.length} Wrong
          </Btn>
        )}
        <Btn onClick={onBack} color={C.mint} style={{ flex: 1, boxShadow: `0 4px 0 ${C.mint}55` }}>
          📖 Back to Lesson
        </Btn>
      </div>

      {/* Per-question review */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #E8E8EE", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F0EDE8", background: "#FAFAF8" }}>
          <span style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 15, color: C.navy }}>📋 Review Your Answers</span>
        </div>
        {results.map((r, i) => {
          const opts = parseOptions(r.question?.options);
          const correctIdx = r.question?.answer ?? 0;
          const isOpen = reviewOpen[i];
          return (
            <div key={i} style={{ borderBottom: "1px solid #F5F2EC" }}>
              <div onClick={() => setReviewOpen(o => ({ ...o, [i]: !o[i] }))} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 20px", cursor: "pointer", background: isOpen ? "#FAFAF8" : "#fff" }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, marginTop: 2, background: r.isCorrect ? `${C.mint}20` : "#FFE8E8", border: `1.5px solid ${r.isCorrect ? C.mint : "#E74C3C"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: r.isCorrect ? "#1a7a56" : "#C0392B" }}>
                  {r.isCorrect ? "✓" : "✗"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, lineHeight: 1.5 }}>Q{i + 1}. {r.question?.question}</div>
                  {!r.isCorrect && (
                    <div style={{ fontSize: 12, color: "#999", fontWeight: 600, marginTop: 2 }}>
                      Your answer: <span style={{ color: "#C0392B" }}>{opts[r.selectedIdx] ?? "–"}</span>
                      {" · "}Correct: <span style={{ color: "#1a7a56" }}>{opts[correctIdx]}</span>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 14, color: C.muted, flexShrink: 0, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
              </div>
              {isOpen && (
                <div style={{ padding: "0 20px 14px 58px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
                    {opts.map((opt, oi) => (
                      <div key={oi} style={{ padding: "7px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: oi === correctIdx ? "#D4F5EC" : oi === r.selectedIdx && !r.isCorrect ? "#FFE8E8" : "#F5F2EC", border: `1.5px solid ${oi === correctIdx ? C.mint : oi === r.selectedIdx && !r.isCorrect ? "#E74C3C" : "#E8E8EE"}`, color: oi === correctIdx ? "#1a5c3a" : C.navy }}>
                        <span style={{ fontWeight: 800, marginRight: 6 }}>{["A","B","C","D"][oi]}.</span>{opt}
                        {oi === correctIdx && <span style={{ marginLeft: 8, fontSize: 11 }}>✓ Correct</span>}
                        {oi === r.selectedIdx && !r.isCorrect && <span style={{ marginLeft: 8, fontSize: 11, color: "#C0392B" }}>✗ Your answer</span>}
                      </div>
                    ))}
                  </div>
                  {r.question?.explanation && (
                    <div style={{ background: "#EEF4FF", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#3a5a8a", lineHeight: 1.6, fontWeight: 600 }}>
                      💡 {r.question.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Orchestrator ──────────────────────────────────────────────
export default function PracticeModule({ subtopicId, subtopic, userId, onBack }) {
  const [phase,      setPhase]      = useState("setup");
  const [count,      setCount]      = useState(10);
  const [pool,       setPool]       = useState(null);
  const [results,    setResults]    = useState([]);
  const [sessionKey, setSessionKey] = useState(0);

  // Query directly by subtopic_id — no need to go through lesson
  const { questions: allQuestions, loading } = usePracticeQuestions(subtopicId);

  const startSession = (n, questionPool) => {
    const src    = questionPool || allQuestions;
    const picked = shuffleArray(src).slice(0, n);
    setPool(picked);
    setCount(n);
    setPhase("session");
    setSessionKey(k => k + 1);
  };

  if (loading) return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
      <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 22, color: C.navy }}>Loading questions…</div>
    </div>
  );

  if (!allQuestions.length) return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
      <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 22, color: C.navy, marginBottom: 10 }}>
        No practice questions yet
      </div>
      <p style={{ color: C.muted, fontWeight: 600, marginBottom: 24 }}>
        Practice questions for <strong>{subtopic?.name}</strong> haven't been prepared yet. Check back soon!
      </p>
      <Btn onClick={onBack} outline color={C.muted}>← Back to Lesson</Btn>
    </div>
  );

  if (phase === "session" && pool) {
    return (
      <PracticeSession
        key={sessionKey}
        questions={pool}
        onDone={res => { setResults(res); setPhase("results"); }}
        onBack={() => setPhase("setup")}
      />
    );
  }

  if (phase === "results") {
    const wrongQs = results.filter(r => !r.isCorrect).map(r => r.question).filter(Boolean);
    return (
      <PracticeResults
        results={results}
        subtopicName={subtopic?.name || "Topic"}
        userId={userId}
        subtopicId={subtopicId}
        onRetryAll={() => startSession(count, allQuestions)}
        onRetryWrong={() => wrongQs.length > 0 && startSession(wrongQs.length, wrongQs)}
        onBack={onBack}
      />
    );
  }

  return (
    <PracticeSetup
      subtopicName={subtopic?.name || "Topic"}
      totalAvailable={allQuestions.length}
      onStart={n => startSession(n, allQuestions)}
      onBack={onBack}
    />
  );
}

const backBtnStyle = {
  background: "transparent", border: "none", color: C.muted,
  fontSize: 14, fontWeight: 700, cursor: "pointer",
  marginBottom: 20, padding: "4px 0", fontFamily: "inherit", display: "block",
};