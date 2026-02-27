// src/components/states/ContentStates.jsx
// ============================================================
// Reusable UI states for every data-loading scenario.
// Import whichever you need — they're all here.
// ============================================================

import { C } from '../../constants/colors';
import Btn from '../ui/Btn';

// ── Skeleton card ─────────────────────────────────────────────
function SkeletonCard({ height = 80 }) {
  return <div className="skeleton" style={{ height, borderRadius: 18, marginBottom: 12 }} />;
}

// ── LOADING: generic topics/subtopics list skeleton ───────────
export function ListSkeleton({ count = 4, height = 80 }) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 16px" }}>
      <div className="skeleton" style={{ height: 32, width: "60%", borderRadius: 10, marginBottom: 24 }} />
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={height} />
      ))}
    </div>
  );
}

// ── LOADING: lesson skeleton ──────────────────────────────────
export function LessonSkeleton() {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 16px 120px" }}>
      <div className="skeleton" style={{ height: 28, width: 80, borderRadius: 8, marginBottom: 20 }} />
      <div className="skeleton" style={{ height: 48, width: "70%", borderRadius: 12, marginBottom: 28 }} />
      <div className="skeleton" style={{ height: 140, borderRadius: 20, marginBottom: 20 }} />
      <div className="skeleton" style={{ height: 220, borderRadius: 20, marginBottom: 20 }} />
      <div className="skeleton" style={{ height: 280, borderRadius: 20, marginBottom: 20 }} />
    </div>
  );
}

// ── GENERATING: AI is working on content ─────────────────────
export function GeneratingState({ type = "topics", name = "" }) {
  const messages = {
    topics:    { emoji: "🤖", title: "Building your topic list…", sub: "AI is reading the curriculum. This only happens once." },
    subtopics: { emoji: "🧠", title: "Generating subtopics…",     sub: "AI is breaking this topic into lessons. Just a moment." },
    lesson:    { emoji: "✨", title: "Preparing your lesson…",     sub: "AI is writing your personalised lesson. This may take 5–10 seconds." },
  };
  const m = messages[type] || messages.topics;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
      {/* Pulsing robot */}
      <div style={{ fontSize: 72, marginBottom: 20, animation: "pulse 1.5s ease-in-out infinite" }}>
        {m.emoji}
      </div>

      <h2 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 26, color: C.navy, marginBottom: 10 }}>
        {m.title}
      </h2>

      <p style={{ color: C.muted, fontWeight: 600, fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
        {m.sub}
        {name && <><br /><strong style={{ color: C.fire }}>{name}</strong></>}
      </p>

      {/* Animated progress dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: "50%",
            background: C.fire,
            animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── NO CURRICULUM: admin hasn't uploaded content yet ─────────
export function NoCurriculumState({ grade, mode, isAdmin = false, onAdminUpload }) {
  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>📭</div>

      <h2 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 26, color: C.navy, marginBottom: 10 }}>
        No lessons yet for {grade}
      </h2>

      <p style={{ color: C.muted, fontWeight: 600, fontSize: 15, lineHeight: 1.75, marginBottom: 28 }}>
        {isAdmin
          ? "You haven't uploaded a curriculum for this class yet. Upload one to start generating lessons automatically."
          : "Lessons for this class haven't been set up yet. Please ask your teacher or admin to upload the curriculum."}
      </p>

      {isAdmin && onAdminUpload && (
        <Btn onClick={onAdminUpload} size="lg" style={{ width: "100%", maxWidth: 300 }}>
          📤 Upload Curriculum
        </Btn>
      )}

      {!isAdmin && (
        <div style={{
          background: `${C.sky}12`, border: `2px solid ${C.sky}33`,
          borderRadius: 18, padding: "16px 20px",
          fontSize: 14, fontWeight: 700, color: C.sky,
        }}>
          💡 Tip: Other subjects or classes may already have lessons available.
        </div>
      )}
    </div>
  );
}

// ── ERROR STATE ───────────────────────────────────────────────
export function ErrorState({ message, onRetry }) {
  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 22, color: C.navy, marginBottom: 10 }}>
        Something went wrong
      </h2>
      <p style={{ color: C.muted, fontWeight: 600, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
        {message || "We couldn't load this content. Check your connection and try again."}
      </p>
      {onRetry && (
        <Btn onClick={onRetry} outline color={C.muted}>🔄 Try Again</Btn>
      )}
    </div>
  );
}

// ── EMPTY STATE (generic) ─────────────────────────────────────
export function EmptyState({ emoji = "📭", title, message }) {
  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 56, marginBottom: 14 }}>{emoji}</div>
      <h2 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 22, color: C.navy, marginBottom: 8 }}>{title}</h2>
      {message && <p style={{ color: C.muted, fontWeight: 600, fontSize: 14, lineHeight: 1.7 }}>{message}</p>}
    </div>
  );
}
