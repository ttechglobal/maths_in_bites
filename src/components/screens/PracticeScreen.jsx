// src/components/screens/PracticeScreen.jsx
// ================================================================
// Practice Page — full student-facing practice flow.
//
// Step 1: Topics (from DB for this learning path)
// Step 2: Subtopics (from DB for the chosen topic)
// Step 3: Practice Questions for that subtopic
//         — with difficulty tags, show/hide answer + explanation
//
// All data from Supabase. Zero hardcoded topics.
// ================================================================

import { useState } from 'react';
import { C } from '../../constants/colors';
import { PAGE_ACCENTS } from '../../constants/accents';
import { useSubtopics, usePracticeQuestions } from '../../hooks/useContent';
import Pill from '../ui/Pill';

const accent = PAGE_ACCENTS.practice;

// ── Root orchestrator ─────────────────────────────────────────
export default function PracticeScreen({ topics = [], grade, learningPathId }) {
  const [step,           setStep]           = useState('topic');
  const [activeTopic,    setActiveTopic]    = useState(null);
  const [activeSubtopic, setActiveSubtopic] = useState(null);

  if (step === 'questions' && activeSubtopic) {
    return (
      <PracticeQuestionsPage
        topic={activeTopic}
        subtopic={activeSubtopic}
        onBack={() => { setActiveSubtopic(null); setStep('subtopic'); }}
        onBackToTopics={() => { setActiveTopic(null); setActiveSubtopic(null); setStep('topic'); }}
      />
    );
  }

  if (step === 'subtopic' && activeTopic) {
    return (
      <SubtopicPicker
        topic={activeTopic}
        onSelect={sub => { setActiveSubtopic(sub); setStep('questions'); }}
        onBack={() => { setActiveTopic(null); setStep('topic'); }}
      />
    );
  }

  return (
    <TopicPicker
      topics={topics}
      onSelect={t => { setActiveTopic(t); setStep('subtopic'); }}
    />
  );
}

// ── Step 1: Pick a topic ──────────────────────────────────────
function TopicPicker({ topics, onSelect }) {
  if (!topics || topics.length === 0) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
        <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 22, color: C.navy, marginBottom: 10 }}>
          No topics yet
        </div>
        <p style={{ color: C.muted, fontWeight: 600 }}>
          Topics will appear here once an admin uploads the curriculum.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 16px 100px' }}>
      <div className="anim-fadeUp" style={{ marginBottom: 24 }}>
        <Pill color={accent.primary}>🎯 Practice</Pill>
        <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 32, color: C.navy, margin: '10px 0 4px' }}>
          Pick a Topic
        </h1>
        <p style={{ color: C.muted, fontWeight: 600 }}>Choose what you want to practise today</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {topics.map((t, idx) => (
          <div
            key={t.id}
            className="card anim-fadeUp"
            onClick={() => onSelect(t)}
            style={{
              padding: '18px 22px', cursor: 'pointer',
              animationDelay: `${idx * 0.06}s`,
              display: 'flex', alignItems: 'center', gap: 14,
            }}
          >
            <div style={{
              width: 46, height: 46, borderRadius: 14, flexShrink: 0,
              background: `linear-gradient(135deg,${accent.primary}33,${accent.secondary}22)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, border: `2px solid ${accent.primary}44`,
            }}>{t.icon || '📖'}</div>

            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 17, color: C.navy }}>
                {t.name}
              </div>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginTop: 2 }}>
                Tap to see subtopics
              </div>
            </div>
            <div style={{ fontSize: 20, color: C.border }}>›</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 2: Pick a subtopic ───────────────────────────────────
function SubtopicPicker({ topic, onSelect, onBack }) {
  const { subtopics, status } = useSubtopics(topic?.id ?? null);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 16px 100px' }}>
      <button onClick={onBack} style={backBtnStyle}>← Back to Topics</button>

      <div className="anim-fadeUp" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{topic?.icon || '📖'}</div>
        <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 28, color: C.navy, marginBottom: 4 }}>
          {topic?.name}
        </h1>
        <p style={{ color: C.muted, fontWeight: 600 }}>Select a subtopic to practise</p>
      </div>

      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 16 }} />)}
        </div>
      )}

      {status === 'empty' && (
        <div style={{ padding: '40px 0', textAlign: 'center', color: C.muted, fontWeight: 600 }}>
          No subtopics for this topic yet.
        </div>
      )}

      {status === 'ready' && subtopics.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {subtopics.map((sub, idx) => (
            <div
              key={sub.id}
              className="card anim-fadeUp"
              onClick={() => onSelect(sub)}
              style={{
                padding: '18px 22px', cursor: 'pointer',
                animationDelay: `${idx * 0.06}s`,
                display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 14, flexShrink: 0,
                background: `linear-gradient(135deg,${accent.primary}22,${accent.secondary}11)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, border: `2px solid ${accent.primary}33`,
              }}>🎯</div>

              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 16, color: C.navy }}>
                  {sub.name}
                </div>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginTop: 2 }}>
                  Tap to practise
                </div>
              </div>
              <div style={{ fontSize: 20, color: C.border }}>›</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 3: Practice questions feed ──────────────────────────
const DIFFICULTY_COLORS = {
  easy:   { bg: `${C.mint}18`,   border: `${C.mint}44`,   text: C.mint   },
  medium: { bg: `${C.sun}18`,    border: `${C.sun}44`,    text: '#b37a00' },
  hard:   { bg: `${C.rose}15`,   border: `${C.rose}44`,   text: C.rose   },
};

function PracticeQuestionsPage({ topic, subtopic, onBack, onBackToTopics }) {
  const { questions, loading } = usePracticeQuestions(subtopic?.id ?? null);
  const [revealed, setReveal]  = useState({});  // questionId → true

  const toggleReveal = (id) => setReveal(r => ({ ...r, [id]: !r[id] }));

  // Group by difficulty for stats
  const easy   = questions.filter(q => q.difficulty === 'easy').length;
  const medium = questions.filter(q => q.difficulty === 'medium').length;
  const hard   = questions.filter(q => q.difficulty === 'hard').length;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 120px' }}>

      {/* Breadcrumb back */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={onBackToTopics} style={backBtnStyle}>← Topics</button>
        <span style={{ color: C.border, lineHeight: '28px' }}>›</span>
        <button onClick={onBack} style={backBtnStyle}>{topic?.name}</button>
        <span style={{ color: C.border, lineHeight: '28px' }}>›</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.navy, lineHeight: '28px' }}>
          {subtopic?.name}
        </span>
      </div>

      {/* Header */}
      <div className="anim-fadeUp" style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 28, color: C.navy, marginBottom: 8 }}>
          {subtopic?.name}
        </h1>

        {!loading && questions.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Pill color={accent.primary}>{questions.length} questions</Pill>
            {easy   > 0 && <Pill color={C.mint}>🟢 {easy} easy</Pill>}
            {medium > 0 && <Pill color={C.sun}>🟡 {medium} medium</Pill>}
            {hard   > 0 && <Pill color={C.rose}>🔴 {hard} hard</Pill>}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 18 }} />)}
        </div>
      )}

      {/* No questions yet */}
      {!loading && questions.length === 0 && (
        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📭</div>
          <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 22, color: C.navy, marginBottom: 8 }}>
            No practice questions yet
          </div>
          <p style={{ color: C.muted, fontWeight: 600, lineHeight: 1.7 }}>
            Questions for <strong>{subtopic?.name}</strong> haven't been generated yet.
            Ask your admin to generate them.
          </p>
        </div>
      )}

      {/* Questions list */}
      {!loading && questions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {questions.map((q, idx) => {
            const diff    = q.difficulty || 'medium';
            const dStyle  = DIFFICULTY_COLORS[diff] || DIFFICULTY_COLORS.medium;
            const opts    = Array.isArray(q.options) ? q.options : [];
            const isOpen  = revealed[q.id];

            return (
              <div
                key={q.id}
                className="card anim-fadeUp"
                style={{ padding: 22, animationDelay: `${idx * 0.04}s`, overflow: 'hidden' }}
              >
                {/* Question header row */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
                  {/* Number badge */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                    background: `linear-gradient(135deg,${accent.primary},${accent.secondary})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 900, color: '#fff',
                  }}>{idx + 1}</div>

                  <div style={{ flex: 1 }}>
                    {/* Difficulty tag */}
                    <div style={{ marginBottom: 8 }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 50,
                        fontSize: 11, fontWeight: 800, letterSpacing: 0.4,
                        background: dStyle.bg, border: `1.5px solid ${dStyle.border}`,
                        color: dStyle.text,
                      }}>
                        {diff.toUpperCase()}
                      </span>
                    </div>

                    {/* Question text */}
                    <p style={{ fontWeight: 700, fontSize: 15, color: C.navy, lineHeight: 1.6, margin: 0 }}>
                      {q.question}
                    </p>
                  </div>
                </div>

                {/* Options (multiple choice) */}
                {opts.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {opts.map((opt, oi) => {
                      const isCorrect = isOpen && oi === q.answer;
                      return (
                        <div key={oi} style={{
                          padding: '10px 16px', borderRadius: 12,
                          fontSize: 14, fontWeight: 600,
                          background: isCorrect ? `${C.mint}18` : '#F8F5F0',
                          border: `2px solid ${isCorrect ? C.mint : C.border}`,
                          color: isCorrect ? '#1a5c3a' : C.navy,
                          display: 'flex', alignItems: 'center', gap: 10,
                          transition: 'all 0.2s',
                        }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                            background: isCorrect ? `${C.mint}33` : `${C.border}55`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 900,
                            color: isCorrect ? C.mint : C.muted,
                          }}>
                            {isCorrect ? '✓' : String.fromCharCode(65 + oi)}
                          </span>
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Show/hide answer button */}
                <button
                  onClick={() => toggleReveal(q.id)}
                  style={{
                    background: isOpen ? `${C.mint}15` : `${accent.primary}12`,
                    border: `2px solid ${isOpen ? C.mint + '44' : accent.primary + '33'}`,
                    borderRadius: 50, padding: '8px 20px',
                    fontSize: 13, fontWeight: 800,
                    color: isOpen ? C.mint : accent.primary,
                    cursor: 'pointer', marginBottom: isOpen ? 14 : 0,
                    transition: 'all 0.2s',
                  }}
                >
                  {isOpen ? '🙈 Hide Answer' : '👁 Show Answer'}
                </button>

                {/* Answer + explanation */}
                {isOpen && (
                  <div className="anim-fadeUp" style={{
                    padding: '14px 18px', borderRadius: 16,
                    background: `${C.sky}10`, border: `1.5px solid ${C.sky}33`,
                  }}>
                    {/* If no multiple choice, show the answer text */}
                    {opts.length === 0 && q.answer !== undefined && (
                      <div style={{ marginBottom: 10 }}>
                        <span style={{ fontWeight: 800, fontSize: 12, color: C.mint, letterSpacing: 0.5 }}>
                          ANSWER
                        </span>
                        <div style={{ fontWeight: 700, fontSize: 15, color: C.navy, marginTop: 4 }}>
                          {q.answer}
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <>
                        <div style={{ fontWeight: 800, fontSize: 12, color: C.sky, letterSpacing: 0.5, marginBottom: 6 }}>
                          💡 EXPLANATION
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, lineHeight: 1.7 }}>
                          {q.explanation}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const backBtnStyle = {
  background: 'transparent', border: 'none',
  color: C.muted, fontSize: 14, fontWeight: 700,
  cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit',
};