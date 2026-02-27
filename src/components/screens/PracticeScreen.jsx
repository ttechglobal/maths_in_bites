// src/components/screens/PracticeScreen.jsx
// ================================================================
// Practice Page — full student-facing flow.
//
// Flow: mode → (random-topics | topic → subtopic) → configure → quiz
//
// Quiz behaviour:
//   • Student navigates Prev / Next freely, picks answers
//   • No answers shown until they hit Submit at the end
//   • Submit → Score summary + XP award
//   • From summary they can Review every question (colour-coded)
//   • Hint button available per question during quiz
//   • Exit button shows "Are you sure?" confirm dialog
//   • Navigation sticky at the TOP so no scrolling needed
// ================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../../constants/colors';
import { PAGE_ACCENTS } from '../../constants/accents';
import { useSubtopics } from '../../hooks/useContent';
import { supabase } from '../../lib/supabase';
import * as content from '../../services/content';
import Pill from '../ui/Pill';

const accent = PAGE_ACCENTS.practice;

const TIME_OPTIONS = [
  { label: 'No limit', secs: 0   },
  { label: '1 min',   secs: 60   },
  { label: '2 min',   secs: 120  },
  { label: '3 min',   secs: 180  },
  { label: '5 min',   secs: 300  },
  { label: '10 min',  secs: 600  },
];
const Q_OPTIONS = [5, 10, 15, 20, 30, 40];
const XP_PER_CORRECT = 5;

// ─────────────────────────────────────────────────────────────
// Root orchestrator
// ─────────────────────────────────────────────────────────────
export default function PracticeScreen({ topics = [], grade, learningPathId }) {
  const [step,           setStep]          = useState('mode');
  const [activeTopic,    setActiveTopic]   = useState(null);
  const [activeSubtopic, setActiveSubtopic] = useState(null);
  const [quizMode,       setQuizMode]      = useState(null);   // 'topic' | 'random'
  const [quizConfig,     setQuizConfig]    = useState(null);
  const [selectedTopics, setSelectedTopics] = useState([]);

  const resetAll = () => {
    setStep('mode'); setActiveTopic(null); setActiveSubtopic(null);
    setQuizMode(null); setQuizConfig(null); setSelectedTopics([]);
  };

  if (step === 'quiz' && quizConfig) {
    return (
      <QuizScreen
        topic={activeTopic}
        subtopic={activeSubtopic}
        mode={quizMode}
        learningPathId={learningPathId}
        config={quizConfig}
        onBack={() => setStep('configure')}
        onBackToStart={resetAll}
      />
    );
  }

  if (step === 'configure') {
    return (
      <ConfigureScreen
        mode={quizMode}
        topic={activeTopic}
        subtopic={activeSubtopic}
        selectedTopics={selectedTopics}
        allTopics={topics}
        onBack={() => setStep(quizMode === 'random' ? 'random-topics' : 'subtopic')}
        onStart={(cfg) => { setQuizConfig(cfg); setStep('quiz'); }}
      />
    );
  }

  if (step === 'random-topics') {
    return (
      <RandomTopicSelector
        topics={topics}
        selected={selectedTopics}
        onChange={setSelectedTopics}
        onBack={() => setStep('mode')}
        onNext={() => setStep('configure')}
      />
    );
  }

  if (step === 'subtopic' && activeTopic) {
    return (
      <SubtopicPicker
        topic={activeTopic}
        onSelect={sub => { setActiveSubtopic(sub); setStep('configure'); }}
        onBack={() => { setActiveTopic(null); setStep('topic'); }}
      />
    );
  }

  if (step === 'topic') {
    return (
      <TopicPicker
        topics={topics}
        onSelect={t => { setActiveTopic(t); setStep('subtopic'); }}
        onBack={() => setStep('mode')}
      />
    );
  }

  return (
    <ModePicker
      onSelectTopic={() => { setQuizMode('topic'); setStep('topic'); }}
      onSelectRandom={() => { setQuizMode('random'); setSelectedTopics([]); setStep('random-topics'); }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Mode picker
// ─────────────────────────────────────────────────────────────
function ModePicker({ onSelectTopic, onSelectRandom }) {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 16px 100px' }}>
      <div className="anim-fadeUp" style={{ marginBottom: 28 }}>
        <Pill color={accent.primary}>🎯 Practice</Pill>
        <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 32, color: C.navy, margin: '10px 0 4px' }}>
          How do you want to practise?
        </h1>
        <p style={{ color: C.muted, fontWeight: 600 }}>Pick a mode to get started</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ModeCard
          icon="📚" iconBg={`linear-gradient(135deg,${accent.primary},${accent.secondary})`}
          title="Pick a Topic" desc="Focus on a specific topic and subtopic"
          onClick={onSelectTopic} delay="0.05s"
        />
        <ModeCard
          icon="🎲" iconBg={`linear-gradient(135deg,${C.rose},${C.sun})`}
          title="Random Challenge" desc="Mixed questions from topics you choose — or all of them!"
          onClick={onSelectRandom} delay="0.1s" highlight
        />
      </div>
    </div>
  );
}

function ModeCard({ icon, iconBg, title, desc, onClick, delay, highlight }) {
  return (
    <div className="card anim-fadeUp" onClick={onClick} style={{
      padding: '24px 22px', cursor: 'pointer', animationDelay: delay,
      background: highlight ? `linear-gradient(135deg,${C.rose}06,${C.sun}06)` : undefined,
      border: highlight ? `2px solid ${C.rose}33` : undefined,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 54, height: 54, borderRadius: 16, flexShrink: 0,
          background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
        }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 19, color: C.navy }}>{title}</div>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginTop: 3 }}>{desc}</div>
        </div>
        <div style={{ fontSize: 22, color: C.border }}>›</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Random mode — topic selector
// ─────────────────────────────────────────────────────────────
function RandomTopicSelector({ topics, selected, onChange, onBack, onNext }) {
  const allSelected = selected.length === 0;
  const numSelected = allSelected ? topics.length : selected.length;

  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter(x => x !== id));
    else onChange([...selected, id]);
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', paddingBottom: 100 }}>

      {/* ── Sticky top bar: back + selection summary + Next button ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(250,250,248,0.97)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        padding: '12px 16px',
      }}>
        {/* Row 1: back + Next button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button onClick={onBack} style={backBtnStyle}>← Back</button>
          <div style={{ flex: 1 }} />
          <button onClick={onNext} style={{
            padding: '10px 22px', borderRadius: 50, border: 'none',
            background: `linear-gradient(135deg,${accent.primary},${accent.secondary})`,
            color: '#fff', fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 15,
            cursor: 'pointer', boxShadow: `0 3px 14px ${accent.primary}44`,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            Next →
          </button>
        </div>

        {/* Row 2: selection status chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.navy }}>
            {allSelected ? `All ${topics.length} topics` : `${numSelected} of ${topics.length} selected`}
          </span>
          <div style={{ flex: 1 }} />
          <button onClick={() => onChange([])} style={{
            padding: '4px 14px', borderRadius: 50, cursor: 'pointer', fontWeight: 700, fontSize: 11,
            border: `1.5px solid ${allSelected ? accent.primary : C.border}`,
            background: allSelected ? `${accent.primary}15` : 'transparent',
            color: allSelected ? accent.primary : C.muted, transition: 'all 0.15s',
          }}>
            {allSelected ? '✓ All' : 'Select all'}
          </button>
          {!allSelected && (
            <button onClick={() => onChange([])} style={{
              padding: '4px 14px', borderRadius: 50, cursor: 'pointer', fontWeight: 700, fontSize: 11,
              border: `1.5px solid ${C.border}`, background: 'transparent', color: C.muted,
            }}>Clear</button>
          )}
        </div>
      </div>

      {/* ── Topic list ── */}
      <div style={{ padding: '16px 16px 0' }}>
        <div className="anim-fadeUp" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>🎲</div>
          <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 26, color: C.navy, marginBottom: 2 }}>
            Random Challenge
          </h1>
          <p style={{ color: C.muted, fontWeight: 600, fontSize: 13 }}>
            Pick topics below — or leave all selected for a full mix.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topics.map((t, idx) => {
            const isChecked = selected.includes(t.id);
            const dimmed = !allSelected && !isChecked;
            return (
              <div key={t.id} className="card anim-fadeUp" onClick={() => toggle(t.id)} style={{
                padding: '16px 20px', cursor: 'pointer', animationDelay: `${idx * 0.04}s`,
                display: 'flex', alignItems: 'center', gap: 14,
                opacity: dimmed ? 0.4 : 1,
                border: `2px solid ${isChecked ? accent.primary + '55' : C.border}`,
                background: isChecked ? `${accent.primary}06` : '#fff',
                transition: 'all 0.18s',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                  background: `linear-gradient(135deg,${accent.primary}33,${accent.secondary}22)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>{t.icon || '📖'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 16, color: C.navy }}>{t.name}</div>
                </div>
                {/* Animated checkbox */}
                <div style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  border: `2.5px solid ${isChecked ? accent.primary : C.border}`,
                  background: isChecked ? accent.primary : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: '#fff', fontWeight: 900,
                  transition: 'all 0.2s',
                  transform: isChecked ? 'scale(1)' : 'scale(0.9)',
                }}>{isChecked ? '✓' : ''}</div>
              </div>
            );
          })}
        </div>

        {/* Bottom Next button (convenience — same as sticky top) */}
        <button onClick={onNext} style={{
          width: '100%', marginTop: 20, padding: '15px', borderRadius: 18, border: 'none',
          background: `linear-gradient(135deg,${accent.primary},${accent.secondary})`,
          color: '#fff', fontSize: 17, fontFamily: "'Baloo 2'", fontWeight: 900,
          cursor: 'pointer', boxShadow: `0 4px 18px ${accent.primary}33`,
        }}>
          Next: Choose Questions →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Topic picker
// ─────────────────────────────────────────────────────────────
function TopicPicker({ topics, onSelect, onBack }) {
  if (!topics || topics.length === 0) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
        <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 22, color: C.navy, marginBottom: 10 }}>No topics yet</div>
        <p style={{ color: C.muted, fontWeight: 600 }}>Topics appear once an admin uploads the curriculum.</p>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 16px 100px' }}>
      <button onClick={onBack} style={backBtnStyle}>← Back</button>
      <div className="anim-fadeUp" style={{ marginBottom: 24, marginTop: 12 }}>
        <Pill color={accent.primary}>📚 By Topic</Pill>
        <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 30, color: C.navy, margin: '10px 0 4px' }}>Pick a Topic</h1>
        <p style={{ color: C.muted, fontWeight: 600 }}>Choose what you want to practise today</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {topics.map((t, idx) => (
          <div key={t.id} className="card anim-fadeUp" onClick={() => onSelect(t)} style={{
            padding: '18px 22px', cursor: 'pointer', animationDelay: `${idx * 0.06}s`,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14, flexShrink: 0,
              background: `linear-gradient(135deg,${accent.primary}33,${accent.secondary}22)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, border: `2px solid ${accent.primary}44`,
            }}>{t.icon || '📖'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 17, color: C.navy }}>{t.name}</div>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginTop: 2 }}>Tap to see subtopics</div>
            </div>
            <div style={{ fontSize: 20, color: C.border }}>›</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Subtopic picker
// ─────────────────────────────────────────────────────────────
function SubtopicPicker({ topic, onSelect, onBack }) {
  const { subtopics, status } = useSubtopics(topic?.id ?? null);
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 16px 100px' }}>
      <button onClick={onBack} style={backBtnStyle}>← Back to Topics</button>
      <div className="anim-fadeUp" style={{ marginBottom: 24, marginTop: 12 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{topic?.icon || '📖'}</div>
        <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 28, color: C.navy, marginBottom: 4 }}>{topic?.name}</h1>
        <p style={{ color: C.muted, fontWeight: 600 }}>Select a subtopic to practise</p>
      </div>
      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 16 }} />)}
        </div>
      )}
      {status === 'empty' && <div style={{ padding: '40px 0', textAlign: 'center', color: C.muted, fontWeight: 600 }}>No subtopics for this topic yet.</div>}
      {status === 'ready' && subtopics.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {subtopics.map((sub, idx) => (
            <div key={sub.id} className="card anim-fadeUp" onClick={() => onSelect(sub)} style={{
              padding: '18px 22px', cursor: 'pointer', animationDelay: `${idx * 0.06}s`,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 14, flexShrink: 0,
                background: `linear-gradient(135deg,${accent.primary}22,${accent.secondary}11)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, border: `2px solid ${accent.primary}33`,
              }}>🎯</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 16, color: C.navy }}>{sub.name}</div>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginTop: 2 }}>Tap to practise</div>
              </div>
              <div style={{ fontSize: 20, color: C.border }}>›</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Configure screen
// ─────────────────────────────────────────────────────────────
function ConfigureScreen({ mode, topic, subtopic, selectedTopics, allTopics, onBack, onStart }) {
  const [numQ,     setNumQ]     = useState(10);
  const [timeSecs, setTimeSecs] = useState(0);
  const isRandom = mode === 'random';

  const topicSummary = isRandom
    ? (selectedTopics.length === 0 ? 'All topics' : selectedTopics.map(id => allTopics.find(t => t.id === id)?.name).filter(Boolean).join(', '))
    : topic?.name;

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '28px 16px 100px' }}>
      <button onClick={onBack} style={backBtnStyle}>← Back</button>

      <div className="anim-fadeUp" style={{ marginBottom: 24, marginTop: 12 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>{isRandom ? '🎲' : (topic?.icon || '🎯')}</div>
        <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 28, color: C.navy, marginBottom: 4 }}>
          {isRandom ? 'Random Challenge' : subtopic?.name}
        </h1>
        <p style={{ color: C.muted, fontWeight: 600, fontSize: 13 }}>{topicSummary}</p>
      </div>

      <div className="card anim-fadeUp" style={{ padding: '20px 22px', marginBottom: 16, animationDelay: '0.05s' }}>
        <div style={{ fontWeight: 800, fontSize: 12, color: C.muted, letterSpacing: 0.6, marginBottom: 14, textTransform: 'uppercase' }}>
          Number of Questions
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Q_OPTIONS.map(n => (
            <button key={n} onClick={() => setNumQ(n)} style={{
              padding: '9px 18px', borderRadius: 50, cursor: 'pointer',
              fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 16,
              border: `2px solid ${numQ === n ? accent.primary : C.border}`,
              background: numQ === n ? accent.primary : '#F8F5F0',
              color: numQ === n ? '#fff' : C.navy, transition: 'all 0.15s',
            }}>{n}</button>
          ))}
        </div>
      </div>

      <div className="card anim-fadeUp" style={{ padding: '20px 22px', marginBottom: 28, animationDelay: '0.1s' }}>
        <div style={{ fontWeight: 800, fontSize: 12, color: C.muted, letterSpacing: 0.6, marginBottom: 14, textTransform: 'uppercase' }}>
          Time Limit <span style={{ fontWeight: 600, fontSize: 11, textTransform: 'none' }}>(optional)</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TIME_OPTIONS.map(t => (
            <button key={t.secs} onClick={() => setTimeSecs(t.secs)} style={{
              padding: '9px 16px', borderRadius: 50, cursor: 'pointer',
              fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 14,
              border: `2px solid ${timeSecs === t.secs ? C.rose : C.border}`,
              background: timeSecs === t.secs ? C.rose : '#F8F5F0',
              color: timeSecs === t.secs ? '#fff' : C.navy, transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <button className="anim-fadeUp" onClick={() => onStart({ numQuestions: numQ, timeLimitSecs: timeSecs, selectedTopicIds: selectedTopics })} style={{
        width: '100%', padding: '16px', borderRadius: 18, border: 'none',
        background: `linear-gradient(135deg,${accent.primary},${accent.secondary})`,
        color: '#fff', fontSize: 18, fontFamily: "'Baloo 2'", fontWeight: 900,
        cursor: 'pointer', boxShadow: `0 4px 20px ${accent.primary}44`, animationDelay: '0.15s',
      }}>
        ⚡ Start Challenge
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Badges
// ─────────────────────────────────────────────────────────────
function SourceBadge({ source }) {
  if (!source || source === 'Original' || source.toLowerCase() === 'ai') return null;
  const s = source.toUpperCase();
  let color = '#6B7280', bg = '#F3F4F6';
  if (s.includes('WAEC') || s.includes('WASSCE'))     { color = '#6C63FF'; bg = '#EEEEFF'; }
  else if (s.includes('NECO'))                         { color = '#0891B2'; bg = '#E0F2FE'; }
  else if (s.includes('JAMB') || s.includes('UTME'))  { color = '#D97706'; bg = '#FEF3C7'; }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 50,
      fontSize: 10, fontWeight: 800, letterSpacing: 0.6,
      background: bg, color, border: `1.5px solid ${color}33`,
    }}>{source}</span>
  );
}

const DIFF_STYLE = {
  easy:   { bg: `${C.mint}18`, border: `${C.mint}44`, text: C.mint   },
  medium: { bg: `${C.sun}18`,  border: `${C.sun}44`,  text: '#b37a00' },
  hard:   { bg: `${C.rose}15`, border: `${C.rose}44`, text: C.rose   },
};
function DiffBadge({ diff }) {
  if (!diff) return null;
  const d = DIFF_STYLE[diff] || DIFF_STYLE.medium;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 50,
      fontSize: 10, fontWeight: 800, letterSpacing: 0.4,
      background: d.bg, border: `1.5px solid ${d.border}`, color: d.text,
    }}>{diff.toUpperCase()}</span>
  );
}

// ─────────────────────────────────────────────────────────────
// Mid-quiz exit confirmation (leaving a challenge in progress)
// ─────────────────────────────────────────────────────────────
function ExitConfirmDialog({ onStay, onExit }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div className="card" style={{ maxWidth: 360, width: '100%', padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>⚡</div>
        <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 22, color: C.navy, marginBottom: 8 }}>
          Leave this challenge?
        </div>
        <p style={{ color: C.muted, fontWeight: 600, fontSize: 14, marginBottom: 6, lineHeight: 1.6 }}>
          Your answers won't be saved if you leave now.
        </p>
        <p style={{ color: accent.primary, fontWeight: 700, fontSize: 13, marginBottom: 22 }}>
          You're doing great — why not finish? 💪
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onStay} style={{
            flex: 1, padding: '13px', borderRadius: 14, border: 'none',
            background: `linear-gradient(135deg,${accent.primary},${accent.secondary})`,
            color: '#fff', fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 15, cursor: 'pointer',
          }}>Keep going!</button>
          <button onClick={onExit} style={{
            flex: 1, padding: '13px', borderRadius: 14,
            border: `2px solid ${C.border}`, background: 'transparent',
            color: C.muted, fontFamily: "'Baloo 2'", fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>Exit</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Quiz screen — the big one
// ─────────────────────────────────────────────────────────────
function QuizScreen({ topic, subtopic, mode, learningPathId, config, onBack, onBackToStart }) {
  const { numQuestions, timeLimitSecs, selectedTopicIds = [] } = config;
  const isTimed = timeLimitSecs > 0;

  // ── state ───────────────────────────────────────────────────
  const [questions,   setQuestions]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [current,     setCurrent]     = useState(0);
  // answers[i] = selected option index (or null)
  const [answers,     setAnswers]     = useState([]);
  const [phase,       setPhase]       = useState('quiz');   // 'quiz' | 'summary' | 'review'
  const [showHint,    setShowHint]    = useState(false);
  const [flagged,     setFlagged]     = useState({});
  const [flagging,    setFlagging]    = useState({});
  const [timeLeft,    setTimeLeft]    = useState(timeLimitSecs || 0);
  const [showExit,    setShowExit]    = useState(false);
  const [xpAwarded,   setXpAwarded]  = useState(false);
  const timerRef = useRef(null);
  const cardRef  = useRef(null);

  // ── load questions ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function load() {
      try {
        let allQs = [];
        if (mode === 'random') {
          let topicIds = selectedTopicIds.length > 0 ? selectedTopicIds : null;
          if (!topicIds) {
            const { data: rows } = await supabase.from('topics').select('id').eq('learning_path_id', learningPathId);
            topicIds = (rows || []).map(r => r.id);
          }
          if (topicIds.length) {
            const { data: subs } = await supabase.from('subtopics').select('id').in('topic_id', topicIds);
            const subIds = (subs || []).map(s => s.id);
            if (subIds.length) {
              const { data } = await supabase.from('practice_questions').select('*').in('subtopic_id', subIds).eq('category', 'extended');
              allQs = (data || []).map(q => ({ ...q, options: parseJsonField(q.options) }));
            }
          }
        } else {
          allQs = await content.getPracticeQuestions(subtopic?.id);
        }
        if (cancelled) return;
        const shuffled = [...allQs].sort(() => Math.random() - 0.5).slice(0, numQuestions);
        setQuestions(shuffled);
        setAnswers(new Array(shuffled.length).fill(null));
        setLoading(false);
        if (isTimed) setTimeLeft(timeLimitSecs);
      } catch (e) {
        console.error('[QuizScreen]', e);
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [mode, subtopic, learningPathId, numQuestions, isTimed, timeLimitSecs, selectedTopicIds]);

  // ── timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isTimed || phase !== 'quiz' || loading || questions.length === 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [isTimed, phase, loading, questions.length]);

  // ── scroll card to top on question change ───────────────────
  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [current]);

  // ── derived ─────────────────────────────────────────────────
  const q       = questions[current];
  const opts    = q ? (Array.isArray(q.options) ? q.options : []) : [];
  const myAns   = answers[current];
  const answered = answers.filter(a => a !== null).length;
  const score   = phase !== 'quiz' ? questions.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0) : 0;
  const xp      = score * XP_PER_CORRECT;
  const pct     = questions.length ? Math.round((score / questions.length) * 100) : 0;

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── actions ─────────────────────────────────────────────────
  const selectAnswer = (idx) => {
    setAnswers(prev => { const next = [...prev]; next[current] = idx; return next; });
    setShowHint(false);
  };

  const goTo = (idx) => { setCurrent(idx); setShowHint(false); };

  const handleSubmit = useCallback(() => {
    clearInterval(timerRef.current);
    setPhase('summary');
  }, []);

  const handleFlag = async (questionId) => {
    if (flagged[questionId] || flagging[questionId]) return;
    setFlagging(f => ({ ...f, [questionId]: true }));
    try { await content.flagQuestion(questionId); setFlagged(f => ({ ...f, [questionId]: true })); }
    catch (e) { console.error('[flag]', e); }
    setFlagging(f => ({ ...f, [questionId]: false }));
  };

  const restart = () => {
    setCurrent(0); setAnswers([]); setPhase('quiz');
    setShowHint(false); setFlagged({}); setXpAwarded(false);
    if (isTimed) setTimeLeft(timeLimitSecs);
  };

  // ── loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 16px' }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 18, marginBottom: 12 }} />)}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ maxWidth: 460, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>📭</div>
        <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 22, color: C.navy, marginBottom: 8 }}>No questions available yet</div>
        <p style={{ color: C.muted, fontWeight: 600 }}>Ask your admin to generate practice questions first.</p>
        <button onClick={onBack} style={{ ...backBtnStyle, marginTop: 20, fontSize: 16 }}>← Go Back</button>
      </div>
    );
  }

  // ── summary screen ──────────────────────────────────────────
  if (phase === 'summary') {
    const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '💪';
    const msg   = pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good job!' : 'Keep practising!';
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '40px 20px 100px' }}>

        {/* Score card */}
        <div className="card anim-fadeUp" style={{ padding: 32, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 60, marginBottom: 12 }}>{emoji}</div>
          <h2 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 28, color: C.navy, marginBottom: 6 }}>{msg}</h2>
          <p style={{ color: C.muted, fontWeight: 600, fontSize: 15, marginBottom: 20 }}>
            You got <strong style={{ color: C.navy }}>{score} of {questions.length}</strong> correct
            {isTimed && timeLeft === 0 && ' — time ran out'}
          </p>

          {/* Big score circle */}
          <div style={{
            width: 100, height: 100, borderRadius: '50%', margin: '0 auto 20px',
            background: pct >= 80 ? `${C.mint}18` : pct >= 60 ? `${C.sun}18` : `${C.rose}12`,
            border: `4px solid ${pct >= 80 ? C.mint : pct >= 60 ? C.sun : C.rose}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 28, color: C.navy, lineHeight: 1 }}>{pct}%</div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>score</div>
          </div>

          {/* XP badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 20px', borderRadius: 50,
            background: `${C.sun}18`, border: `2px solid ${C.sun}55`,
          }}>
            <span style={{ fontSize: 18 }}>⭐</span>
            <span style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 18, color: '#b37a00' }}>+{xp} XP</span>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>earned</span>
          </div>
        </div>

        {/* Quick breakdown */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Correct', val: score,                    color: C.mint },
            { label: 'Wrong',   val: questions.length - score, color: C.rose },
            { label: 'Skipped', val: answers.filter(a => a === null).length, color: C.muted },
          ].map(({ label, val, color }) => (
            <div key={label} className="card" style={{ flex: 1, padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 24, color }}>{val}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => setPhase('review')} style={{
            padding: '14px', borderRadius: 16, border: 'none',
            background: `linear-gradient(135deg,${accent.primary},${accent.secondary})`,
            color: '#fff', fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 16, cursor: 'pointer',
          }}>🔍 Review Answers</button>
          <button onClick={restart} style={{
            padding: '14px', borderRadius: 16,
            border: `2px solid ${C.border}`, background: 'transparent',
            color: C.navy, fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 15, cursor: 'pointer',
          }}>🔁 Try Again</button>
          <button onClick={onBack} style={{
            padding: '14px', borderRadius: 16, border: `2px solid ${C.border}`, background: 'transparent',
            color: C.muted, fontFamily: "'Baloo 2'", fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>⚙️ Change Settings</button>
          <button onClick={onBackToStart} style={{
            padding: '14px', borderRadius: 16, border: 'none', background: '#F5F2EC',
            color: C.muted, fontFamily: "'Baloo 2'", fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>← Practice Home</button>
        </div>
      </div>
    );
  }

  // ── review screen ───────────────────────────────────────────
  if (phase === 'review') {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 100px' }}>
        {/* Sticky top nav */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: '#FAFAF8', borderBottom: `1px solid ${C.border}`,
          padding: '12px 0 14px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <button onClick={() => setPhase('summary')} style={backBtnStyle}>← Summary</button>
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 15, color: C.navy }}>
              {score}/{questions.length} correct
            </span>
          </div>
          {/* Dot nav */}
          <ReviewDotNav questions={questions} answers={answers} current={current} onGo={goTo} />
        </div>

        {/* Question card */}
        <div ref={cardRef} className="card" style={{ padding: 24 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: `linear-gradient(135deg,${accent.primary},${accent.secondary})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: '#fff',
            }}>{current + 1}</div>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>of {questions.length}</span>
            <div style={{ flex: 1 }} />
            <SourceBadge source={q.source} />
            <DiffBadge diff={q.difficulty} />
          </div>

          <p style={{ fontWeight: 700, fontSize: 16, color: C.navy, lineHeight: 1.65, margin: '0 0 18px' }}>{q.question}</p>

          {/* Options — colour coded */}
          {opts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 16 }}>
              {opts.map((opt, oi) => {
                const isCorrect  = oi === q.answer;
                const myChoice   = answers[current] === oi;
                const isWrong    = myChoice && !isCorrect;
                return (
                  <div key={oi} style={{
                    padding: '12px 18px', borderRadius: 14,
                    fontSize: 15, fontWeight: 600,
                    background: isCorrect ? `${C.mint}18` : isWrong ? `${C.rose}12` : '#F8F5F0',
                    border: `2px solid ${isCorrect ? C.mint : isWrong ? C.rose : C.border}`,
                    color: isCorrect ? '#1a5c3a' : isWrong ? C.rose : C.navy,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 900,
                      background: isCorrect ? `${C.mint}33` : isWrong ? `${C.rose}22` : `${C.border}55`,
                      color: isCorrect ? C.mint : isWrong ? C.rose : C.muted,
                    }}>
                      {isCorrect ? '✓' : isWrong ? '✕' : String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                    {myChoice && !isCorrect && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: C.rose }}>Your answer</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Explanation */}
          {q.explanation && (
            <div style={{
              padding: '14px 18px', borderRadius: 16,
              background: `${C.sky}10`, border: `1.5px solid ${C.sky}33`, marginBottom: 12,
            }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: C.sky, letterSpacing: 0.5, marginBottom: 6 }}>💡 EXPLANATION</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, lineHeight: 1.7 }}>{q.explanation}</div>
            </div>
          )}

          {/* Flag */}
          <button onClick={() => handleFlag(q.id)} style={{
            padding: '8px 14px', borderRadius: 50,
            border: `2px solid ${flagged[q.id] ? C.rose + '55' : C.border}`,
            background: flagged[q.id] ? `${C.rose}10` : 'transparent',
            color: flagged[q.id] ? C.rose : C.muted,
            fontSize: 13, cursor: flagged[q.id] ? 'default' : 'pointer',
            fontWeight: 700, transition: 'all 0.2s',
          }}>
            {flagging[q.id] ? '⏳' : flagged[q.id] ? '🚩 Flagged' : '🚩 Flag wrong answer'}
          </button>
        </div>

        {/* Prev / Next */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            style={{
              flex: 1, padding: '13px', borderRadius: 16,
              border: `2px solid ${current === 0 ? C.border : accent.primary}`,
              background: 'transparent',
              color: current === 0 ? C.muted : accent.primary,
              fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 15,
              cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.4 : 1,
            }}
          >← Prev</button>
          <button
            onClick={() => current + 1 < questions.length ? goTo(current + 1) : setPhase('summary')}
            style={{
              flex: 1, padding: '13px', borderRadius: 16, border: 'none',
              background: `linear-gradient(135deg,${accent.primary},${accent.secondary})`,
              color: '#fff', fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 15, cursor: 'pointer',
            }}
          >{current + 1 < questions.length ? 'Next →' : '← Back to Summary'}</button>
        </div>
      </div>
    );
  }

  // ── active quiz ─────────────────────────────────────────────
  const allAnswered = answers.every(a => a !== null);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 100px' }}>

      {/* Exit confirm */}
      {showExit && (
        <ExitConfirmDialog
          onStay={() => setShowExit(false)}
          onExit={onBackToStart}
        />
      )}

      {/* ── Sticky top bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#FAFAF8', borderBottom: `1px solid ${C.border}`,
        padding: '10px 16px 12px',
      }}>
        {/* Row 1: Exit + timer + answered count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button onClick={() => setShowExit(true)} style={{
            ...backBtnStyle, display: 'flex', alignItems: 'center', gap: 5,
            color: C.muted,
          }}>✕ Exit</button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>
            {answered}/{questions.length} answered
          </span>
          {isTimed && (
            <span style={{
              fontSize: 14, fontWeight: 900, fontFamily: "'Baloo 2'",
              color: timeLeft < 30 ? C.rose : C.navy,
              background: timeLeft < 30 ? `${C.rose}15` : '#F0EDE8',
              padding: '4px 12px', borderRadius: 50,
              border: `2px solid ${timeLeft < 30 ? C.rose + '55' : C.border}`,
              transition: 'all 0.3s',
            }}>⏱ {fmtTime(timeLeft)}</span>
          )}
        </div>

        {/* Row 2: dot navigation */}
        <QuizDotNav
          count={questions.length}
          current={current}
          answers={answers}
          onGo={goTo}
        />

        {/* Row 3: progress bar */}
        <div style={{ background: '#E8E5E0', borderRadius: 50, height: 4, marginTop: 10, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 50,
            background: `linear-gradient(90deg,${accent.primary},${accent.secondary})`,
            width: `${((current + 1) / questions.length) * 100}%`,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* ── Question card ── */}
      <div ref={cardRef} style={{ padding: '16px 16px 0' }}>
        <div className="card" style={{ padding: 24 }}>

          {/* Q# + badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: `linear-gradient(135deg,${accent.primary},${accent.secondary})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: '#fff',
            }}>{current + 1}</div>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>of {questions.length}</span>
            <div style={{ flex: 1 }} />
            <SourceBadge source={q.source} />
            <DiffBadge diff={q.difficulty} />
          </div>

          {/* Question text */}
          <p style={{ fontWeight: 700, fontSize: 16, color: C.navy, lineHeight: 1.65, margin: '0 0 18px' }}>{q.question}</p>

          {/* Options */}
          {opts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 16 }}>
              {opts.map((opt, oi) => {
                const isSelected = myAns === oi;
                return (
                  <div key={oi} onClick={() => selectAnswer(oi)} style={{
                    padding: '12px 18px', borderRadius: 14,
                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    background: isSelected ? `${accent.primary}12` : '#F8F5F0',
                    border: `2px solid ${isSelected ? accent.primary : C.border}`,
                    color: C.navy,
                    display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'all 0.18s',
                    transform: isSelected ? 'translateX(4px)' : 'none',
                  }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 900,
                      background: isSelected ? `${accent.primary}22` : `${C.border}55`,
                      color: isSelected ? accent.primary : C.muted,
                    }}>
                      {isSelected ? '✓' : String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </div>
                );
              })}
            </div>
          )}

          {/* Hint */}
          {q.explanation && (
            <div style={{ marginBottom: 12 }}>
              <button onClick={() => setShowHint(h => !h)} style={{
                padding: '7px 16px', borderRadius: 50,
                border: `2px solid ${showHint ? C.sun + '88' : C.border}`,
                background: showHint ? `${C.sun}18` : 'transparent',
                color: showHint ? '#b37a00' : C.muted,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              }}>
                💡 {showHint ? 'Hide hint' : 'Show hint'}
              </button>
              {showHint && (
                <div className="anim-fadeUp" style={{
                  marginTop: 10, padding: '12px 16px', borderRadius: 14,
                  background: `${C.sun}10`, border: `1.5px solid ${C.sun}44`,
                  fontSize: 13, fontWeight: 600, color: C.navy, lineHeight: 1.7,
                }}>
                  {/* Show only first sentence of explanation as hint */}
                  {q.explanation.split('.')[0] + '.'}
                </div>
              )}
            </div>
          )}

          {/* Flag */}
          <button onClick={() => handleFlag(q.id)} style={{
            padding: '7px 14px', borderRadius: 50,
            border: `2px solid ${flagged[q.id] ? C.rose + '55' : C.border}`,
            background: flagged[q.id] ? `${C.rose}10` : 'transparent',
            color: flagged[q.id] ? C.rose : C.muted,
            fontSize: 12, cursor: flagged[q.id] ? 'default' : 'pointer',
            fontWeight: 700, transition: 'all 0.2s',
          }}>
            {flagging[q.id] ? '⏳' : flagged[q.id] ? '🚩 Flagged' : '🚩 Flag'}
          </button>
        </div>

        {/* ── Prev / Next / Submit ── */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            style={{
              padding: '13px 20px', borderRadius: 16,
              border: `2px solid ${current === 0 ? C.border : accent.primary}`,
              background: 'transparent',
              color: current === 0 ? C.muted : accent.primary,
              fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 15,
              cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.4 : 1,
              flexShrink: 0,
            }}
          >← Prev</button>

          {current + 1 < questions.length ? (
            <button onClick={() => goTo(current + 1)} style={{
              flex: 1, padding: '13px', borderRadius: 16, border: 'none',
              background: `linear-gradient(135deg,${accent.primary},${accent.secondary})`,
              color: '#fff', fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 15, cursor: 'pointer',
            }}>Next →</button>
          ) : (
            <button
              onClick={handleSubmit}
              style={{
                flex: 1, padding: '13px', borderRadius: 16, border: 'none',
                background: allAnswered
                  ? `linear-gradient(135deg,${C.mint},#2ecc71)`
                  : `linear-gradient(135deg,${accent.primary},${accent.secondary})`,
                color: '#fff', fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 15, cursor: 'pointer',
                boxShadow: allAnswered ? `0 4px 16px ${C.mint}55` : 'none',
                transition: 'all 0.3s',
              }}
            >
              {allAnswered ? '🏁 Submit Answers' : `Submit (${answered}/${questions.length} answered)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dot navigation — quiz mode (shows answered status)
// ─────────────────────────────────────────────────────────────
function QuizDotNav({ count, current, answers, onGo }) {
  // Show max 20 dots before switching to numbers
  const showNumbers = count > 20;
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
      {Array.from({ length: count }).map((_, i) => {
        const isCurrent  = i === current;
        const isAnswered = answers[i] !== null;
        return (
          <div
            key={i}
            onClick={() => onGo(i)}
            title={`Question ${i + 1}`}
            style={{
              width: showNumbers ? 28 : 10,
              height: showNumbers ? 28 : 10,
              borderRadius: showNumbers ? 8 : '50%',
              cursor: 'pointer', flexShrink: 0,
              background: isCurrent
                ? accent.primary
                : isAnswered
                  ? `${accent.primary}55`
                  : '#E0DDD8',
              border: isCurrent ? `2px solid ${accent.primary}` : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800,
              color: isCurrent ? '#fff' : isAnswered ? accent.primary : C.muted,
              transition: 'all 0.15s',
            }}
          >
            {showNumbers ? i + 1 : ''}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dot navigation — review mode (shows correct/wrong status)
// ─────────────────────────────────────────────────────────────
function ReviewDotNav({ questions, answers, current, onGo }) {
  const showNumbers = questions.length > 20;
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
      {questions.map((q, i) => {
        const isCurrent = i === current;
        const skipped   = answers[i] === null;
        const correct   = !skipped && answers[i] === q.answer;
        const wrong     = !skipped && answers[i] !== q.answer;
        const bg = isCurrent ? accent.primary : skipped ? '#E0DDD8' : correct ? C.mint : C.rose;
        return (
          <div
            key={i}
            onClick={() => onGo(i)}
            title={`Q${i+1}: ${skipped ? 'skipped' : correct ? 'correct' : 'wrong'}`}
            style={{
              width: showNumbers ? 28 : 10, height: showNumbers ? 28 : 10,
              borderRadius: showNumbers ? 8 : '50%', cursor: 'pointer', flexShrink: 0,
              background: bg,
              border: isCurrent ? `2px solid ${accent.primary}` : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#fff',
              transition: 'all 0.15s',
            }}
          >
            {showNumbers ? i + 1 : ''}
          </div>
        );
      })}
      {/* Legend */}
      <div style={{ marginLeft: 8, display: 'flex', gap: 10, fontSize: 11, fontWeight: 700, color: C.muted }}>
        <span><span style={{ color: C.mint }}>●</span> Correct</span>
        <span><span style={{ color: C.rose }}>●</span> Wrong</span>
        <span><span style={{ color: '#E0DDD8' }}>●</span> Skipped</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function parseJsonField(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

const backBtnStyle = {
  background: 'transparent', border: 'none',
  color: C.muted, fontSize: 14, fontWeight: 700,
  cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit',
};