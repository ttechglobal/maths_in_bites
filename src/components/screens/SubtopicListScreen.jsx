// src/components/screens/SubtopicListScreen.jsx
// ============================================================
// Shows AI-generated bite-sized subtopics for a topic.
//
// Flow:
//   1. User picks a topic
//   2. We fetch AI subtopics (or trigger generation if none exist)
//   3. Each subtopic = one focused lesson + practice questions
//
// The "Generating" state is shown while AI breaks the topic down
// into granular, progressive learning steps.
// ============================================================

import { C } from '../../constants/colors';
import { useSubtopics } from '../../hooks/useContent';

export default function SubtopicListScreen({ topic, grade, completedIds = [], onBack, onSelect }) {
  const { subtopics, status, error } = useSubtopics(
    topic?.id ?? null,
    grade ?? null,
    topic?.name ?? null
  );

  // ── Generating state ──────────────────────────────────────────
  if (status === 'generating' || status === 'loading') {
    return <GeneratingSubtopics topicName={topic?.name} icon={topic?.icon} />;
  }

  if (status === 'error') {
    return <ErrorState message={error} onBack={onBack} />;
  }

  const doneCount = subtopics.filter(s => completedIds.includes(s.id)).length;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 120px' }}>

      {/* Back */}
      <button onClick={onBack} style={backBtnStyle}>
        ← Back to Topics
      </button>

      {/* Header */}
      <div className="anim-fadeUp" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 56, marginBottom: 10 }}>{topic?.icon || '📖'}</div>
        <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 30, color: C.navy, marginBottom: 6, lineHeight: 1.15 }}>
          {topic?.name}
        </h1>
        <p style={{ color: C.muted, fontWeight: 600, fontSize: 14 }}>
          {subtopics.length} lesson{subtopics.length !== 1 ? 's' : ''} · <span style={{ color: doneCount > 0 ? '#2a9d78' : C.muted, fontWeight: doneCount > 0 ? 800 : 600 }}>{doneCount} completed</span>
        </p>

        {/* Progress bar */}
        {subtopics.length > 0 && (
          <div style={{ marginTop: 12, height: 6, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.round(doneCount / subtopics.length * 100)}%`,
              background: `linear-gradient(90deg, ${C.mint}, ${C.sky})`,
              borderRadius: 99,
              transition: 'width 0.5s ease',
            }} />
          </div>
        )}
      </div>

      {/* Learning path — the "staircase" layout */}
      {subtopics.length === 0 ? (
        <EmptySubtopics />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {subtopics.map((sub, idx) => {
            const isDone  = completedIds.includes(sub.id);
            // A subtopic is "unlocked" if it's the first, or the previous one is done
            const prevDone = idx === 0 || completedIds.includes(subtopics[idx - 1]?.id);
            const isNext   = !isDone && prevDone; // the current recommended one

            return (
              <SubtopicCard
                key={sub.id}
                subtopic={sub}
                index={idx}
                isDone={isDone}
                isNext={isNext}
                isLocked={false} // Keep unlocked for now — lock can be a feature flag
                onClick={() => onSelect(sub)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── SubtopicCard ──────────────────────────────────────────────
function SubtopicCard({ subtopic, index, isDone, isNext, isLocked, onClick }) {
  const accent = isDone ? C.mint : isNext ? C.fire : C.purple;

  return (
    <div
      className="card anim-fadeUp"
      onClick={isLocked ? undefined : onClick}
      style={{
        padding: '16px 20px',
        cursor: isLocked ? 'default' : 'pointer',
        animationDelay: `${index * 0.05}s`,
        border: `2px solid ${isDone ? C.mint + '44' : isNext ? C.fire + '44' : C.border}`,
        background: isDone ? `${C.mint}06` : isNext ? `${C.fire}06` : '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        opacity: isLocked ? 0.5 : 1,
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Step number / status icon */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        flexShrink: 0,
        background: isDone
          ? `linear-gradient(135deg, ${C.mint}, #00897B)`
          : isNext
          ? `linear-gradient(135deg, ${C.fire}, ${C.sun})`
          : `${C.border}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isDone ? 20 : 16,
        fontWeight: 900,
        color: isDone || isNext ? '#fff' : C.muted,
        boxShadow: isNext ? `0 4px 12px ${C.fire}44` : 'none',
      }}>
        {isDone ? '✓' : isLocked ? '🔒' : index + 1}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Baloo 2'",
          fontWeight: 800,
          fontSize: 16,
          color: isDone ? '#1a5c3a' : C.navy,
          marginBottom: 2,
          lineHeight: 1.3,
        }}>
          {subtopic.name}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>
          {isDone ? '✅ Completed' : isNext ? '▶ Start here' : 'Tap to learn'}
        </div>
      </div>

      {/* Arrow */}
      {!isLocked && (
        <div style={{ fontSize: 18, color: isDone ? C.mint : isNext ? C.fire : C.border, fontWeight: 900 }}>
          {isDone ? '↩' : '›'}
        </div>
      )}
    </div>
  );
}

// ── Generating state ──────────────────────────────────────────
function GeneratingSubtopics({ topicName, icon }) {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 20, animation: 'pulse 1.5s ease-in-out infinite' }}>
        🧠
      </div>
      <h2 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 26, color: C.navy, marginBottom: 12 }}>
        Building your learning path…
      </h2>
      <p style={{ color: C.muted, fontWeight: 600, fontSize: 15, lineHeight: 1.75, marginBottom: 8 }}>
        AI is breaking <strong style={{ color: C.fire }}>{topicName || 'this topic'}</strong> into
        bite-sized lessons tailored for you.
      </p>
      <p style={{ color: C.muted, fontWeight: 600, fontSize: 13, marginBottom: 36 }}>
        This only happens once — takes about 10 seconds.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%',
            background: [C.fire, C.sun, C.mint, C.sky][i],
            animation: `bounce 1.2s ${i * 0.15}s ease-in-out infinite`,
          }} />
        ))}
      </div>
      {/* Preview cards — show skeleton of what's coming */}
      <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton" style={{ height: 72, borderRadius: 18, opacity: 0.4 + i * 0.1 }} />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onBack }) {
  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 22, color: C.navy, marginBottom: 10 }}>
        Couldn't load subtopics
      </h2>
      <p style={{ color: C.muted, fontWeight: 600, fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>
        {message || 'Something went wrong. Check your connection and try again.'}
      </p>
      <button onClick={onBack} style={{ ...backBtnStyle, display: 'inline-block' }}>← Go Back</button>
    </div>
  );
}

function EmptySubtopics() {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center', color: C.muted }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
      <div style={{ fontWeight: 700 }}>No subtopics available yet</div>
    </div>
  );
}

const backBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: C.muted,
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  marginBottom: 20,
  padding: '4px 0',
  fontFamily: 'inherit',
};