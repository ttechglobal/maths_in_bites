// src/components/screens/HomeScreen.jsx  (v2)
// ============================================================
// Mobile-first: stats stack 1-col on mobile, 2-col on tablet+
// ============================================================

import { C } from '../../constants/colors';
import { PAGE_ACCENTS } from '../../constants/accents';
import Btn from '../ui/Btn';
import ProgressBar from '../ui/ProgressBar';
import { ListSkeleton } from '../states/ContentStates';

const GRADE_LABELS = {
  JS1: 'JSS 1', JS2: 'JSS 2', JS3: 'JSS 3',
  JSS1: 'JSS 1', JSS2: 'JSS 2', JSS3: 'JSS 3',
  SS1: 'SS 1', SS2: 'SS 2', SS3: 'SS 3',
};

export default function HomeScreen({
  user,
  grade,
  mode,
  topics = [],
  topicsLoading = false,
  completedIds = [],
  onGoLearn,
  onGoPractice,
  onSelectTopic,
}) {
  const accent     = PAGE_ACCENTS.home;
  const safeTopics = topics ?? [];
  // subtopic_count comes from getTopics which selects subtopics(id)
  const total   = safeTopics.reduce((a, t) => a + (t.subtopic_count || t.subtopics?.length || 0), 0);
  const done    = completedIds.length;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

  const STATS = [
    { label: "XP Earned",  value: user?.xp || 0,                                    icon: "⭐", color: C.sun  },
    { label: "Day Streak", value: `${user?.streak || 1} 🔥`,                        icon: "🔥", color: C.fire },
    { label: "Lessons",    value: done,                                              icon: "📖", color: accent.primary },
    { label: "Level",      value: `Lvl ${Math.floor((user?.xp || 0) / 200) + 1}`,  icon: "🏅", color: C.mint },
  ];

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 16px 100px" }}>

      {/* Welcome hero */}
      <div className="anim-fadeUp" style={{ marginBottom: 20 }}>
        <div style={{
          background: `linear-gradient(135deg,${accent.primary}22,${accent.secondary}11)`,
          border: `2px solid ${accent.primary}33`,
          borderRadius: 24, padding: "22px 22px 18px",
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: accent.primary, marginBottom: 4, letterSpacing: 0.5 }}>
            {mode === 'exam' ? '📋 EXAM MODE' : '🏫 SCHOOL MODE'} · {GRADE_LABELS[grade] || grade}
          </p>
          <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 26, color: C.navy, marginBottom: 4, lineHeight: 1.2 }}>
            Welcome back,<br />{user?.name || 'Champ'}! 👋
          </h1>
          <p style={{ color: C.muted, fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
            {pct === 0
              ? "Ready to start your maths journey?"
              : `You're ${pct}% through your curriculum. Keep it up!`}
          </p>
          <ProgressBar pct={pct} color={accent.primary} height={8} />
          <p style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginTop: 6 }}>
            {done} / {total || '…'} subtopics completed
          </p>
        </div>
      </div>

      {/* Stats — 1 col on mobile, 2 col on larger screens */}
      <div className="anim-fadeUp" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
        gap: 12,
        marginBottom: 20,
        animationDelay: "0.05s",
      }}>
        {STATS.map(({ label, value, icon, color }) => (
          <div key={label} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 22 }}>{icon}</div>
            <div>
              <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 18, color }}>{value}</div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Topics loading */}
      {topicsLoading && (
        <div style={{ marginBottom: 20 }}>
          <ListSkeleton count={3} height={60} />
        </div>
      )}

      {/* Recent topics (first 3) */}
      {!topicsLoading && safeTopics.length > 0 && (
        <div className="anim-fadeUp" style={{ marginBottom: 20, animationDelay: "0.08s" }}>
          <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 16, color: C.navy, marginBottom: 12 }}>
            Continue Learning
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 10,
          }}>
            {safeTopics.slice(0, 3).map(topic => (
              <div key={topic.id} className="card" style={{ padding: "14px 16px", cursor: "pointer" }}
                onClick={() => onSelectTopic(topic)}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{topic.icon || "📖"}</div>
                <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 14, color: C.navy, lineHeight: 1.3 }}>
                  {topic.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA buttons */}
      <div className="anim-fadeUp" style={{ display: "flex", gap: 12, animationDelay: "0.11s" }}>
        <Btn
          onClick={onGoLearn}
          size="lg"
          color={PAGE_ACCENTS.learn.primary}
          style={{ flex: 1, boxShadow: `0 5px 0 ${PAGE_ACCENTS.learn.primary}55` }}
        >
          📚 Go to Learn
        </Btn>
        <Btn
          onClick={onGoPractice}
          size="lg"
          color={PAGE_ACCENTS.practice.primary}
          style={{ flex: 1, boxShadow: `0 5px 0 ${PAGE_ACCENTS.practice.primary}55` }}
        >
          🎯 Practice
        </Btn>
      </div>
    </div>
  );
}