// src/components/admin/SchoolCurriculumUploader.jsx
// ============================================================
// SCHOOL curriculum upload (JSS1–SS3) — SEPARATE from exam uploader
//
// JSON format:
// {
//   "classId": "JSS1",
//   "terms": {
//     "first_term":  { "topics": { "number_base": { "topicName": "Number Base", "subtopics": ["..."] } } },
//     "second_term": { "topics": { ... } },
//     "third_term":  { "topics": { ... } }
//   }
// }
//
// Topics are stored with term = 'first_term' | 'second_term' | 'third_term'
// This lets the student UI group by term automatically.
// ============================================================

import { useState } from "react";
import { C } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useLearningPaths } from '../../hooks/useData';
import Btn from '../ui/Btn';
import Pill from '../ui/Pill';

const SCHOOL_GRADES = ['JS1', 'JS2', 'JS3', 'SS1', 'SS2', 'SS3'];

const TERM_ORDER  = ['first_term', 'second_term', 'third_term'];
const TERM_LABELS = { first_term: '1st Term', second_term: '2nd Term', third_term: '3rd Term' };
const TERM_COLORS = { first_term: '#FF6B35', second_term: '#4A90D9', third_term: '#43CFAC' };

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled';
}

// ── DB helpers (same pattern as exam uploader) ────────────────
async function safeUpsertTopic(learningPathId, name, icon, description, sortOrder, term) {
  const slug = slugify(name);
  const { data: existing } = await supabase
    .from('topics').select('id')
    .eq('learning_path_id', learningPathId)
    .eq('name', name)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from('topics').update({
      icon: icon || null, description: description || null,
      sort_order: sortOrder, is_active: true, slug, term,
    }).eq('id', existing.id);
    return existing.id;
  }

  const { data: inserted, error } = await supabase
    .from('topics').insert({
      learning_path_id: learningPathId,
      name, slug,
      icon: icon || null,
      description: description || null,
      sort_order: sortOrder,
      is_active: true,
      ai_generated: false,
      term,
    }).select('id').single();

  if (error) throw new Error(`Topic "${name}": ${error.message}`);
  return inserted.id;
}

async function safeUpsertSubtopic(topicId, subName, sortOrder) {
  const slug = slugify(subName);
  const { data: existing } = await supabase
    .from('subtopics').select('id')
    .eq('topic_id', topicId).eq('name', subName).maybeSingle();

  if (existing?.id) {
    await supabase.from('subtopics').update({ sort_order: sortOrder }).eq('id', existing.id);
    return existing.id;
  }

  const { data: inserted, error } = await supabase
    .from('subtopics').insert({ topic_id: topicId, name: subName, slug, sort_order: sortOrder })
    .select('id').single();

  if (error) throw new Error(error.message);
  return inserted.id;
}

// ── Example JSON ──────────────────────────────────────────────
const EXAMPLE = JSON.stringify({
  classId: "JSS1",
  terms: {
    first_term: {
      topics: {
        number_base: {
          topicName: "Number Base",
          subtopics: [
            "Meaning of Number Base",
            "Convert Base 10 to Base 2",
            "Convert Base 2 to Base 10"
          ]
        },
        fractions: {
          topicName: "Fractions",
          subtopics: [
            "Types of Fractions",
            "Converting Between Fractions and Decimals"
          ]
        }
      }
    },
    second_term: {
      topics: {
        algebra: {
          topicName: "Algebra",
          subtopics: [
            "Introduction to Algebra",
            "Collecting Like Terms",
            "Expanding Brackets"
          ]
        }
      }
    },
    third_term: {
      topics: {
        geometry: {
          topicName: "Geometry",
          subtopics: [
            "Types of Angles",
            "Properties of Triangles",
            "Circle Theorems"
          ]
        }
      }
    }
  }
}, null, 2);

export default function SchoolCurriculumUploader() {
  const { data: allPaths, loading: lpLoading } = useLearningPaths();
  // Only show school learning paths here
  const learningPaths = (allPaths || []).filter(lp =>
    lp.mode === 'school' || SCHOOL_GRADES.includes(lp.grade)
  );

  const [selectedLp, setSelectedLp] = useState(null);
  const [jsonText,   setJsonText]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const [progress,   setProgress]   = useState('');
  const [result,     setResult]     = useState(null);
  const [saveError,  setSaveError]  = useState(null);

  // Live preview: parse the JSON to show a term breakdown before saving
  const preview = (() => {
    if (!jsonText.trim()) return null;
    try {
      const p = JSON.parse(jsonText.trim());
      if (!p?.terms) return null;
      return TERM_ORDER.map(t => ({
        term: t,
        count: Object.keys(p.terms[t]?.topics || {}).length,
      })).filter(x => x.count > 0);
    } catch { return null; }
  })();

  const handleUpload = async () => {
    if (!selectedLp || !jsonText.trim()) return;
    setSaving(true); setSaveError(null); setResult(null); setProgress('');

    try {
      // 1. Parse
      let parsed;
      try { parsed = JSON.parse(jsonText.trim()); }
      catch (e) { throw new Error('Invalid JSON — check your syntax: ' + e.message); }

      if (!parsed?.terms) {
        throw new Error(
          'Missing "terms" key. School curriculum must use the term-structured format.\n' +
          'Click "Load example JSON" to see the correct format.'
        );
      }

      // 2. Flatten into ordered topic list
      let topicsOk = 0, subtopicsOk = 0;
      const warnings = [];
      let globalSortIdx = 0;

      for (const termKey of TERM_ORDER) {
        const termObj = parsed.terms[termKey];
        if (!termObj?.topics) continue;

        const topicEntries = Object.values(termObj.topics);
        for (let ti = 0; ti < topicEntries.length; ti++) {
          const entry = topicEntries[ti];
          const name  = entry.topicName || entry.name;
          if (!name) { warnings.push(`Skipped unnamed topic in ${TERM_LABELS[termKey]}`); continue; }

          const subtopics = (entry.subtopics || [])
            .map(s => typeof s === 'string' ? s : s?.name || s?.title)
            .filter(Boolean);

          if (!subtopics.length) {
            warnings.push(`"${name}" (${TERM_LABELS[termKey]}) has no subtopics — skipped.`);
            continue;
          }

          const termLabel = TERM_LABELS[termKey];
          setProgress(`[${termLabel}] Saving topic ${ti + 1}/${topicEntries.length}: ${name}…`);

          let topicId;
          try {
            topicId = await safeUpsertTopic(
              selectedLp.id, name,
              entry.icon || null,
              entry.description || null,
              globalSortIdx++,
              termKey
            );
            topicsOk++;
          } catch (e) { warnings.push(e.message); continue; }

          for (let si = 0; si < subtopics.length; si++) {
            const subName = subtopics[si];
            setProgress(`  └ [${termLabel}] subtopic ${si + 1}/${subtopics.length}: ${subName}`);
            try { await safeUpsertSubtopic(topicId, subName, si); subtopicsOk++; }
            catch (e) { warnings.push(`"${subName}" in "${name}": ${e.message}`); }
          }
        }
      }

      if (topicsOk === 0) throw new Error('Nothing was saved.\n' + warnings.join('\n'));

      // 3. Mark has_curriculum
      setProgress('Finalising…');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('curriculum_files').delete().eq('learning_path_id', selectedLp.id);
        await supabase.from('curriculum_files').insert({
          learning_path_id: selectedLp.id,
          raw_text: jsonText.trim(),
          file_type: 'json',
          original_name: `${slugify(selectedLp.name || selectedLp.grade)}-school-curriculum.json`,
          uploaded_by: user?.id ?? null,
          processed: true,
        });
      } catch (_) { /* non-critical */ }

      await supabase.from('learning_paths').update({ has_curriculum: true }).eq('id', selectedLp.id);
      setSelectedLp(prev => ({ ...prev, has_curriculum: true }));
      setProgress(''); setJsonText('');
      setResult({ topics: topicsOk, subtopics: subtopicsOk, warnings });

    } catch (err) { setProgress(''); setSaveError(err.message); }
    setSaving(false);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24 }}>

      {/* ── Class selector ── */}
      <div>
        <div style={{ fontWeight: 800, fontSize: 12, color: C.muted, letterSpacing: 0.8, marginBottom: 12 }}>
          SELECT SCHOOL CLASS
        </div>
        {lpLoading ? (
          <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
        ) : learningPaths.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: C.muted, fontWeight: 600, background: '#FAFAF8', borderRadius: 14, border: `1.5px solid ${C.border}` }}>
            No school classes found in learning paths. Make sure JSS1–SS3 paths exist with mode = 'school'.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {learningPaths.map(lp => {
              const isJSS = lp.grade?.startsWith('J');
              const color = isJSS ? C.sky : C.fire;
              const sel   = selectedLp?.id === lp.id;
              return (
                <div key={lp.id}
                  onClick={() => { setSelectedLp(lp); setResult(null); setSaveError(null); setProgress(''); }}
                  style={{
                    padding: "12px 14px", borderRadius: 14, cursor: "pointer",
                    border: `2px solid ${sel ? color : C.border}`,
                    background: sel ? `${color}10` : "#fff",
                    display: "flex", alignItems: "center", gap: 10,
                    transition: "all 0.18s",
                  }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: `${color}20`, border: `1.5px solid ${color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 12, color,
                  }}>
                    {lp.grade}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: C.navy }}>{lp.name}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
                      {isJSS ? 'Junior Secondary' : 'Senior Secondary'}
                    </div>
                  </div>
                  {lp.has_curriculum && <span title="Curriculum uploaded" style={{ fontSize: 16 }}>✅</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Upload form ── */}
      <div>
        {!selectedLp ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontWeight: 600, fontSize: 15 }}>
            ← Select a class to upload curriculum
          </div>
        ) : (
          <>
            {/* Selected class header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 20, color: C.navy }}>
                  {selectedLp.name}
                </div>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
                  {selectedLp.grade?.startsWith('J') ? 'Junior Secondary School' : 'Senior Secondary School'}
                </div>
              </div>
              {selectedLp.has_curriculum && <Pill color={C.mint}>Curriculum uploaded ✓</Pill>}
            </div>

            {/* Format guide */}
            <div style={{
              background: 'linear-gradient(135deg, #FFF3EE, #FFF8F5)',
              border: `1.5px solid ${C.fire}33`,
              borderRadius: 14, padding: "14px 16px", marginBottom: 12,
              fontSize: 13, fontWeight: 600, color: '#7a3000', lineHeight: 1.8,
            }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: C.fire, marginBottom: 6 }}>
                📅 Term-structured JSON format
              </div>
              Required keys: <code style={{ background: '#FFE8DC', padding: '1px 6px', borderRadius: 4 }}>classId</code> and <code style={{ background: '#FFE8DC', padding: '1px 6px', borderRadius: 4 }}>terms</code>.
              Inside <code style={{ background: '#FFE8DC', padding: '1px 6px', borderRadius: 4 }}>terms</code>: up to 3 term keys
              (<code style={{ background: '#FFE8DC', padding: '1px 6px', borderRadius: 4 }}>first_term</code>,{' '}
              <code style={{ background: '#FFE8DC', padding: '1px 6px', borderRadius: 4 }}>second_term</code>,{' '}
              <code style={{ background: '#FFE8DC', padding: '1px 6px', borderRadius: 4 }}>third_term</code>).
              Each has a <code style={{ background: '#FFE8DC', padding: '1px 6px', borderRadius: 4 }}>topics</code> object
              where each topic has a <code style={{ background: '#FFE8DC', padding: '1px 6px', borderRadius: 4 }}>topicName</code> and <code style={{ background: '#FFE8DC', padding: '1px 6px', borderRadius: 4 }}>subtopics</code> array.
            </div>

            <button
              onClick={() => setJsonText(EXAMPLE)}
              style={{
                background: 'transparent', border: `1.5px solid ${C.border}`,
                borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 700,
                color: C.muted, cursor: 'pointer', marginBottom: 10, fontFamily: 'inherit',
              }}
            >
              📋 Load example JSON
            </button>

            {/* JSON preview — term breakdown */}
            {preview && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {preview.map(({ term, count }) => (
                  <div key={term} style={{
                    padding: '5px 12px', borderRadius: 20,
                    background: `${TERM_COLORS[term]}18`,
                    border: `1.5px solid ${TERM_COLORS[term]}44`,
                    fontSize: 12, fontWeight: 800, color: TERM_COLORS[term],
                  }}>
                    {TERM_LABELS[term]}: {count} topic{count !== 1 ? 's' : ''}
                  </div>
                ))}
              </div>
            )}

            <textarea
              value={jsonText}
              onChange={e => { setJsonText(e.target.value); setSaveError(null); setResult(null); }}
              placeholder='{"classId":"JSS1","terms":{"first_term":{"topics":{"algebra":{"topicName":"Algebra","subtopics":["Linear Equations","Quadratic Equations"]}}}}}'
              rows={18}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 16, resize: "vertical",
                border: `2px solid ${saveError ? C.rose : jsonText && !saveError ? C.fire + '66' : C.border}`,
                fontSize: 13, fontWeight: 500, color: C.navy,
                background: "#FAFAF8", fontFamily: "monospace",
                lineHeight: 1.8, boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
            />

            {/* Live progress */}
            {progress && (
              <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 12, background: `${C.sky}10`, border: `1.5px solid ${C.sky}33`, fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: 'monospace' }}>
                ⏳ {progress}
              </div>
            )}

            {/* Error */}
            {saveError && (
              <div style={{ marginTop: 10, padding: "12px 16px", borderRadius: 12, background: `${C.rose}12`, border: `1.5px solid ${C.rose}33`, fontSize: 13, fontWeight: 700, color: C.rose, whiteSpace: 'pre-wrap' }}>
                ⚠️ {saveError}
              </div>
            )}

            {/* Success */}
            {result && (
              <div style={{
                marginTop: 10, padding: "16px 18px", borderRadius: 14,
                background: result.subtopics === 0 ? `${C.rose}12` : `${C.mint}12`,
                border: `1.5px solid ${result.subtopics === 0 ? C.rose : C.mint}55`,
                fontSize: 14, fontWeight: 700, lineHeight: 1.9,
                color: result.subtopics === 0 ? C.rose : '#1a5c3a',
              }}>
                {result.subtopics === 0
                  ? `⚠️ ${result.topics} topic(s) saved but 0 subtopics — see warnings.`
                  : `✅ ${result.topics} topic(s) and ${result.subtopics} subtopic(s) saved across all terms.`
                }
                {result.warnings.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: C.rose, fontWeight: 600, background: `${C.rose}10`, padding: '8px 10px', borderRadius: 8, fontFamily: 'monospace' }}>
                    {result.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
                  </div>
                )}
                {result.subtopics > 0 && (
                  <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600 }}>
                    Next → <strong>Gen Lessons</strong> tab · filter by term · generate lesson content.
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Btn onClick={handleUpload} disabled={saving || !jsonText.trim()} size="lg" style={{ flex: 1 }}>
                {saving ? "Saving…" : "📤 Upload School Curriculum"}
              </Btn>
              {jsonText && !saving && (
                <Btn onClick={() => { setJsonText(''); setResult(null); setSaveError(null); }} outline color={C.muted} size="lg">
                  Clear
                </Btn>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
