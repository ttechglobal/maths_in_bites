// src/components/screens/SchoolModeScreen.jsx
// ============================================================
// School Mode UI — replaces TopicListScreen / SubtopicListScreen
// when mode === 'school'.
//
// FEATURES:
//   • Automatic term detection from device date
//   • Manual term switcher
//   • Topic-node path (not subtopic-by-subtopic)
//   • Clicking a topic → slides in subtopic list
//   • Slide-left / slide-right transitions
//   • Scroll position memory for term path
//   • 'Coming Soon' badge for subtopics without lessons
//   • Mobile-first spacing + font sizes
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { C } from '../../constants/colors';
import ProgressBar from '../ui/ProgressBar';

// ── Term detection ────────────────────────────────────────────
const TERMS = ['first_term', 'second_term', 'third_term'];

const TERM_META = {
  first_term:  { label: '1st Term',  emoji: '🍂', months: [8, 9, 10, 11],   color: '#FF6B35' },
  second_term: { label: '2nd Term',  emoji: '❄️',  months: [0, 1, 2],        color: '#4A90D9' },
  third_term:  { label: '3rd Term',  emoji: '🌸',  months: [3, 4, 5, 6],     color: '#43CFAC' },
};

function getCurrentTerm() {
  const month = new Date().getMonth(); // 0-indexed
  for (const [key, meta] of Object.entries(TERM_META)) {
    if (meta.months.includes(month)) return key;
  }
  return 'first_term';
}

// ── Topic icons fallback palette ──────────────────────────────
const TOPIC_ICONS = ['📐', '🔢', '📊', '🔣', '➗', '✖️', '📉', '📈', '🧮', '🎲'];

function topicIcon(topic, idx) {
  return topic.icon || TOPIC_ICONS[idx % TOPIC_ICONS.length];
}

// ── Slide transition wrapper ──────────────────────────────────
function SlidePane({ visible, direction, children }) {
  const translateStart = direction === 'forward' ? '100%' : '-100%';
  const style = {
    position: 'absolute',
    inset: 0,
    overflowY: 'auto',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: visible ? 'translateX(0)' : `translateX(${translateStart})`,
    willChange: 'transform',
  };
  return <div style={style}>{children}</div>;
}

// ── Main component ────────────────────────────────────────────
export default function SchoolModeScreen({
  grade,
  learningPathId,
  completedIds = [],
  onSelectSubtopic,
}) {
  const [currentTerm,    setCurrentTerm]    = useState(getCurrentTerm);
  const [topics,         setTopics]         = useState({});          // { term: [topic] }
  const [loading,        setLoading]        = useState(true);
  const [selectedTopic,  setSelectedTopic]  = useState(null);        // null = show term path
  const [subtopics,      setSubtopics]      = useState([]);
  const [subtopicLoading,setSubtopicLoading]= useState(false);
  const [lessonMap,      setLessonMap]      = useState({});          // subtopicId → hasLesson

  // Scroll memory per term
  const scrollPositions = useRef({});
  const pathRef = useRef(null);

  // ── Load topics grouped by term ──────────────────────────────
  const loadTopics = useCallback(async () => {
    if (!learningPathId) return;
    setLoading(true);
    const { data } = await supabase
      .from('topics')
      .select('id, name, icon, sort_order, term')
      .eq('learning_path_id', learningPathId)
      .eq('is_active', true)
      .order('sort_order');

    const grouped = { first_term: [], second_term: [], third_term: [] };
    for (const t of data || []) {
      const term = t.term || 'first_term';
      if (grouped[term]) grouped[term].push(t);
    }
    setTopics(grouped);
    setLoading(false);
  }, [learningPathId]);

  useEffect(() => { loadTopics(); }, [loadTopics]);

  // ── Load subtopics + lesson presence when topic selected ─────
  useEffect(() => {
    if (!selectedTopic) return;
    setSubtopicLoading(true);
    setSubtopics([]);
    setLessonMap({});

    supabase.from('subtopics')
      .select('id, name, sort_order')
      .eq('topic_id', selectedTopic.id)
      .order('sort_order')
      .then(async ({ data: subs }) => {
        const subList = subs || [];
        setSubtopics(subList);

        const ids = subList.map(s => s.id);
        if (ids.length) {
          const { data: lessons } = await supabase
            .from('lessons')
            .select('subtopic_id')
            .in('subtopic_id', ids);
          const map = {};
          for (const l of lessons || []) map[l.subtopic_id] = true;
          setLessonMap(map);
        }
        setSubtopicLoading(false);
      });
  }, [selectedTopic]);

  // ── Save scroll when navigating into a topic ─────────────────
  const handleSelectTopic = (topic) => {
    if (pathRef.current) {
      scrollPositions.current[currentTerm] = pathRef.current.scrollTop;
    }
    setSelectedTopic(topic);
  };

  // ── Restore scroll when going back ───────────────────────────
  const handleBack = () => {
    setSelectedTopic(null);
    // Restore scroll position after paint
    requestAnimationFrame(() => {
      if (pathRef.current && scrollPositions.current[currentTerm] != null) {
        pathRef.current.scrollTop = scrollPositions.current[currentTerm];
      }
    });
  };

  // ── Term switch ───────────────────────────────────────────────
  const handleTermSwitch = (term) => {
    if (selectedTopic) setSelectedTopic(null);
    setCurrentTerm(term);
  };

  const termTopics = topics[currentTerm] || [];
  const termDone   = termTopics.reduce((acc, t) => {
    const tSubIds = completedIds;
    return acc;
  }, 0);

  // Per-topic completion
  const getTopicCompletion = (topicSubtopicIds) => {
    const done = topicSubtopicIds.filter(id => completedIds.includes(id)).length;
    return { done, total: topicSubtopicIds.length };
  };

  const inTopic = !!selectedTopic;
  const currentMeta = TERM_META[currentTerm];

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: 'calc(100vh - 60px)' }}>

      {/* ── Term path view ──────────────────────────────────────── */}
      <div
        ref={pathRef}
        style={{
          position: 'absolute', inset: 0, overflowY: 'auto',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          transform: inTopic ? 'translateX(-100%)' : 'translateX(0)',
          willChange: 'transform',
          paddingBottom: 120,
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{
              display: 'inline-block',
              fontSize: 11, fontWeight: 800, letterSpacing: 1.2,
              color: currentMeta.color, textTransform: 'uppercase',
            }}>
              {grade} · School Mode
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 26, color: C.navy,
            margin: '0 0 16px', lineHeight: 1.2,
          }}>
            {currentMeta.emoji} {currentMeta.label}
          </h1>

          {/* Term tabs */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 20,
            overflowX: 'auto', paddingBottom: 4,
          }}>
            {TERMS.map(t => {
              const meta = TERM_META[t];
              const active = currentTerm === t;
              return (
                <button
                  key={t}
                  onClick={() => handleTermSwitch(t)}
                  style={{
                    flexShrink: 0,
                    padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    fontWeight: 800, fontSize: 13,
                    background: active ? meta.color : '#F0EDE8',
                    color: active ? '#fff' : C.muted,
                    boxShadow: active ? `0 3px 10px ${meta.color}55` : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {meta.emoji} {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Topic nodes */}
        {loading ? (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton" style={{ height: 76, borderRadius: 20 }} />
            ))}
          </div>
        ) : termTopics.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 18, color: C.navy, marginBottom: 6 }}>
              No topics yet
            </div>
            <div style={{ fontSize: 14, color: C.muted, fontWeight: 600 }}>
              Your teacher hasn't uploaded the {currentMeta.label} curriculum yet.
            </div>
          </div>
        ) : (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {termTopics.map((topic, idx) => (
              <TopicNode
                key={topic.id}
                topic={topic}
                idx={idx}
                completedIds={completedIds}
                accentColor={currentMeta.color}
                onClick={() => handleSelectTopic(topic)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Subtopic list view ──────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, overflowY: 'auto',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        transform: inTopic ? 'translateX(0)' : 'translateX(100%)',
        willChange: 'transform',
        paddingBottom: 120,
        background: C.bg,
      }}>
        {selectedTopic && (
          <>
            {/* Back header */}
            <div style={{
              padding: '14px 16px 0',
              position: 'sticky', top: 0, zIndex: 10,
              background: C.bg,
              borderBottom: `1px solid ${C.border}`,
              paddingBottom: 12,
            }}>
              <button
                onClick={handleBack}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: currentMeta.color, fontWeight: 800, fontSize: 14,
                  padding: 0, marginBottom: 10,
                }}
              >
                ‹ Back to {currentMeta.label}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: `${currentMeta.color}22`,
                  border: `2px solid ${currentMeta.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>
                  {topicIcon(selectedTopic, 0)}
                </div>
                <div>
                  <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 20, color: C.navy, lineHeight: 1.2 }}>
                    {selectedTopic.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
                    {currentMeta.emoji} {currentMeta.label} · {grade}
                  </div>
                </div>
              </div>
            </div>

            {/* Subtopic rows */}
            <div style={{ padding: '16px 16px 0' }}>
              {subtopicLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1,2,3].map(i => (
                    <div key={i} className="skeleton" style={{ height: 64, borderRadius: 16 }} />
                  ))}
                </div>
              ) : subtopics.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted, fontWeight: 600 }}>
                  No subtopics yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {subtopics.map((sub, si) => {
                    const done       = completedIds.includes(sub.id);
                    const hasLesson  = lessonMap[sub.id] ?? false;
                    const comingSoon = !hasLesson;
                    return (
                      <SubtopicRow
                        key={sub.id}
                        sub={sub}
                        index={si}
                        done={done}
                        comingSoon={comingSoon}
                        accentColor={currentMeta.color}
                        onSelect={() => {
                          if (!comingSoon) onSelectSubtopic(sub);
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Topic node card ───────────────────────────────────────────
function TopicNode({ topic, idx, completedIds, accentColor, onClick }) {
  // We don't have subtopic IDs pre-loaded here (loaded lazily on tap)
  // Show topic without per-topic progress bar — just tap to open
  return (
    <div
      onClick={onClick}
      className="anim-fadeUp"
      style={{
        background: '#fff',
        borderRadius: 20,
        padding: '16px 16px',
        cursor: 'pointer',
        border: `2px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 14,
        animationDelay: `${idx * 0.05}s`,
        transition: 'transform 0.15s, box-shadow 0.15s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {/* Icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 16, flexShrink: 0,
        background: `${accentColor}18`,
        border: `2px solid ${accentColor}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>
        {topicIcon(topic, idx)}
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 16,
          color: C.navy, lineHeight: 1.3,
        }}>
          {topic.name}
        </div>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginTop: 2 }}>
          Tap to open subtopics
        </div>
      </div>

      {/* Arrow */}
      <div style={{ fontSize: 22, color: accentColor, flexShrink: 0, fontWeight: 700 }}>›</div>
    </div>
  );
}

// ── Subtopic row ──────────────────────────────────────────────
function SubtopicRow({ sub, index, done, comingSoon, accentColor, onSelect }) {
  return (
    <div
      onClick={onSelect}
      style={{
        background: comingSoon ? '#FAFAF8' : '#fff',
        borderRadius: 16,
        padding: '14px 16px',
        cursor: comingSoon ? 'default' : 'pointer',
        border: `2px solid ${done ? accentColor + '55' : comingSoon ? '#E8E8EE' : C.border}`,
        display: 'flex', alignItems: 'center', gap: 12,
        opacity: comingSoon ? 0.75 : 1,
        transition: 'all 0.15s',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
      onTouchStart={e => { if (!comingSoon) e.currentTarget.style.transform = 'scale(0.98)'; }}
      onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {/* Number badge */}
      <div style={{
        width: 30, height: 30, borderRadius: 10, flexShrink: 0,
        background: done ? accentColor : comingSoon ? '#E8E8EE' : `${accentColor}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 14,
        color: done ? '#fff' : comingSoon ? C.muted : accentColor,
        border: done ? 'none' : `1.5px solid ${done ? accentColor : comingSoon ? '#D8D8D8' : accentColor + '44'}`,
      }}>
        {done ? '✓' : index + 1}
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700, fontSize: 15, color: done ? '#1a5c3a' : comingSoon ? C.muted : C.navy,
          lineHeight: 1.35,
        }}>
          {sub.name}
        </div>
      </div>

      {/* Status badge */}
      {comingSoon ? (
        <span style={{
          fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20,
          background: '#F0EDE8', color: C.muted, flexShrink: 0,
        }}>
          Soon
        </span>
      ) : done ? (
        <span style={{
          fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20,
          background: `${accentColor}18`, color: accentColor, flexShrink: 0,
        }}>
          Done ✓
        </span>
      ) : (
        <div style={{ fontSize: 18, color: accentColor, flexShrink: 0 }}>›</div>
      )}
    </div>
  );
}
