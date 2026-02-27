// src/components/lesson/LessonPage.jsx
// ============================================================
// Renders a single AI-generated lesson.
//
// Structure:
//   1. Hook fetches / generates lesson from Supabase
//   2. Shows: Introduction → Concept → Worked Examples → Quiz
//   3. Quiz gate: must answer at least 1 correctly to complete
//   4. On completion: saves XP, fires confetti, unlocks next lesson
// ============================================================

import { useState, useRef } from 'react';
import { C } from '../../constants/colors';
import { useLesson, useProgress } from '../../hooks/useContent';
import { flagQuestion } from '../../services/content';
import RichText from '../ui/RichText';
import Confetti from '../ui/Confetti';
import XPPopup from '../ui/XPPopup';

export default function LessonPage({ subtopic, userId, onBack, onComplete, onNext, onPracticeMore }) {
  const { lesson, examples, questions, status, error } = useLesson(subtopic?.id ?? null);
  const { saveProgress } = useProgress(userId);

  if (status === 'loading')    return <LessonSkeleton onBack={onBack} />;
  if (status === 'generating') return <LessonGenerating subtopic={subtopic} onBack={onBack} />;
  if (status === 'error')      return <LessonError message={error} onBack={onBack} />;
  if (!lesson)                 return <LessonGenerating subtopic={subtopic} onBack={onBack} />;

  return (
    <LessonContent
      lesson={lesson}
      examples={examples}
      questions={questions}
      subtopic={subtopic}
      userId={userId}
      saveProgress={saveProgress}
      onBack={onBack}
      onComplete={onComplete}
      onNext={onNext || onBack}
      onPracticeMore={onPracticeMore}
    />
  );
}

// ── Parse lesson.content (JSON or legacy markdown) ────────────
function parseLessonJSON(lesson) {
  // Already parsed object
  if (lesson._parsed) return lesson;

  const raw = lesson.content || '';

  // Try JSON first (new format)
  try {
    const data = JSON.parse(raw);
    if (data.intro || data.concept) {
      return {
        ...lesson,
        _parsed:      true,
        _json:        data,
        introduction: data.intro?.text    || '',
        intro_svg:    data.intro?.svg     || null,
        explanation:  data.concept?.text  || '',
        concept_svg:  data.concept?.svg   || null,
        examples_json: data.examples      || [],
        summary:      data.summary        || '',
        quickCheck:   data.quickCheck     || [],
      };
    }
  } catch (_) {}

  // Legacy markdown fallback
  const sectionRegex = /^### (.+)$/gm;
  const indices = [];
  let match;
  while ((match = sectionRegex.exec(raw)) !== null) {
    indices.push({ name: match[1].trim(), start: match.index + match[0].length });
  }
  const parts = {};
  for (let i = 0; i < indices.length; i++) {
    const end = i + 1 < indices.length ? indices[i + 1].start - indices[i + 1].name.length - 5 : raw.length;
    parts[indices[i].name] = raw.slice(indices[i].start, end).trim();
  }
  return {
    ...lesson,
    _parsed:       true,
    _json:         null,
    introduction:  parts['Intro'] || parts['Introduction'] || '',
    intro_svg:     null,
    explanation:   parts['Concept'] || parts['The Concept'] || raw,
    concept_svg:   null,
    examples_json: [],
    summary:       parts['Mini Summary'] || parts['Summary'] || '',
    quickCheck:    [],
    quick_check:   parts['Quick Check'] || '',
  };
}

// ── Parse legacy Quick Check text block ───────────────────────
function parseQuickCheck(text) {
  if (!text) return [];
  const blocks = text.split(/(?=\d+\.\s)/).filter(b => b.trim());
  return blocks.map((block, i) => {
    const lines       = block.split('').map(l => l.trim()).filter(Boolean);
    const question    = lines[0]?.replace(/^\d+\.\s*/, '').trim() ?? '';
    const optA        = lines.find(l => /^A\./.test(l))?.replace(/^A\.\s*/, '').trim() ?? '';
    const optB        = lines.find(l => /^B\./.test(l))?.replace(/^B\.\s*/, '').trim() ?? '';
    const optC        = lines.find(l => /^C\./.test(l))?.replace(/^C\.\s*/, '').trim() ?? '';
    const optD        = lines.find(l => /^D\./.test(l))?.replace(/^D\.\s*/, '').trim() ?? '';
    const answerLine  = lines.find(l => /^Answer:/i.test(l)) ?? '';
    const answerLetter = answerLine.replace(/^Answer:\s*/i, '').trim().toUpperCase()[0] ?? 'A';
    const explIdx     = lines.findIndex(l => /^Explanation:/i.test(l));
    const explanation = explIdx >= 0 ? lines.slice(explIdx).join(' ').replace(/^Explanation:\s*/i, '').trim() : '';
    return { id: i, question, options: [optA, optB, optC, optD], answer: 'ABCD'.indexOf(answerLetter), explanation };
  }).filter(q => q.question && q.options.every(o => o));
}

// ── ConceptBody — renders concept text line-by-line + SVG ─────
function ConceptBody({ text, svg }) {
  if (!text && !svg) return null;
  // Normalise escaped newlines that come out of JSON.stringify
  const normalised = (text || '').replace(/\\n/g, '\n').replace(/\\t/g, ' ');
  const lines = normalised.split('\n');
  return (
    <div>
      {lines.map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} style={{ height: 8 }} />;
        if (/^[-•–*]\s/.test(t)) return (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
            <span style={{ color: '#6C63FF', fontWeight: 900, marginTop: 3, flexShrink: 0 }}>–</span>
            <p className="lesson-text" style={{ margin: 0 }}>
              <RichText text={t.replace(/^[-•–*]\s+/, '')} />
            </p>
          </div>
        );
        if (t.endsWith(':') && t.length < 60) return (
          <p key={i} className="lesson-concept-heading" style={{ marginTop: 14 }}>
            <RichText text={t} />
          </p>
        );
        return <p key={i} className="lesson-text" style={{ marginBottom: 6 }}><RichText text={t} /></p>;
      })}
      {svg && (
        <div className="lesson-illustration concept" aria-label="Concept diagram"
          dangerouslySetInnerHTML={{ __html: svg }} />
      )}
    </div>
  );
}
// ── ExampleCard — renders a single worked example ─────────────
function ExampleCard({ example, index }) {
  const accent  = ['#43CFAC', '#6C63FF', '#FF9A3C'][index % 3];
  const problem = example.problem     || example.title       || '';
  const answer  = example.answer      || example.finalAnswer || '';
  const raw     = example.explanation || example.working
               || (Array.isArray(example.steps) ? example.steps.join('\n') : '');
  // Normalise newlines from JSON
  const working = raw.replace(/\\n/g, '\n');
  const steps   = working.split('\n').filter(l => l.trim());

  return (
    <div className="lesson-example" style={{ marginBottom: 12 }}>
      {/* Problem — full width, its own line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8, flexShrink: 0,
          background: accent, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff',
        }}>{index + 1}</div>
        <span className="lesson-example-problem" style={{ flex: 1 }}>
          <RichText text={problem} />
        </span>
      </div>

      {/* Step-by-step explanation — each step on its own line */}
      {steps.length > 0 && (
        <div style={{ paddingLeft: 36, marginBottom: 10 }}>
          {steps.map((step, si) => (
            <div key={si} style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              marginBottom: 6, fontSize: '0.875rem', color: '#4a7a68',
              fontFamily: 'Georgia, serif', lineHeight: 1.65,
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                background: `${accent}22`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, fontWeight: 800, color: accent, marginTop: 2,
              }}>{si + 1}</span>
              <span><RichText text={step.replace(/^[-•*]\s*Step\s*\d+[:.:]?\s*/i, '').replace(/^[-•*]\s*/, '').trim()} /></span>
            </div>
          ))}
        </div>
      )}

      {/* Final answer — highlighted, full line */}
      {answer && (
        <div style={{
          paddingLeft: 36, display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px 8px 36px', background: `${accent}12`,
          borderRadius: 8, borderLeft: `3px solid ${accent}`,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a5c3a' }}>Answer:</span>
          <span className="lesson-example-answer"><RichText text={answer} /></span>
        </div>
      )}
    </div>
  );
}
// ── Main lesson content (only rendered once lesson is loaded) ─
function LessonContent({ lesson: rawLesson, examples, questions, subtopic, userId, saveProgress, onBack, onComplete, onNext, onPracticeMore }) {
  const lesson = parseLessonJSON(rawLesson);
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [showXP,    setShowXP]    = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [flagged,   setFlagged]   = useState({});
  const quizRef = useRef(null);

  const opts        = (q) => Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]');
  // activeQs: use DB questions if available, else parse from content
  const activeQs    = questions.length > 0
    ? questions
    : (lesson.quickCheck?.length > 0 ? lesson.quickCheck.map((q, i) => ({ ...q, id: i })) : parseQuickCheck(lesson.quick_check));
  const correct     = activeQs.filter((q, i) => answers[q.id ?? i] === q.answer).length;
  const allAnswered = activeQs.length > 0 && activeQs.every((q, i) => (q.id ?? i) in answers);
  const xpEarned    = correct * 25;

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSubmitted(true);
    if (correct >= 1) {
      setShowConf(true);
      setShowXP(true);
      setTimeout(() => setShowConf(false), 2600);
      if (userId) {
        setSaving(true);
        await saveProgress(subtopic.id, correct, xpEarned);
        setSaving(false);
        // Immediately refresh completion state so the subtopic list updates
        // without needing a page reload
        onComplete?.();
      }
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFlag = async (questionId) => {
    if (flagged[questionId]) return;
    try {
      await flagQuestion(questionId);
      setFlagged(f => ({ ...f, [questionId]: true }));
    } catch (e) { console.error('Flag failed:', e); }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 140px', position: 'relative' }}>
      {showConf && <Confetti />}
      {showXP   && <XPPopup amount={xpEarned} onDone={() => setShowXP(false)} />}

      {/* Back button */}
      <button onClick={onBack} style={backBtnStyle}>← Back</button>

      {/* ── LESSON HEADER ── */}
      <div className="anim-fadeUp" style={{ marginBottom: 28 }}>
        <div style={{
          display: 'inline-block',
          padding: '4px 14px',
          borderRadius: 50,
          background: `${C.fire}15`,
          border: `1.5px solid ${C.fire}44`,
          fontSize: 12,
          fontWeight: 800,
          color: C.fire,
          marginBottom: 10,
          letterSpacing: 0.3,
        }}>
          📐 MATHEMATICS LESSON
        </div>
        <h1 style={{
          fontFamily: "'Baloo 2'",
          fontWeight: 900,
          fontSize: 34,
          color: C.navy,
          lineHeight: 1.1,
          marginBottom: 0,
        }}>
          {lesson.title}
        </h1>
      </div>

      {/* ── INTRODUCTION ── */}
      <Section
        emoji="👋"
        title="Hey there!"
        bg={`linear-gradient(135deg, #FFF8E1, #FFF3F3)`}
        delay="0.05s"
      >
        <div className="lesson-section-label intro">Introduction</div>
        <p className="lesson-text"><RichText text={lesson.introduction} /></p>
        {lesson.intro_svg && (
          <div
            className="lesson-illustration intro"
            aria-label="Introduction illustration"
            dangerouslySetInnerHTML={{ __html: lesson.intro_svg }}
          />
        )}
      </Section>

      {/* ── CONCEPT / EXPLANATION ── */}
      <Section emoji="💡" title="The Concept" delay="0.1s">
        <div className="lesson-section-label concept">Concept</div>
        <ConceptBody text={lesson.explanation} svg={lesson.concept_svg} />
      </Section>

      {/* ── EXAMPLES ── */}
      {(() => {
        const exs = lesson.examples_json?.length > 0
          ? lesson.examples_json
          : (examples.length > 0 ? examples : []);
        if (exs.length === 0) return null;
        return (
          <div className="anim-fadeUp" style={{ marginBottom: 24, animationDelay: '0.14s' }}>
            <SectionHeading emoji="✏️" title="Examples" />
            <div className="lesson-section-label examples" style={{ marginBottom: 10 }}>Examples</div>
            <div className="lesson-examples">
              {exs.map((ex, ei) => (
                <ExampleCard key={ei} example={ex} index={ei} />
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── QUICK CHECK ── */}
      {(() => {
        // Use questions from DB if available, otherwise parse from lesson content
        if (activeQs.length === 0) return null;
        return (
        <div ref={quizRef} className="anim-fadeUp" style={{ marginBottom: 24, animationDelay: '0.18s' }}>
          <QuizHeader questionCount={activeQs.length} />
          <div style={{ background: '#fff', borderRadius: '0 0 24px 24px', border: `2px solid ${C.border}`, borderTop: 'none', padding: 24 }}>
            {activeQs.map((q, qi) => (
              <QuizQuestion
                key={q.id ?? qi}
                q={q}
                qi={qi}
                total={activeQs.length}
                answers={answers}
                submitted={submitted}
                flagged={flagged}
                onSelect={(idx) => !submitted && setAnswers(a => ({ ...a, [q.id ?? qi]: idx }))}
                onFlag={() => q.id && handleFlag(q.id)}
              />
            ))}

            {/* Submit / result */}
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!submitted && (
                <ActionBtn
                  onClick={handleSubmit}
                  disabled={!allAnswered || saving}
                  color={C.fire}
                >
                  {saving ? 'Saving… ⏳' : 'Check My Answers ✓'}
                </ActionBtn>
              )}

              {submitted && correct >= 1 && (
                <div className="anim-popIn">
                  <div style={{
                    background: `linear-gradient(135deg, ${C.mint}, #00897B)`,
                    borderRadius: 20,
                    padding: '20px 24px',
                    textAlign: 'center',
                    marginBottom: 14,
                    boxShadow: `0 8px 0 #00695C55`,
                  }}>
                    <div style={{ fontSize: 40, marginBottom: 6 }}>🎉</div>
                    <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 22, color: '#fff' }}>
                      {correct}/{activeQs.length} correct — great job!
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginTop: 4 }}>
                      You earned +{xpEarned} XP!
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {onPracticeMore && (
                      <ActionBtn onClick={onPracticeMore} color={C.purple} style={{ flex: 1 }}>
                        🎯 Practice More
                      </ActionBtn>
                    )}
                    <ActionBtn onClick={onNext} color={C.mint} style={{ flex: 1 }}>
                      Next Lesson →
                    </ActionBtn>
                  </div>
                </div>
              )}

              {submitted && correct === 0 && (
                <div className="anim-popIn">
                  <div style={{
                    background: `linear-gradient(135deg, ${C.rose}, #AD1457)`,
                    borderRadius: 20,
                    padding: '20px 24px',
                    textAlign: 'center',
                    marginBottom: 14,
                  }}>
                    <div style={{ fontSize: 40, marginBottom: 6 }}>💪</div>
                    <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 20, color: '#fff' }}>
                      Read the examples again — you've got this!
                    </div>
                  </div>
                  <ActionBtn onClick={handleRetry} color={C.rose} style={{ width: '100%' }}>
                    🔄 Try Again
                  </ActionBtn>
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* ── SUMMARY (if AI provides one) ── */}
      {lesson.summary && (
        <Section emoji="📌" title="Key Takeaways" delay="0.22s"
          bg={`linear-gradient(135deg, ${C.sky}12, ${C.purple}08)`}
        >
          <p className="lesson-prose"><RichText text={lesson.summary} /></p>
        </Section>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function Section({ emoji, title, children, bg, delay = '0s' }) {
  return (
    <div className="card anim-fadeUp" style={{
      padding: 28, marginBottom: 20, animationDelay: delay,
      background: bg || '#fff',
    }}>
      <SectionHeading emoji={emoji} title={title} />
      {children}
    </div>
  );
}

function SectionHeading({ emoji, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 18, color: C.navy }}>{title}</span>
    </div>
  );
}

function MathBox({ children }) {
  return (
    <div style={{
      background: `${C.fire}08`,
      border: `1.5px solid ${C.fire}22`,
      borderRadius: 14,
      padding: '12px 18px',
      fontFamily: 'monospace',
      fontSize: 15,
      color: C.navy,
    }}>
      {children}
    </div>
  );
}


function QuizHeader({ questionCount }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.fire}, ${C.sun})`,
      borderRadius: '24px 24px 0 0',
      padding: '18px 24px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: 26 }}>✏️</span>
      <div>
        <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 20, color: '#fff' }}>
          Quick Check
        </div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600 }}>
          {questionCount} question{questionCount !== 1 ? 's' : ''} · get at least 1 right to continue
        </div>
      </div>
    </div>
  );
}

function QuizQuestion({ q, qi, total, answers, submitted, flagged, onSelect, onFlag }) {
  const chosen  = answers[q.id];
  const isRight = submitted && chosen === q.answer;
  const opts    = Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]');

  return (
    <div style={{ marginBottom: qi < total - 1 ? 28 : 0 }}>
      <p style={{ fontWeight: 700, fontSize: 16, color: C.navy, marginBottom: 12, lineHeight: 1.5 }}>
        <span style={{ color: C.fire, fontWeight: 900, marginRight: 6 }}>{qi + 1}.</span>
        {q.question}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opts.map((opt, oi) => {
          let bg = '#F8F5F0', border = C.border, clr = C.navy;
          if (!submitted && chosen === oi)                      { bg = `${C.purple}12`; border = C.purple; clr = C.purple; }
          if (submitted && oi === q.answer)                     { bg = `${C.mint}18`;   border = C.mint;   clr = C.mint;   }
          if (submitted && oi === chosen && oi !== q.answer)    { bg = `${C.rose}12`;   border = C.rose;   clr = C.rose;   }

          return (
            <div
              key={oi}
              onClick={() => onSelect(oi)}
              style={{
                padding: '13px 18px', borderRadius: 16,
                border: `2.5px solid ${border}`,
                background: bg, color: clr,
                fontWeight: 700, fontSize: 15,
                cursor: submitted ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                transition: 'all 0.15s',
              }}
            >
              <span style={{
                width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                background: `${border}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 900,
              }}>
                {submitted
                  ? (oi === q.answer ? '✓' : oi === chosen ? '✗' : String.fromCharCode(65 + oi))
                  : String.fromCharCode(65 + oi)}
              </span>
              {opt}
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {submitted && (
        <div style={{
          marginTop: 12,
          padding: '12px 16px',
          borderRadius: 14,
          background: isRight ? `${C.mint}15` : `${C.rose}10`,
          border: `1.5px solid ${isRight ? C.mint + '44' : C.rose + '33'}`,
          fontSize: 14, fontWeight: 600,
          color: isRight ? '#1a5c3a' : '#8b0000',
          lineHeight: 1.6,
        }}>
          <strong>{isRight ? '✅ Correct! ' : '❌ Not quite. '}</strong>
          {q.explanation}

          {/* Flag button — only show for wrong answers */}
          {!isRight && (
            <div style={{ marginTop: 8 }}>
              <button
                onClick={onFlag}
                style={{
                  background: 'transparent', border: 'none',
                  cursor: flagged[q.id] ? 'default' : 'pointer',
                  fontSize: 11, fontWeight: 700, padding: 0, fontFamily: 'inherit',
                  color: flagged[q.id] ? C.muted : C.rose,
                }}
              >
                {flagged[q.id] ? '✓ Flagged — thanks!' : '🚩 Flag this question as incorrect'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ children, onClick, disabled, color = C.fire, style: sx = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? C.border : color,
        color: '#fff',
        border: 'none',
        borderRadius: 50,
        padding: '14px 32px',
        fontSize: 17,
        fontWeight: 800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'Baloo 2'",
        boxShadow: disabled ? 'none' : `0 5px 0 ${color}66`,
        transition: 'all 0.15s',
        width: '100%',
        ...sx,
      }}
    >
      {children}
    </button>
  );
}

// ── Loading / Generating / Error states ───────────────────────

function LessonSkeleton({ onBack }) {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 120px' }}>
      <button onClick={onBack} style={backBtnStyle}>← Back</button>
      {[280, 160, 320, 200].map((h, i) => (
        <div key={i} className="skeleton" style={{ height: h, borderRadius: 20, marginBottom: 18 }} />
      ))}
    </div>
  );
}

function LessonGenerating({ subtopic, onBack }) {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 20, animation: 'pulse 1.5s ease-in-out infinite' }}>📚</div>
      <h2 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 26, color: C.navy, marginBottom: 12 }}>
        Getting your lesson ready…
      </h2>
      <p style={{ color: C.muted, fontWeight: 600, fontSize: 15, lineHeight: 1.7, marginBottom: 10 }}>
        Your lesson on{' '}
        <strong style={{ color: C.fire }}>{subtopic?.name}</strong>{' '}
        is being prepared. Hang tight!
      </p>
      <p style={{ color: C.muted, fontWeight: 600, fontSize: 13, marginBottom: 36 }}>
        This only takes a few seconds ✨
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 40 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%', background: C.fire,
            animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
          }} />
        ))}
      </div>
      <button onClick={onBack} style={{ ...backBtnStyle, display: 'inline-block' }}>← Back to Topics</button>
    </div>
  );
}

function LessonError({ message, onBack }) {
  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 22, color: C.navy, marginBottom: 10 }}>
        Couldn't load lesson
      </h2>
      <p style={{ color: C.muted, fontWeight: 600, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
        {message || 'Something went wrong. Please try again.'}
      </p>
      <button onClick={onBack} style={{ ...backBtnStyle, display: 'inline-block' }}>← Go Back</button>
    </div>
  );
}

// ── Utils ─────────────────────────────────────────────────────

function isMathBlock(para) {
  return para.startsWith('*') && !para.startsWith('**');
}

const backBtnStyle = {
  background: 'transparent', border: 'none',
  color: C.muted, fontSize: 14, fontWeight: 700,
  cursor: 'pointer', marginBottom: 24, padding: '4px 0',
  fontFamily: 'inherit',
  display: 'block',
};