// src/components/admin/AdminApp.jsx
// ============================================================
// Full admin dashboard — all tabs wired to live Supabase data.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { C } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import CurriculumUploader from './CurriculumUploader';
import Btn from '../ui/Btn';
import Pill from '../ui/Pill';

const NAV = [
  { id: "overview",   icon: "📊", label: "Overview"        },
  { id: "curriculum", icon: "📚", label: "Curriculum"       },
  { id: "lessons",    icon: "⚡", label: "Gen Lessons"      },
  { id: "practice",   icon: "🎯", label: "Gen Practice"     },
  { id: "content",    icon: "📝", label: "Content"          },
  { id: "textbooks",  icon: "📄", label: "Textbooks"        },
  { id: "users",      icon: "👥", label: "Users"            },
  { id: "flagged",    icon: "🚩", label: "Flagged Qs"       },
];

export default function AdminApp({ adminUser, onLogout, onExitAdmin }) {
  const [tab, setTab] = useState("overview");

  // Support both the new onLogout (from AdminPortal) and the legacy onExitAdmin
  const handleExit = onLogout || onExitAdmin;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F5F2EC" }}>
      <div style={{
        width: 220, background: C.navy, display: "flex", flexDirection: "column",
        padding: "28px 0 20px", flexShrink: 0, position: "sticky", top: 0, height: "100vh",
      }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 20, color: "#fff" }}>🧮 Admin</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, marginTop: 2 }}>MathsInBites CMS</div>
          {adminUser?.email && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600, marginTop: 4, wordBreak: "break-all" }}>
              {adminUser.email}
            </div>
          )}
        </div>
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {NAV.map(({ id, icon, label }) => (
            <div key={id} onClick={() => setTab(id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 12, marginBottom: 4, cursor: "pointer",
              background: tab === id ? "rgba(255,255,255,0.12)" : "transparent",
              color: tab === id ? "#fff" : "rgba(255,255,255,0.55)",
              fontWeight: 700, fontSize: 14, transition: "all 0.18s",
            }}>
              <span style={{ fontSize: 18 }}>{icon}</span>{label}
            </div>
          ))}
        </nav>
        <div style={{ padding: "0 12px" }}>
          <div onClick={handleExit} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 12, cursor: "pointer",
            color: "rgba(255,255,255,0.45)", fontWeight: 700, fontSize: 14,
            transition: "all 0.18s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
          >
            🚪 Log Out
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", minHeight: "100vh" }}>
        {tab === "overview"   && <AdminOverview />}
        {tab === "curriculum" && <CurriculumUploader />}
        {tab === "lessons"    && <AdminGenerateLessons />}
        {tab === "practice"   && <AdminGeneratePractice />}
        {tab === "content"    && <AdminContent />}
        {tab === "textbooks"  && <AdminTextbooks />}
        {tab === "users"      && <AdminUsers />}
        {tab === "flagged"    && <AdminFlaggedQuestions />}
      </div>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────
function AdminOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      supabase.from('learning_paths').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('topics').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('lessons').select('id', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    ]).then(([paths, topics, lessons, students]) => {
      setStats({ paths: paths.count||0, topics: topics.count||0, lessons: lessons.count||0, students: students.count||0 });
    });
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 32, color: C.navy, marginBottom: 4 }}>Overview</h1>
      <p style={{ color: C.muted, fontWeight: 600, marginBottom: 28 }}>Your platform at a glance</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Learning Paths",    key: "paths",    icon: "📚", color: C.fire   },
          { label: "Topics",            key: "topics",   icon: "🔢", color: C.purple },
          { label: "Lessons Generated", key: "lessons",  icon: "✅", color: C.mint   },
          { label: "Students",          key: "students", icon: "👥", color: C.sky    },
        ].map(({ label, key, icon, color }) => (
          <div key={label} className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 30, color }}>
              {stats ? stats[key] : "—"}
            </div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>{label}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 18, color: C.navy, marginBottom: 12 }}>Getting Started</div>
        {[
          ["1", "Upload curriculum", "Go to Curriculum → select a class → paste your curriculum text", C.fire],
          ["2", "Students open lessons", "AI generates topics & lessons automatically when students open subtopics", C.purple],
          ["3", "Review flagged questions", "Check Flagged Qs → review questions students reported as incorrect", C.mint],
        ].map(([num, title, desc, color]) => (
          <div key={num} style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${color}22`, border: `2px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color, flexShrink: 0 }}>{num}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.navy }}>{title}</div>
              <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginTop: 2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Content ───────────────────────────────────────────────────
function AdminContent() {
  const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const [learningPaths, setLearningPaths] = useState([]);
  const [selectedLp,    setSelectedLp]   = useState(null);
  const [topics,        setTopics]       = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [subtopics,     setSubtopics]    = useState([]);
  const [selectedSub,   setSelectedSub]  = useState(null);
  const [lesson,        setLesson]       = useState(null);
  const [loading,       setLoading]      = useState(false);
  const [regenSection,  setRegenSection] = useState(null); // 'intro'|'concept'|'examples'|'summary'|null
  const [regenNote,     setRegenNote]    = useState('');
  const [regenLoading,  setRegenLoading] = useState(false);
  const [regenMsg,      setRegenMsg]     = useState('');

  useEffect(() => {
    supabase.from('learning_paths').select('id,name,grade,icon').eq('is_active', true).order('sort_order')
      .then(({ data }) => setLearningPaths(data || []));
  }, []);

  const loadTopics = async (lp) => {
    setSelectedLp(lp); setTopics([]); setSelectedTopic(null); setSubtopics([]); setSelectedSub(null); setLesson(null);
    const { data } = await supabase.from('topics').select('id,name,icon').eq('learning_path_id', lp.id).order('sort_order');
    setTopics(data || []);
  };

  const loadSubtopics = async (topic) => {
    setSelectedTopic(topic); setSubtopics([]); setSelectedSub(null); setLesson(null);
    const { data } = await supabase.from('subtopics').select('id,name,sort_order').eq('topic_id', topic.id).order('sort_order');
    setSubtopics(data || []);
  };

  const loadLesson = async (sub) => {
    setSelectedSub(sub); setLesson(null); setLoading(true); setRegenSection(null); setRegenMsg('');
    const { data } = await supabase.from('lessons').select('*').eq('subtopic_id', sub.id).order('created_at', { ascending: false }).limit(1);
    setLesson(data?.[0] || null);
    setLoading(false);
  };

  const regenerateLesson = async () => {
    if (!selectedSub) return;
    setLoading(true); setLesson(null); setRegenMsg('Generating full lesson…');
    // Delete existing lesson first
    if (lesson) await supabase.from('lessons').delete().eq('id', lesson.id);
    const session = (await supabase.auth.getSession()).data.session;
    const token   = session?.access_token ?? SUPABASE_ANON_KEY;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ subtopic_id: selectedSub.id }),
    });
    const json = await res.json();
    if (json.ok) {
      await loadLesson(selectedSub);
      setRegenMsg('✅ Lesson regenerated!');
    } else {
      setRegenMsg('❌ Error: ' + json.error);
      setLoading(false);
    }
  };

  const regenerateSection = async () => {
    if (!lesson || !regenSection) return;
    setRegenLoading(true); setRegenMsg('');
    try {
      let data;
      try { data = JSON.parse(lesson.content); } catch { data = {}; }

      const session = (await supabase.auth.getSession()).data.session;
      const token   = session?.access_token ?? SUPABASE_ANON_KEY;

      const sectionLabel = { intro: 'Intro', concept: 'Concept', examples: 'Examples', summary: 'Mini Summary' }[regenSection];
      const currentText  = regenSection === 'intro'    ? data.intro?.text
                         : regenSection === 'concept'  ? data.concept?.text
                         : regenSection === 'examples' ? JSON.stringify(data.examples)
                         : data.summary;

      const prompt = `You are regenerating the "${sectionLabel}" section of a MathsInBites lesson.

Subtopic: ${selectedSub.name}
Topic: ${selectedTopic?.name || ''}

Current ${sectionLabel} content:
${currentText || '(none)'}

Admin note / instructions:
${regenNote || '(none — just improve quality)'}

${regenSection === 'intro' ? `Return ONLY a JSON object: { "text": "...", "svg": "<svg ...>...</svg> or null" }` : ''}
${regenSection === 'concept' ? `Return ONLY a JSON object: { "text": "...", "svg": "<svg ...>...</svg>" }
The svg must follow: viewBox="0 0 320 200" width="100%" height="auto", inline styles only, gradient background, 3-4 colors.` : ''}
${regenSection === 'examples' ? `Return ONLY a JSON array of 3 examples: [{"problem":"...","explanation":"...","answer":"..."},...]` : ''}
${regenSection === 'summary' ? `Return ONLY a plain string: the new 2-3 line summary.` : ''}

No markdown fences. No preamble. Just the raw JSON or string.`;

      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const aiData = await aiRes.json();
      const raw = aiData.content?.[0]?.text?.trim() ?? '';
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();

      // Update the lesson data
      if (regenSection === 'intro') {
        const parsed = JSON.parse(cleaned);
        data.intro = parsed;
      } else if (regenSection === 'concept') {
        const parsed = JSON.parse(cleaned);
        data.concept = parsed;
      } else if (regenSection === 'examples') {
        data.examples = JSON.parse(cleaned);
      } else if (regenSection === 'summary') {
        data.summary = cleaned.replace(/^["']|["']$/g, '');
      }

      await supabase.from('lessons').update({ content: JSON.stringify(data) }).eq('id', lesson.id);
      setLesson(l => ({ ...l, content: JSON.stringify(data) }));
      setRegenSection(null);
      setRegenNote('');
      setRegenMsg('✅ Section updated!');
    } catch (e) {
      setRegenMsg('❌ Error: ' + e.message);
    }
    setRegenLoading(false);
  };

  // Parse lesson JSON for preview
  const lessonData = (() => {
    if (!lesson) return null;
    try { return JSON.parse(lesson.content); } catch { return null; }
  })();

  const col = '#6C63FF';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ── Left panel: nav tree ── */}
      <div style={{ width: 260, borderRight: '1px solid #E8E8EE', overflowY: 'auto', padding: 20, flexShrink: 0, background: '#fafafa' }}>
        <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 18, color: C.navy, marginBottom: 16 }}>📝 Content</div>

        {/* Learning paths */}
        {learningPaths.map(lp => (
          <div key={lp.id}>
            <div onClick={() => loadTopics(lp)} style={{
              padding: '8px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 2,
              background: selectedLp?.id === lp.id ? `${col}18` : 'transparent',
              color: selectedLp?.id === lp.id ? col : C.navy,
              fontWeight: 700, fontSize: 14,
            }}>
              {lp.icon || '📚'} {lp.name} <span style={{ opacity: 0.5, fontSize: 12 }}>{lp.grade}</span>
            </div>

            {selectedLp?.id === lp.id && topics.map(t => (
              <div key={t.id} style={{ paddingLeft: 12 }}>
                <div onClick={() => loadSubtopics(t)} style={{
                  padding: '7px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                  background: selectedTopic?.id === t.id ? `${col}12` : 'transparent',
                  color: selectedTopic?.id === t.id ? col : '#444',
                  fontWeight: 600, fontSize: 13,
                }}>
                  {t.icon || '📖'} {t.name}
                </div>

                {selectedTopic?.id === t.id && subtopics.map(s => (
                  <div key={s.id} onClick={() => loadLesson(s)} style={{
                    padding: '6px 12px 6px 24px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                    background: selectedSub?.id === s.id ? `${col}20` : 'transparent',
                    color: selectedSub?.id === s.id ? col : '#666',
                    fontWeight: selectedSub?.id === s.id ? 700 : 500, fontSize: 12,
                  }}>
                    {s.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Right panel: lesson preview ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {!selectedSub && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: C.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
            <div style={{ fontWeight: 700 }}>Select a class → topic → subtopic to preview its lesson</div>
          </div>
        )}

        {selectedSub && loading && (
          <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            <div style={{ fontWeight: 600 }}>{regenMsg || 'Loading…'}</div>
          </div>
        )}

        {selectedSub && !loading && !lesson && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
            <div style={{ fontWeight: 700, color: C.navy, marginBottom: 16 }}>No lesson generated yet for:<br/><span style={{ color: col }}>{selectedSub.name}</span></div>
            <button onClick={regenerateLesson} style={{
              background: col, color: '#fff', border: 'none', borderRadius: 12,
              padding: '12px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer',
            }}>⚡ Generate Now</button>
          </div>
        )}

        {selectedSub && !loading && lesson && lessonData && (
          <div style={{ maxWidth: 720 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 4 }}>
                  {selectedLp?.name} → {selectedTopic?.name}
                </div>
                <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 26, color: C.navy, margin: 0 }}>
                  {selectedSub.name}
                </h1>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {regenMsg && <div style={{ fontSize: 13, fontWeight: 700, color: regenMsg.startsWith('✅') ? '#2a9d78' : '#c0392b', alignSelf: 'center' }}>{regenMsg}</div>}
                <button onClick={regenerateLesson} style={{
                  background: '#fff', border: '2px solid #E8E8EE', borderRadius: 10,
                  padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: C.muted,
                }}>🔄 Regenerate All</button>
              </div>
            </div>

            {/* Section: Intro */}
            <AdminLessonSection
              title="Introduction" color="#FF9A3C"
              onRegen={() => setRegenSection(regenSection === 'intro' ? null : 'intro')}
              active={regenSection === 'intro'}
            >
              <p style={{ fontSize: 15, lineHeight: 1.8, color: '#3d3d3d', margin: 0 }}>{lessonData.intro?.text}</p>
              {lessonData.intro?.svg && (
                <div className="lesson-illustration intro" style={{ marginTop: 12 }}
                  dangerouslySetInnerHTML={{ __html: lessonData.intro.svg }} />
              )}
            </AdminLessonSection>

            {/* Section: Concept */}
            <AdminLessonSection
              title="Concept" color="#6C63FF"
              onRegen={() => setRegenSection(regenSection === 'concept' ? null : 'concept')}
              active={regenSection === 'concept'}
            >
              <ConceptPreview text={lessonData.concept?.text} svg={lessonData.concept?.svg} />
            </AdminLessonSection>

            {/* Section: Examples */}
            <AdminLessonSection
              title="Examples" color="#43CFAC"
              onRegen={() => setRegenSection(regenSection === 'examples' ? null : 'examples')}
              active={regenSection === 'examples'}
            >
              {(lessonData.examples || []).map((ex, i) => (
                <div key={i} style={{ marginBottom: 14, padding: '12px 16px', background: '#f6fffe', borderRadius: 10, border: '1px solid #d4f5ec' }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, marginBottom: 6, color: '#1a1a2e' }}>{ex.problem}</div>
                  <div style={{ fontSize: 13, color: '#4a7a68', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 6 }}>
                    {(ex.explanation || ex.working || '').replace(/\\n/g, '\n')}
                  </div>
                  <div style={{ fontWeight: 800, color: '#2a9d78', fontSize: 14 }}>Answer: {ex.answer}</div>
                </div>
              ))}
            </AdminLessonSection>

            {/* Section: Summary */}
            <AdminLessonSection
              title="Mini Summary" color="#FF6B6B"
              onRegen={() => setRegenSection(regenSection === 'summary' ? null : 'summary')}
              active={regenSection === 'summary'}
            >
              <p style={{ fontSize: 15, lineHeight: 1.8, color: '#3d3d3d', margin: 0, whiteSpace: 'pre-line' }}>{lessonData.summary}</p>
            </AdminLessonSection>

            {/* Quick Check preview */}
            {lessonData.quickCheck?.length > 0 && (
              <div style={{ marginBottom: 20, background: '#fff', borderRadius: 16, border: '1px solid #E8E8EE', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8E8EE', background: '#f8f8ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: C.navy }}>✅ Quick Check ({lessonData.quickCheck.length} questions)</span>
                  <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Read-only preview</span>
                </div>
                <div style={{ padding: 20 }}>
                  {lessonData.quickCheck.map((q, i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Q{i+1}. {q.question}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                        {(q.options || []).map((opt, oi) => (
                          <div key={oi} style={{
                            padding: '6px 10px', borderRadius: 8, fontSize: 13,
                            background: oi === q.answer ? '#d4f5ec' : '#f5f5f5',
                            border: oi === q.answer ? '2px solid #43CFAC' : '1px solid #E8E8EE',
                            fontWeight: oi === q.answer ? 700 : 400,
                          }}>
                            {['A','B','C','D'][oi]}. {opt}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: '#6057b8', fontStyle: 'italic' }}>💡 {q.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regen panel */}
            {regenSection && (
              <div style={{
                position: 'sticky', bottom: 20, background: '#fff', borderRadius: 16,
                border: '2px solid #6C63FF', padding: 20, boxShadow: '0 8px 32px rgba(108,99,255,0.18)',
              }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: C.navy, marginBottom: 10 }}>
                  ✏️ Regenerate: <span style={{ color: col }}>{regenSection.charAt(0).toUpperCase() + regenSection.slice(1)}</span>
                </div>
                <textarea
                  value={regenNote}
                  onChange={e => setRegenNote(e.target.value)}
                  placeholder="Optional instructions — e.g. 'Use a number line instead', 'Make examples easier', 'Improve the SVG diagram'"
                  style={{
                    width: '100%', minHeight: 80, borderRadius: 10, border: '1px solid #E8E8EE',
                    padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
                    boxSizing: 'border-box', marginBottom: 12,
                  }}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={regenerateSection} disabled={regenLoading} style={{
                    background: col, color: '#fff', border: 'none', borderRadius: 10,
                    padding: '10px 22px', fontWeight: 800, fontSize: 14, cursor: regenLoading ? 'wait' : 'pointer',
                    opacity: regenLoading ? 0.7 : 1,
                  }}>{regenLoading ? '⏳ Regenerating…' : '⚡ Regenerate'}</button>
                  <button onClick={() => { setRegenSection(null); setRegenNote(''); }} style={{
                    background: '#f5f5f5', color: C.muted, border: 'none', borderRadius: 10,
                    padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminLessonSection({ title, color, onRegen, active, children }) {
  return (
    <div style={{ marginBottom: 20, background: '#fff', borderRadius: 16, border: `1px solid ${active ? color : '#E8E8EE'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #E8E8EE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: active ? `${color}10` : '#fafafa' }}>
        <span style={{ fontWeight: 800, fontSize: 14, color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</span>
        <button onClick={onRegen} style={{
          background: active ? color : '#fff', color: active ? '#fff' : color,
          border: `1.5px solid ${color}`, borderRadius: 8,
          padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>{active ? '✕ Cancel' : '✏️ Suggest / Regenerate'}</button>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function ConceptPreview({ text, svg }) {
  if (!text) return null;
  const normalised = (text || '').replace(/\\n/g, '\n');
  return (
    <div>
      {normalised.split('\n').map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} style={{ height: 6 }} />;
        if (/^[-•\u2013*]\s/.test(t)) return (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ color: '#6C63FF', fontWeight: 800, flexShrink: 0 }}>–</span>
            <span style={{ fontSize: 14, lineHeight: 1.7, color: '#3d3d3d' }}>{t.replace(/^[-•\u2013*]\s+/, '')}</span>
          </div>
        );
        return <p key={i} style={{ fontSize: 14, lineHeight: 1.7, color: '#3d3d3d', marginBottom: 4 }}>{t}</p>;
      })}
      {svg && <div className="lesson-illustration concept" style={{ marginTop: 12 }} dangerouslySetInnerHTML={{ __html: svg }} />}
    </div>
  );
}
// ── Textbooks ─────────────────────────────────────────────────
function AdminTextbooks() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [learningPaths, setLearningPaths] = useState([]);
  const [selectedLp, setSelectedLp] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    Promise.all([
      supabase.from('textbooks').select('*, learning_paths(name)').order('created_at', { ascending: false }),
      supabase.from('learning_paths').select('id, name, grade').eq('is_active', true).order('sort_order'),
    ]).then(([filesRes, lpRes]) => {
      setFiles(filesRes.data || []);
      setLearningPaths(lpRes.data || []);
      setLoading(false);
    });
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedLp || !title.trim()) { setError("Please select a class and enter a title"); return; }
    setUploading(true); setError(null);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      // Try storage upload; fall back to just storing metadata if storage bucket not configured
      let fileUrl = null;
      const { error: uploadErr } = await supabase.storage.from('textbooks').upload(fileName, file);
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from('textbooks').getPublicUrl(fileName);
        fileUrl = publicUrl;
      }
      const { data: row, error: insertErr } = await supabase.from('textbooks').insert({
        learning_path_id: selectedLp,
        title: title.trim(),
        description: description.trim() || null,
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      }).select('*, learning_paths(name)').single();
      if (insertErr) throw insertErr;
      setFiles(f => [row, ...f]);
      setTitle(""); setDescription(""); fileRef.current.value = "";
    } catch (err) { setError(err.message || "Upload failed"); }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this textbook?")) return;
    await supabase.from('textbooks').delete().eq('id', id);
    setFiles(f => f.filter(t => t.id !== id));
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 32, color: C.navy, marginBottom: 4 }}>Textbooks</h1>
      <p style={{ color: C.muted, fontWeight: 600, marginBottom: 24 }}>Upload past questions, reference books, and syllabi.</p>
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 17, color: C.navy, marginBottom: 16 }}>Upload a textbook</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6 }}>Title *</div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. WAEC Past Questions 2023"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `2px solid ${C.border}`, fontSize: 14, fontWeight: 600, color: C.navy, background: "#FAFAF8", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6 }}>Class / Exam *</div>
            <select value={selectedLp} onChange={e => setSelectedLp(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `2px solid ${C.border}`, fontSize: 14, fontWeight: 600, color: C.navy, background: "#FAFAF8" }}>
              <option value="">Select class…</option>
              {learningPaths.map(lp => <option key={lp.id} value={lp.id}>{lp.name} ({lp.grade})</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6 }}>Description (optional)</div>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description…"
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `2px solid ${C.border}`, fontSize: 14, fontWeight: 600, color: C.navy, background: "#FAFAF8", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} style={{ display: "none" }} />
          <Btn onClick={() => fileRef.current?.click()} disabled={uploading || !selectedLp || !title.trim()} color={C.fire}>
            {uploading ? "Uploading…" : "📄 Choose & Upload File"}
          </Btn>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>PDF, DOC, or TXT</div>
        </div>
        {error && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 12, background: `${C.rose}12`, border: `1.5px solid ${C.rose}33`, fontSize: 13, fontWeight: 700, color: C.rose }}>⚠️ {error}</div>}
      </div>
      {loading ? (
        [1,2].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 16, marginBottom: 10 }} />)
      ) : files.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
          <div style={{ fontWeight: 700 }}>No textbooks uploaded yet</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {files.map(f => (
            <div key={f.id} className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 28 }}>📄</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: C.navy }}>{f.title}</div>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
                  {f.learning_paths?.name} · {f.file_name} · {f.file_size ? `${Math.round(f.file_size/1024)}KB` : ""} · {new Date(f.created_at).toLocaleDateString()}
                </div>
              </div>
              {f.file_url && <a href={f.file_url} target="_blank" rel="noreferrer"><Btn outline color={C.sky} size="sm">View</Btn></a>}
              <Btn onClick={() => handleDelete(f.id)} outline color={C.rose} size="sm">Delete</Btn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Users ─────────────────────────────────────────────────────
function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from('user_profiles')
      .select('id, name, grade, mode, total_xp, streak, is_admin, created_at')
      .order('total_xp', { ascending: false })
      .then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, []);

  const toggleAdmin = async (id, isAdmin) => {
    await supabase.from('user_profiles').update({ is_admin: !isAdmin }).eq('id', id);
    setUsers(us => us.map(u => u.id === id ? { ...u, is_admin: !isAdmin } : u));
  };

  const filtered = search
    ? users.filter(u => (u.name || "").toLowerCase().includes(search.toLowerCase()))
    : users;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 32, color: C.navy, marginBottom: 4 }}>Users</h1>
      <p style={{ color: C.muted, fontWeight: 600, marginBottom: 20 }}>All registered students ({users.length} total)</p>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name…"
        style={{ width: "100%", maxWidth: 400, padding: "10px 16px", borderRadius: 50, border: `2px solid ${C.border}`, fontSize: 14, fontWeight: 600, color: C.navy, background: "#fff", marginBottom: 20, boxSizing: "border-box" }} />
      {loading ? (
        [1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 16, marginBottom: 8 }} />)
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
          <div style={{ fontWeight: 700 }}>No users found</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(u => (
            <div key={u.id} className="card" style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,${C.fire}33,${C.sun}22)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: C.fire, flexShrink: 0 }}>
                {(u.name || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: C.navy }}>{u.name || "No name"}</div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
                  {u.grade} · {u.mode} · ⭐ {u.total_xp || 0} XP · 🔥 {u.streak || 0} streak
                </div>
              </div>
              {u.is_admin && <Pill color={C.purple}>Admin</Pill>}
              <Btn onClick={() => toggleAdmin(u.id, u.is_admin)} outline={u.is_admin} color={u.is_admin ? C.rose : C.purple} size="sm">
                {u.is_admin ? "Remove Admin" : "Make Admin"}
              </Btn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Generate Lessons (Admin Bulk) ─────────────────────────────
function AdminGenerateLessons() {
  const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const [learningPaths, setLearningPaths] = useState([]);
  const [selectedLp,    setSelectedLp]   = useState(null);
  const [topics,        setTopics]       = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState(null);

  // runningTopics: Set of topic IDs currently generating
  const [runningTopics, setRunningTopics] = useState(new Set());
  const [generatingAll, setGeneratingAll] = useState(false);
  const [log,           setLog]           = useState({}); // { topicId: [{type,msg}] }

  const pausedRef  = useRef(false);
  const [paused,   setPaused]  = useState(false);
  const stopAllRef = useRef(false);

  useEffect(() => {
    supabase.from('learning_paths').select('id,name,grade,mode,icon').eq('is_active', true).order('sort_order')
      .then(({ data }) => setLearningPaths(data || []));
  }, []);

  // ── Load topics + subtopics from DB ─────────────────────────
  const loadTopics = async (lp) => {
    setSelectedLp(lp);
    setTopics([]); setLog({});
    setExpandedTopic(null);
    setRunningTopics(new Set());
    setGeneratingAll(false);
    setPaused(false);
    pausedRef.current  = false;
    stopAllRef.current = false;
    setLoadingTopics(true);

    const { data: topicRows, error: topicErr } = await supabase
      .from('topics').select('id,name,icon,sort_order')
      .eq('learning_path_id', lp.id)
      .order('sort_order');

    if (topicErr) {
      console.error('Error loading topics:', topicErr);
      setLoadingTopics(false);
      return;
    }

    // Show topic shells immediately — subtopics load progressively
    const shells = (topicRows || []).map(t => ({ ...t, subtopics: null }));
    setTopics(shells);
    setLoadingTopics(false); // stop full-screen spinner now

    // Stream in each topic's subtopics + lesson status one by one
    for (const t of topicRows || []) {
      const { data: subs } = await supabase
        .from('subtopics').select('id,name,sort_order')
        .eq('topic_id', t.id).order('sort_order');

      const subIds = (subs || []).map(s => s.id);
      let lessonSet = new Set();
      if (subIds.length) {
        const { data: lessons } = await supabase
          .from('lessons').select('subtopic_id').in('subtopic_id', subIds);
        lessonSet = new Set((lessons || []).map(l => l.subtopic_id));
      }

      setTopics(prev => prev.map(pt => pt.id !== t.id ? pt : {
        ...pt,
        subtopics: (subs || []).map(s => ({
          ...s, topicId: t.id, topicName: t.name, hasLesson: lessonSet.has(s.id),
        })),
      }));
    }
  };

  const addLog = (topicId, entry) =>
    setLog(prev => ({ ...prev, [topicId]: [...(prev[topicId] || []), entry] }));

  const markLessonDone = (topicId, subId) =>
    setTopics(ts => ts.map(t => t.id !== topicId ? t : {
      ...t,
      subtopics: t.subtopics.map(s => s.id === subId ? { ...s, hasLesson: true } : s),
    }));

  // ── Core generator: run through subtopics for one topic ─────
  const generateSubtopics = async (topic) => {
    const session = (await supabase.auth.getSession()).data.session;
    const token   = session?.access_token ?? SUPABASE_ANON_KEY;
    // Always work from full subtopic list — skip check is done live against DB below
    const subs = topic.subtopics;

    if (!subs.length) {
      addLog(topic.id, { type: 'skip', msg: 'No subtopics found for this topic.' });
      return;
    }

    let ok = 0, skip = 0, fail = 0;

    for (let i = 0; i < subs.length; i++) {
      // Pause support
      while (pausedRef.current) await new Promise(r => setTimeout(r, 300));
      // Stop-all support
      if (stopAllRef.current) {
        addLog(topic.id, { type: 'error', msg: '⏹ Stopped.' });
        return;
      }

      const sub  = subs[i];
      const prog = `[${i + 1}/${subs.length}]`;

      // Live check: does a lesson already exist for this subtopic?
      const { count: existingCount } = await supabase
        .from('lessons').select('id', { count: 'exact', head: true })
        .eq('subtopic_id', sub.id);

      if (existingCount > 0) {
        skip++;
        addLog(topic.id, { type: 'skip', msg: `${prog} ⏭ Already exists: ${sub.name}` });
        markLessonDone(topic.id, sub.id);
        continue;
      }

      addLog(topic.id, { type: 'info', msg: `${prog} ⏳ ${sub.name}…` });

      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-lesson`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ subtopic_id: sub.id }),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}${txt ? ': ' + txt.slice(0, 80) : ''}`);
        }

        ok++;
        addLog(topic.id, { type: 'ok',   msg: `${prog} ✅ ${sub.name}` });
        markLessonDone(topic.id, sub.id);
      } catch (e) {
        fail++;
        addLog(topic.id, { type: 'error', msg: `${prog} ❌ ${sub.name} — ${e.message}` });
      }

      // Small delay to avoid hammering the edge function
      if (i < subs.length - 1) await new Promise(r => setTimeout(r, 700));
    }

    addLog(topic.id, {
      type: 'done',
      msg:  `\n✅ ${ok} generated · ${skip} skipped · ${fail} failed`,
    });
  };

  // ── Generate a single topic ──────────────────────────────────
  const handleGenerateTopic = async (topic) => {
    if (runningTopics.has(topic.id)) return; // already running
    setLog(prev => ({ ...prev, [topic.id]: [] }));
    setExpandedTopic(topic.id);
    setRunningTopics(prev => new Set([...prev, topic.id]));
    await generateSubtopics(topic);
    setRunningTopics(prev => { const n = new Set(prev); n.delete(topic.id); return n; });
  };

  // ── Generate ALL topics (one after another) ──────────────────
  const handleGenerateAll = async () => {
    if (generatingAll) return;
    stopAllRef.current = false;
    pausedRef.current  = false;
    setPaused(false);
    setGeneratingAll(true);
    // Clear all logs
    setLog({});

    for (const topic of topics) {
      if (stopAllRef.current) break;
      const pending = (topic.subtopics || []).filter(s => !s.hasLesson);
      if (!pending.length) continue;

      setExpandedTopic(topic.id);
      setRunningTopics(prev => new Set([...prev, topic.id]));
      await generateSubtopics(topic);
      setRunningTopics(prev => { const n = new Set(prev); n.delete(topic.id); return n; });
    }

    setGeneratingAll(false);
  };

  const handlePauseResume = () => {
    const next = !paused;
    setPaused(next);
    pausedRef.current = next;
  };

  const handleStopAll = () => {
    stopAllRef.current = true;
    setPaused(false);
    pausedRef.current = false;
  };

  const totalSubs    = topics.reduce((a, t) => a + (t.subtopics?.length ?? 0), 0);
  const doneCount    = topics.reduce((a, t) => a + (t.subtopics?.filter(s => s.hasLesson).length ?? 0), 0);
  const pendingCount = totalSubs - doneCount;
  const anyRunning   = runningTopics.size > 0 || generatingAll;

  const colorMap = { ok: C.mint, error: C.rose, skip: C.muted, info: C.navy, done: C.fire };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 32, color: C.navy, marginBottom: 4 }}>
        Generate Lessons
      </h1>
      <p style={{ color: C.muted, fontWeight: 600, marginBottom: 24 }}>
        Click <strong>⚡ Generate</strong> on any topic to generate its lessons individually,
        or use <strong>⚡ Generate All</strong> to process every topic in sequence.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>

        {/* ── Class selector ── */}
        <div>
          <div style={{ fontWeight: 800, fontSize: 12, color: C.muted, letterSpacing: 0.8, marginBottom: 10 }}>
            SELECT CLASS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {learningPaths.map(lp => (
              <div key={lp.id}
                onClick={() => loadTopics(lp)}
                style={{
                  padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${selectedLp?.id === lp.id ? C.fire : C.border}`,
                  background: selectedLp?.id === lp.id ? `${C.fire}10` : '#fff',
                  fontWeight: 700, fontSize: 14, color: C.navy, transition: 'all 0.18s',
                }}>
                {lp.icon || '📚'} {lp.name}
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{lp.grade}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main panel ── */}
        <div>
          {!selectedLp ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: C.muted, fontWeight: 600, fontSize: 15 }}>
              ← Select a class to begin
            </div>

          ) : loadingTopics ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 70, borderRadius: 16 }} />)}
            </div>

          ) : topics.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: C.muted }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No topics found for {selectedLp.name}</div>
              <div style={{ fontSize: 13, marginBottom: 8 }}>Upload curriculum first in the <strong>Curriculum</strong> tab.</div>
              <div style={{ fontSize: 12, color: C.rose, fontWeight: 600 }}>
                If you already uploaded curriculum, check the browser console for errors (F12).
              </div>
            </div>

          ) : (
            <>
              {/* ── Header bar ── */}
              <div className="card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 18, color: C.navy }}>
                    {selectedLp.name}
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginTop: 2 }}>
                    {topics.length} topics · {doneCount}/{totalSubs} lessons done
                    {pendingCount > 0 && <span style={{ color: C.fire }}> · {pendingCount} to generate</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {anyRunning && (
                    <>
                      <Btn onClick={handlePauseResume} outline color={paused ? C.mint : C.sun} size="sm">
                        {paused ? '▶ Resume' : '⏸ Pause'}
                      </Btn>
                      <Btn onClick={handleStopAll} outline color={C.rose} size="sm">
                        ⏹ Stop
                      </Btn>
                    </>
                  )}
                  <Btn
                    onClick={handleGenerateAll}
                    disabled={generatingAll}
                    color={C.fire}
                    size="lg"
                    style={{ boxShadow: generatingAll ? 'none' : `0 5px 0 ${C.fire}55` }}
                  >
                    {generatingAll ? '⏳ Generating all…' : '⚡ Generate All'}
                  </Btn>
                </div>
              </div>

              {/* ── Per-topic cards ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topics.map(topic => {
                  const topicDone    = (topic.subtopics || []).filter(s => s.hasLesson).length;
                  const topicPending = (topic.subtopics || []).length - topicDone;
                  const isRunning    = runningTopics.has(topic.id);
                  const isExpanded   = expandedTopic === topic.id;
                  const topicLog     = log[topic.id] || [];
                  const pct = (topic.subtopics || []).length > 0
                    ? Math.round((topicDone / (topic.subtopics || []).length) * 100) : 0;

                  return (
                    <div key={topic.id} className="card" style={{
                      overflow: 'hidden',
                      border: `2px solid ${
                        isRunning       ? C.fire + '66'
                        : topicPending === 0 ? C.mint + '55'
                        : isExpanded    ? C.border
                        : C.border
                      }`,
                      transition: 'border-color 0.2s',
                    }}>

                      {/* Row — click to expand/collapse */}
                      <div
                        onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                        style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, userSelect: 'none' }}
                      >
                        {/* Icon bubble */}
                        <div style={{
                          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                          background: topicPending === 0
                            ? `${C.mint}22`
                            : `linear-gradient(135deg, ${C.fire}22, ${C.sun}11)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                        }}>
                          {topic.icon || '📖'}
                        </div>

                        {/* Name + progress bar */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 15, color: topicPending === 0 ? '#1a5c3a' : C.navy }}>
                              {topic.name}
                            </div>
                            {isRunning && (
                              <span style={{ fontSize: 11, fontWeight: 800, color: C.fire, background: `${C.fire}15`, padding: '2px 8px', borderRadius: 99 }}>
                                ● GENERATING
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 100, height: 5, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', width: `${pct}%`,
                                background: pct === 100 ? C.mint : C.fire,
                                borderRadius: 99, transition: 'width 0.4s',
                              }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>
                              {topicDone}/{(topic.subtopics || []).length}
                              {topicPending > 0 && <span style={{ color: C.fire }}> · {topicPending} left</span>}
                            </span>
                          </div>
                        </div>

                        {/* Generate button — stopPropagation so it doesn't toggle expand */}
                        <div onClick={e => e.stopPropagation()}>
                          <Btn
                            onClick={() => handleGenerateTopic(topic)}
                            disabled={isRunning}
                            color={C.purple}
                            size="sm"
                          >
                            {isRunning
                              ? '⏳ Running…'
                              : topicPending === 0
                              ? '🔄 Re-generate'
                              : `⚡ Generate`}
                          </Btn>
                          {/* Force re-generate all — deletes existing lessons first */}
                          {topicPending === 0 && !isRunning && (
                            <Btn
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!confirm(`Delete and regenerate ALL lessons for "${topic.name}"?`)) return;
                                // Delete all lessons for this topic's subtopics
                                const subIds = (topic.subtopics || []).map(s => s.id);
                                if (subIds.length) await supabase.from('lessons').delete().in('subtopic_id', subIds);
                                // Reset hasLesson flags
                                setTopics(ts => ts.map(t => t.id !== topic.id ? t : {
                                  ...t, subtopics: t.subtopics.map(s => ({ ...s, hasLesson: false }))
                                }));
                                await generateSubtopics(topic);
                              }}
                              color={C.fire}
                              size="sm"
                              outline
                            >
                              🗑️ Force Re-gen
                            </Btn>
                          )}
                        </div>

                        {/* Chevron */}
                        <div style={{ fontSize: 18, color: C.muted, flexShrink: 0, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                          ›
                        </div>
                      </div>

                      {/* Expanded panel */}
                      {isExpanded && (
                        <div style={{ borderTop: `1.5px solid ${C.border}`, background: '#FAFAF8' }}>

                          {/* Generation log */}
                          {topicLog.length > 0 && (
                            <div style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12.5, maxHeight: 160, overflowY: 'auto', lineHeight: 1.9, borderBottom: `1px solid ${C.border}` }}>
                              {topicLog.map((e, i) => (
                                <div key={i} style={{ color: colorMap[e.type] || C.navy }}>{e.msg}</div>
                              ))}
                            </div>
                          )}

                          {/* Subtopic checklist */}
                          <div style={{ padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(topic.subtopics || []).map((sub, si) => (
                              <div key={sub.id} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '7px 12px', borderRadius: 10, background: '#fff',
                                border: `1.5px solid ${sub.hasLesson ? C.mint + '55' : C.border}`,
                              }}>
                                <span style={{ fontSize: 13 }}>{sub.hasLesson ? '✅' : '⬜'}</span>
                                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: sub.hasLesson ? '#1a5c3a' : C.navy }}>
                                  {si + 1}. {sub.name}
                                </span>
                                {sub.hasLesson && (
                                  <span style={{ fontSize: 11, fontWeight: 700, color: C.mint }}>Lesson ready</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function AdminGeneratePractice() {
  const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const [learningPaths,  setLearningPaths]  = useState([]);
  const [selectedLp,     setSelectedLp]     = useState(null);
  const [topics,         setTopics]         = useState([]);
  const [loadingTopics,  setLoadingTopics]  = useState(false);
  const [expandedTopic,  setExpandedTopic]  = useState(null);
  const [generating,     setGenerating]     = useState({});    // topicId → bool
  const [topicCounts,    setTopicCounts]    = useState({});    // topicId → number
  const [topicLogs,      setTopicLogs]      = useState({});    // topicId → [{type,msg}]
  const [questionsCount, setQuestionsCount] = useState(60);
  const [reviewTopic,    setReviewTopic]    = useState(null);  // for modal

  useEffect(() => {
    supabase.from('learning_paths').select('id,name,grade,mode,icon').eq('is_active', true).order('sort_order')
      .then(({ data }) => setLearningPaths(data || []));
  }, []);

  const loadTopics = async (lp) => {
    setSelectedLp(lp); setTopics([]); setTopicLogs({}); setTopicCounts({}); setExpandedTopic(null);
    setLoadingTopics(true);
    const { data: topicRows } = await supabase.from('topics')
      .select('id,name,icon,sort_order').eq('learning_path_id', lp.id).order('sort_order');

    // Show topic shells immediately
    const shells = (topicRows || []).map(t => ({ ...t, subtopics: null }));
    setTopics(shells);
    setLoadingTopics(false);

    // Stream in subtopics + question counts per topic
    for (const t of topicRows || []) {
      const { data: subs } = await supabase.from('subtopics')
        .select('id,name,sort_order').eq('topic_id', t.id).order('sort_order');
      const subList = subs || [];

      setTopics(prev => prev.map(pt => pt.id !== t.id ? pt : { ...pt, subtopics: subList }));

      const subIds = subList.map(s => s.id);
      if (subIds.length) {
        const { count } = await supabase.from('practice_questions')
          .select('id', { count: 'exact', head: true })
          .in('subtopic_id', subIds).eq('category', 'extended');
        setTopicCounts(prev => ({ ...prev, [t.id]: count ?? 0 }));
      } else {
        setTopicCounts(prev => ({ ...prev, [t.id]: 0 }));
      }
    }
  };

  const addLog = (topicId, entry) =>
    setTopicLogs(prev => ({ ...prev, [topicId]: [...(prev[topicId] || []), entry] }));

  const generateForTopic = async (topic) => {
    if (generating[topic.id]) return;
    setGenerating(g => ({ ...g, [topic.id]: true }));
    setTopicLogs(prev => ({ ...prev, [topic.id]: [] }));
    setExpandedTopic(topic.id);

    const session = (await supabase.auth.getSession()).data.session;
    const token   = session?.access_token ?? SUPABASE_ANON_KEY;
    // questionsCount = per subtopic (not total)
    const subs   = topic.subtopics || [];
    const perSub = questionsCount;  // each subtopic gets this many questions
    let totalNew = 0;

    for (let i = 0; i < subs.length; i++) {
      const sub  = subs[i];
      const prog = `[${i+1}/${subs.length}]`;
      addLog(topic.id, { type: 'info', msg: `${prog} ⏳ ${sub.name}…` });
      try {
        const res  = await fetch(`${SUPABASE_URL}/functions/v1/generate-practice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ subtopic_id: sub.id, count: perSub }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
        if (json.skipped) {
          addLog(topic.id, { type: 'skip', msg: `${prog} ⏭ ${sub.name} — already has ${json.existing} Qs` });
        } else {
          totalNew += json.inserted || 0;
          addLog(topic.id, { type: 'ok', msg: `${prog} ✅ ${sub.name} +${json.inserted} questions` });
        }
      } catch (e) {
        addLog(topic.id, { type: 'error', msg: `${prog} ❌ ${sub.name} — ${e.message}` });
      }
      if (i < subs.length - 1) await new Promise(r => setTimeout(r, 800));
    }

    addLog(topic.id, { type: 'done', msg: `\n🎉 Done! +${totalNew} new questions added.` });
    setGenerating(g => ({ ...g, [topic.id]: false }));

    // Refresh count for this topic
    const subIds = (topic.subtopics || []).map(s => s.id);
    const { count: newCount } = await supabase.from('practice_questions')
      .select('id', { count: 'exact', head: true })
      .in('subtopic_id', subIds).eq('category', 'extended');
    setTopicCounts(c => ({ ...c, [topic.id]: newCount ?? 0 }));
  };

  const deleteTopicQuestions = async (topic) => {
    if (!confirm(`Delete ALL practice questions for "${topic.name}"? This cannot be undone.`)) return;
    const subIds = (topic.subtopics || []).map(s => s.id);
    await supabase.from('practice_questions').delete()
      .in('subtopic_id', subIds).eq('category', 'extended');
    setTopicCounts(c => ({ ...c, [topic.id]: 0 }));
    setTopicLogs(prev => ({ ...prev, [topic.id]: [{ type: 'info', msg: 'All questions deleted.' }] }));
  };

  const colorMap = { ok: '#2a9d78', error: '#e74c3c', skip: '#999', info: '#2C3E50', done: '#FF6B35' };
  const totalQs = Object.values(topicCounts).reduce((a, c) => a + c, 0);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Review Modal ── */}
      {reviewTopic && (
        <PracticeReviewModal topic={reviewTopic} onClose={() => setReviewTopic(null)} />
      )}

      {/* ── Left sidebar: class picker ── */}
      <div style={{ width: 220, borderRight: '1px solid #E8E8EE', overflowY: 'auto', padding: '20px 14px', flexShrink: 0, background: '#FAFAF8' }}>
        <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 16, color: C.navy, marginBottom: 16, paddingLeft: 4 }}>
          🎯 Practice Qs
        </div>
        {learningPaths.map(lp => (
          <div key={lp.id} onClick={() => loadTopics(lp)} style={{
            padding: '9px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 5,
            background: selectedLp?.id === lp.id ? `${C.purple}18` : 'transparent',
            border: `1.5px solid ${selectedLp?.id === lp.id ? C.purple : 'transparent'}`,
            fontWeight: 700, fontSize: 13, color: selectedLp?.id === lp.id ? C.purple : C.navy,
            transition: 'all 0.15s',
          }}>
            {lp.icon || '📚'} {lp.name}
            <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>{lp.grade}</span>
          </div>
        ))}
      </div>

      {/* ── Main panel ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {!selectedLp ? (
          <div style={{ textAlign: 'center', paddingTop: 100, color: C.muted }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: C.navy, marginBottom: 8 }}>Generate Practice Questions</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Select a class from the left to get started</div>
          </div>
        ) : loadingTopics ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 14 }} />)}
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 26, color: C.navy, margin: 0 }}>
                  {selectedLp.icon} {selectedLp.name}
                </h1>
                <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginTop: 4 }}>
                  {topics.length} topics · {totalQs > 0 ? <span style={{ color: '#2a9d78', fontWeight: 800 }}>{totalQs} questions generated</span> : 'No questions yet'}
                </div>
              </div>
              {/* Count picker */}
              <div style={{ background: '#fff', border: '1.5px solid #E8E8EE', borderRadius: 14, padding: '10px 16px' }}>
                <div style={{ fontWeight: 800, fontSize: 11, color: C.muted, letterSpacing: '0.08em', marginBottom: 8 }}>QUESTIONS PER SUBTOPIC</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[20, 30, 40, 50].map(n => (
                    <div key={n} onClick={() => setQuestionsCount(n)} style={{
                      padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                      fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 15,
                      background: questionsCount === n ? C.purple : '#F5F2EC',
                      color: questionsCount === n ? '#fff' : C.muted,
                      transition: 'all 0.15s',
                    }}>{n}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Topic list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topics.map(topic => {
                const isRunning  = !!generating[topic.id];
                const isExpanded = expandedTopic === topic.id;
                const count      = topicCounts[topic.id] ?? 0;
                const logs       = topicLogs[topic.id] || [];
                const hasQs      = count > 0;

                return (
                  <div key={topic.id} style={{
                    background: '#fff', borderRadius: 16,
                    border: `1.5px solid ${isRunning ? C.purple : isExpanded ? '#E0DBFF' : '#E8E8EE'}`,
                    overflow: 'hidden', transition: 'border-color 0.2s',
                    boxShadow: isRunning ? `0 0 0 3px ${C.purple}22` : 'none',
                  }}>
                    {/* Topic row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer' }}
                      onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}>
                      <span style={{ fontSize: 26, flexShrink: 0 }}>{topic.icon || '📖'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 15, color: C.navy }}>{topic.name}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: C.muted }}>{(topic.subtopics || []).length} subtopics</span>
                          {hasQs
                            ? <span style={{ color: '#2a9d78', fontWeight: 800 }}>✅ {count} questions</span>
                            : <span style={{ color: C.fire }}>No questions yet</span>
                          }
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        {hasQs && (
                          <button onClick={() => setReviewTopic(topic)} style={{
                            background: '#EEF4FF', border: '1.5px solid #C7D9FF',
                            borderRadius: 8, padding: '7px 14px',
                            fontWeight: 700, fontSize: 12, cursor: 'pointer', color: '#4B7CF6',
                          }}>👁 Review</button>
                        )}
                        <button onClick={() => generateForTopic(topic)} disabled={isRunning} style={{
                          background: isRunning ? '#f0f0f0' : hasQs ? '#fff' : C.purple,
                          border: `1.5px solid ${hasQs ? C.purple : 'transparent'}`,
                          color: isRunning ? C.muted : hasQs ? C.purple : '#fff',
                          borderRadius: 8, padding: '7px 16px',
                          fontWeight: 700, fontSize: 12,
                          cursor: isRunning ? 'wait' : 'pointer',
                          transition: 'all 0.15s',
                        }}>
                          {isRunning ? '⏳ Generating…' : hasQs ? '➕ Add More' : `⚡ Generate ${questionsCount}/subtopic`}
                        </button>
                        {hasQs && !isRunning && (
                          <button onClick={() => deleteTopicQuestions(topic)} style={{
                            background: '#FFF5F5', border: '1.5px solid #FFD0D0',
                            borderRadius: 8, padding: '7px 10px',
                            fontWeight: 700, fontSize: 12, cursor: 'pointer', color: '#E74C3C',
                          }}>🗑️</button>
                        )}
                      </div>

                      <span style={{
                        fontSize: 18, color: C.muted, flexShrink: 0,
                        transform: isExpanded ? 'rotate(90deg)' : 'none',
                        transition: 'transform 0.2s', marginLeft: 4,
                      }}>›</span>
                    </div>

                    {/* Expanded: log or subtopic list */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #F0EDE8', background: '#FAFAF8', padding: '14px 20px' }}>
                        {logs.length > 0 ? (
                          <div style={{ fontFamily: 'monospace', fontSize: 12.5, maxHeight: 220, overflowY: 'auto', lineHeight: 2 }}>
                            {logs.map((e, i) => (
                              <div key={i} style={{ color: colorMap[e.type] || C.navy, whiteSpace: 'pre-wrap' }}>{e.msg}</div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {(topic.subtopics || []).map(s => (
                              <div key={s.id} style={{ fontSize: 13, fontWeight: 600, color: C.muted, padding: '3px 0', borderBottom: '1px dashed #E8E8EE' }}>
                                🎯 {s.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Practice Review Modal ─────────────────────────────────────
function PracticeReviewModal({ topic, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');
  const [search,    setSearch]    = useState('');
  const [expanded,  setExpanded]  = useState(null);

  useEffect(() => {
    const subIds = (topic.subtopics || []).map(s => s.id);
    if (!subIds.length) { setLoading(false); return; }
    supabase.from('practice_questions')
      .select('id,question,options,answer,explanation,difficulty,source,subtopic_id')
      .in('subtopic_id', subIds).eq('category', 'extended')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setQuestions(data || []); setLoading(false); });
  }, [topic.id]);

  const deleteQ = async (id) => {
    await supabase.from('practice_questions').delete().eq('id', id);
    setQuestions(qs => qs.filter(q => q.id !== id));
  };

  const filters = ['all', 'easy', 'medium', 'hard', 'WAEC', 'NECO', 'JAMB', 'Original'];
  const filtered = questions.filter(q => {
    const f = filter.toLowerCase();
    if (f === 'all') return true;
    if (f === 'easy' || f === 'medium' || f === 'hard') return q.difficulty === f;
    return (q.source || 'Original').toLowerCase().includes(f);
  }).filter(q => !search || q.question.toLowerCase().includes(search.toLowerCase()));

  const sourceLabel = (src) => {
    if (!src || src === 'Original') return { text: 'AI', color: '#6B7280', bg: '#F3F4F6' };
    if (src.includes('WAEC')) return { text: src, color: '#6C63FF', bg: '#EEF' };
    if (src.includes('NECO')) return { text: src, color: '#0891B2', bg: '#E0F2FE' };
    if (src.includes('JAMB')) return { text: src, color: '#D97706', bg: '#FEF3C7' };
    return { text: src, color: '#6B7280', bg: '#F3F4F6' };
  };
  const diffColor = { easy: '#2a9d78', medium: '#D97706', hard: '#E74C3C' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 780, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>

        {/* Modal header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #F0EDE8', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 20, color: C.navy }}>{topic.icon} {topic.name}</div>
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{questions.length} questions · {filtered.length} shown</div>
          </div>
          <button onClick={onClose} style={{ background: '#F5F2EC', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 18, color: C.muted }}>✕</button>
        </div>

        {/* Filter bar */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #F0EDE8', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0, background: '#FAFAF8' }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 14px', borderRadius: 20, cursor: 'pointer', fontWeight: 700, fontSize: 12,
              border: `1.5px solid ${filter === f ? C.purple : '#E8E8EE'}`,
              background: filter === f ? C.purple : '#fff',
              color: filter === f ? '#fff' : C.muted, transition: 'all 0.15s',
            }}>{f}</button>
          ))}
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search questions…"
            style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 10, border: '1.5px solid #E8E8EE', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 200 }}
          />
        </div>

        {/* Questions list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading ? (
            [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 8 }} />)
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontWeight: 600 }}>No questions match this filter</div>
          ) : (
            filtered.map((q, qi) => {
              const opts   = Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]');
              const src    = sourceLabel(q.source);
              const isOpen = expanded === q.id;
              return (
                <div key={q.id} style={{ marginBottom: 8, border: '1.5px solid #E8E8EE', borderRadius: 12, overflow: 'hidden', background: isOpen ? '#FAFAF8' : '#fff' }}>
                  {/* Question row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
                    onClick={() => setExpanded(isOpen ? null : q.id)}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: C.muted, minWidth: 24, paddingTop: 2 }}>Q{qi+1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, lineHeight: 1.5 }}>{q.question}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: src.bg, color: src.color }}>{src.text}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${diffColor[q.difficulty] || '#999'}18`, color: diffColor[q.difficulty] || '#999' }}>{q.difficulty}</span>
                      <span style={{ fontSize: 14, color: C.muted }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {/* Expanded options + explanation */}
                  {isOpen && (
                    <div style={{ padding: '0 16px 14px 52px', borderTop: '1px solid #F0EDE8' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10, marginBottom: 10 }}>
                        {opts.map((opt, oi) => (
                          <div key={oi} style={{
                            padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                            background: oi === q.answer ? '#D4F5EC' : '#F5F2EC',
                            border: `1.5px solid ${oi === q.answer ? '#43CFAC' : '#E8E8EE'}`,
                            color: oi === q.answer ? '#1a5c3a' : C.navy,
                          }}>
                            <span style={{ fontWeight: 800, marginRight: 6 }}>{['A','B','C','D'][oi]}.</span>{opt}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div style={{ fontSize: 13, color: '#4a6080', lineHeight: 1.65, background: '#EEF4FF', padding: '8px 12px', borderRadius: 8, marginBottom: 8 }}>
                          💡 {q.explanation}
                        </div>
                      )}
                      <button onClick={() => deleteQ(q.id)} style={{ fontSize: 12, color: '#E74C3C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0 }}>
                        🗑️ Delete this question
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}


function AdminFlaggedQuestions() {
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('flagged_questions')
      .select('id, flagged_at, reason, resolved, practice_questions(id, question, options, answer, explanation)')
      .order('flagged_at', { ascending: false })
      .then(({ data }) => { setFlagged(data || []); setLoading(false); });
  }, []);

  const resolve = async (id) => {
    await supabase.from('flagged_questions').update({ resolved: true }).eq('id', id);
    setFlagged(f => f.map(q => q.id === id ? { ...q, resolved: true } : q));
  };

  const dismiss = async (id) => {
    await supabase.from('flagged_questions').delete().eq('id', id);
    setFlagged(f => f.filter(q => q.id !== id));
  };

  const pending = flagged.filter(f => !f.resolved);
  const resolved = flagged.filter(f => f.resolved);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 32, color: C.navy, marginBottom: 4 }}>Flagged Questions</h1>
      <p style={{ color: C.muted, fontWeight: 600, marginBottom: 24 }}>Questions students reported as incorrect. {pending.length} pending review.</p>
      {loading ? (
        [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16, marginBottom: 12 }} />)
      ) : flagged.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🚩</div>
          <div style={{ fontWeight: 700 }}>No flagged questions — great job!</div>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <>
              <div style={{ fontWeight: 800, fontSize: 13, color: C.rose, letterSpacing: 0.8, marginBottom: 12 }}>PENDING REVIEW ({pending.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                {pending.map(f => {
                  const q = f.practice_questions;
                  const opts = q ? (Array.isArray(q.options) ? q.options : JSON.parse(q.options || "[]")) : [];
                  return (
                    <div key={f.id} className="card" style={{ padding: 20, border: `2px solid ${C.rose}33` }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.navy, marginBottom: 10 }}>{q?.question || "Question unavailable"}</div>
                      {opts.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                          {opts.map((opt, i) => (
                            <div key={i} style={{
                              padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                              background: i === q?.answer ? `${C.mint}22` : "#F0EDE8",
                              border: `1.5px solid ${i === q?.answer ? C.mint : C.border}`,
                              color: i === q?.answer ? "#1a5c3a" : C.navy,
                            }}>{String.fromCharCode(65+i)}: {opt}</div>
                          ))}
                        </div>
                      )}
                      {q?.explanation && <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 10 }}>Explanation: {q.explanation}</div>}
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 12 }}>
                        🚩 Flagged: {new Date(f.flagged_at).toLocaleString()} · Reason: {f.reason}
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <Btn onClick={() => resolve(f.id)} color={C.mint} size="sm">✓ Mark Resolved</Btn>
                        <Btn onClick={() => dismiss(f.id)} outline color={C.rose} size="sm">Dismiss</Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {resolved.length > 0 && (
            <>
              <div style={{ fontWeight: 800, fontSize: 13, color: C.mint, letterSpacing: 0.8, marginBottom: 12 }}>RESOLVED ({resolved.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {resolved.map(f => (
                  <div key={f.id} className="card" style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, opacity: 0.7 }}>
                    <span style={{ fontSize: 20 }}>✅</span>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.navy }}>{f.practice_questions?.question?.slice(0, 100)}…</div>
                    <Btn onClick={() => dismiss(f.id)} outline color={C.muted} size="sm">Remove</Btn>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}