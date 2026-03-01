// src/components/screens/TopicListScreen.jsx  (v2)
// ============================================================
// Handles: loading | no_curriculum | generating | ready | error
// Mobile-first grid layout.
// ============================================================

import { C } from '../../constants/colors';
import { PAGE_ACCENTS } from '../../constants/accents';
import Pill from '../ui/Pill';
import ProgressBar from '../ui/ProgressBar';
import { ListSkeleton, GeneratingState, NoCurriculumState, ErrorState } from '../states/ContentStates';

export default function TopicListScreen({
  grade,
  mode,
  topics = [],
  status = 'ready',
  error,
  completedIds = [],
  onSelectTopic,
}) {
  const accent = PAGE_ACCENTS.learn;
  // Topics from DB don't include subtopics array; show '?' for counts until subtopics load
  const total  = topics.reduce((a, t) => a + (t.subtopic_count ?? t.subtopics?.length ?? 0), 0);
  const done   = completedIds.length;

  // ── State gates ──────────────────────────────────────────────
  if (status === 'loading')       return <ListSkeleton count={5} />;
  if (status === 'generating')    return <GeneratingState type="topics" name={grade} />;
  if (status === 'no_curriculum') return <NoCurriculumState grade={grade} mode={mode} />;
  if (status === 'error')         return <ErrorState message={error} />;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 16px 100px" }}>

      {/* Header */}
      <div className="anim-fadeUp" style={{ marginBottom: 24 }}>
        <Pill color={accent.primary}>{mode === 'exam' ? '📋 Exam' : '🏫 School'} · {grade}</Pill>
        <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 34, color: C.navy, margin: "10px 0 4px" }}>
          Mathematics Topics
        </h1>
        {total > 0 && (
          <>
            <p style={{ color: C.muted, fontWeight: 600 }}>{done} of {total} subtopics completed</p>
            <div style={{ marginTop: 12 }}>
              <ProgressBar pct={Math.round(done / total * 100) || 0} color={accent.primary} />
            </div>
          </>
        )}
      </div>

      {/* Topic grid — 1 col mobile, 2 col tablet+ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 14,
      }}>
        {topics.map((topic, idx) => {
          const topicSubtopicIds = (topic.subtopics || []).map(s => s.id);
          const topicDone = topicSubtopicIds.filter(id => completedIds.includes(id)).length;
          const topicTotal = topic.subtopic_count ?? topicSubtopicIds.length;
          const topicPct = topicTotal > 0 ? Math.round(topicDone / topicTotal * 100) : 0;

          return (
            <div
              key={topic.id}
              className="card anim-fadeUp"
              style={{ padding: 20, cursor: "pointer", animationDelay: `${idx * 0.06}s` }}
              onClick={() => onSelectTopic(topic)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 16, flexShrink: 0,
                  background: `linear-gradient(135deg,${C.sun}33,${C.fire}22)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, border: `2px solid ${C.sun}44`,
                }}>{topic.icon || "📖"}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 17, color: C.navy, marginBottom: 3 }}>
                    {topic.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 8 }}>
                    {topicDone}/{topicTotal || '?'} subtopics done
                  </div>
                  <ProgressBar
                    pct={topicPct}
                    color={topicPct === 100 ? C.mint : C.fire}
                    height={6}
                  />
                </div>

                <div style={{ fontSize: 20, color: C.border, flexShrink: 0 }}>›</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
