// src/components/admin/CurriculumUploader.jsx
// ============================================================
// Curriculum upload — JSON → topics + subtopics → DB
//
// FIX: avoids upsert onConflict issues by doing explicit
//      SELECT → INSERT or UPDATE per row. This works regardless
//      of whether unique constraints exist on slug columns.
// ============================================================

import { useState } from "react";
import { C } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useLearningPaths } from '../../hooks/useData';
import Btn from '../ui/Btn';
import Pill from '../ui/Pill';

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled';
}

// Safe upsert: SELECT existing → UPDATE if found, INSERT if not
async function safeUpsertTopic(learningPathId, topicData, sortOrder) {
  const slug = slugify(topicData.name);

  // Try to find existing topic with same name for this LP
  const { data: existing } = await supabase
    .from('topics')
    .select('id')
    .eq('learning_path_id', learningPathId)
    .eq('name', topicData.name)
    .maybeSingle();

  if (existing?.id) {
    // Update existing
    await supabase.from('topics').update({
      icon:        topicData.icon        || null,
      description: topicData.description || null,
      sort_order:  sortOrder,
      is_active:   true,
      slug,
    }).eq('id', existing.id);
    return existing.id;
  }

  const { data: inserted, error } = await supabase
    .from('topics')
    .insert({
      learning_path_id: learningPathId,
      name:         topicData.name,
      slug,
      icon:         topicData.icon        || null,
      description:  topicData.description || null,
      sort_order:   sortOrder,
      is_active:    true,
      ai_generated: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Topic insert error:', error.message);
    throw new Error(`Topic "${topicData.name}": ${error.message}`);
  }
  return inserted.id;
}

async function safeUpsertSubtopic(topicId, subName, sortOrder) {
  const slug = slugify(subName);

  // Check if already exists
  const { data: existing } = await supabase
    .from('subtopics')
    .select('id')
    .eq('topic_id', topicId)
    .eq('name', subName)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from('subtopics').update({ sort_order: sortOrder }).eq('id', existing.id);
    return existing.id;
  }

  const { data: inserted, error } = await supabase
    .from('subtopics')
    .insert({ topic_id: topicId, name: subName, slug, sort_order: sortOrder })
    .select('id')
    .single();

  if (error) {
    console.error('Subtopic insert error:', error.message);
    throw new Error(error.message);
  }
  return inserted.id;
}

export default function CurriculumUploader() {
  const { data: learningPaths, loading: lpLoading } = useLearningPaths();
  const [selectedLp, setSelectedLp] = useState(null);
  const [jsonText,   setJsonText]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const [progress,   setProgress]   = useState('');   // live progress text
  const [result,     setResult]     = useState(null);
  const [saveError,  setSaveError]  = useState(null);

  const handleUpload = async () => {
    if (!selectedLp || !jsonText.trim()) return;
    setSaving(true);
    setSaveError(null);
    setResult(null);
    setProgress('');

    try {
      // ── 1. Parse ─────────────────────────────────────────────
      let parsed;
      try {
        parsed = JSON.parse(jsonText.trim());
      } catch (e) {
        throw new Error('Invalid JSON — check your syntax: ' + e.message);
      }
      if (!Array.isArray(parsed) || !parsed.length) {
        throw new Error('JSON must be a non-empty array of topic objects');
      }

      // ── 2. Normalise + validate ───────────────────────────────
      // Accept: name | topic | title as the topic name key
      // Accept: subtopics | lessons | items | children as the subtopics key
      const normalised = parsed.map((item, i) => {
        const topicName = item.name || item.topic || item.title || item.topicName || item.topicTitle;
        if (!topicName) {
          const keys = Object.keys(item).join(', ');
          throw new Error('Item ' + (i + 1) + ' has no name field. Found keys: ' + keys + '. Add a "name" key.');
        }
        const subs = item.subtopics || item.objectives || item.lessons || item.items || item.children || [];
        if (!Array.isArray(subs) || !subs.length) {
          throw new Error('Topic "' + topicName + '" has no subtopics array. Add a "subtopics" key.');
        }
        return { ...item, name: topicName, subtopics: subs };
      });

      // ── 3. Insert topic-by-topic ──────────────────────────────
      let topicsOk = 0, subtopicsOk = 0;
      const warnings = [];

      for (let ti = 0; ti < normalised.length; ti++) {
        const topicData = normalised[ti];
        setProgress(`Saving topic ${ti + 1}/${normalised.length}: ${topicData.name}…`);

        let topicId;
        try {
          topicId = await safeUpsertTopic(selectedLp.id, topicData, ti);
          topicsOk++;
        } catch (e) {
          warnings.push(e.message);
          continue;
        }

        for (let si = 0; si < topicData.subtopics.length; si++) {
          const raw = topicData.subtopics[si];
          const subName = typeof raw === 'string' ? raw : (raw?.name || raw?.title);
          if (!subName?.trim()) continue;
          setProgress(`  └ subtopic ${si + 1}/${topicData.subtopics.length}: ${subName}`);
          try {
            await safeUpsertSubtopic(topicId, subName.trim(), si);
            subtopicsOk++;
          } catch (e) {
            const msg = `"${subName}" in "${topicData.name}": ${e.message}`;
            warnings.push(msg);
            console.error('Subtopic insert failed:', msg);
          }
        }
      }

      if (topicsOk === 0) {
        throw new Error('Nothing was saved. Errors:\n' + warnings.join('\n'));
      }

      // ── 4. Save reference JSON + mark has_curriculum ─────────
      setProgress('Finalising…');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('curriculum_files').delete().eq('learning_path_id', selectedLp.id);
        await supabase.from('curriculum_files').insert({
          learning_path_id: selectedLp.id,
          raw_text:     jsonText.trim(),
          file_type:    'json',
          original_name:`${slugify(selectedLp.name || selectedLp.grade)}-curriculum.json`,
          uploaded_by:  user?.id ?? null,
          processed:    true,
        });
      } catch (_) { /* non-critical */ }

      await supabase.from('learning_paths').update({ has_curriculum: true }).eq('id', selectedLp.id);
      setSelectedLp(prev => ({ ...prev, has_curriculum: true }));

      setProgress('');
      setJsonText('');
      setResult({ topics: topicsOk, subtopics: subtopicsOk, warnings });

    } catch (err) {
      setProgress('');
      setSaveError(err.message);
    }
    setSaving(false);
  };

  const EXAMPLE = JSON.stringify([
    {
      name: "Algebra",
      icon: "🔢",
      description: "Equations, expressions and identities",
      subtopics: [
        "Introduction to Algebra",
        "Collecting Like Terms",
        "Expanding Brackets",
        "Factorisation",
        "Solving Linear Equations",
        "Quadratic Equations"
      ]
    },
    {
      name: "Geometry",
      icon: "📐",
      subtopics: [
        "Types of Angles",
        "Angles on Parallel Lines",
        "Properties of Triangles",
        "Circle Theorems"
      ]
    }
  ], null, 2);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 32, color: C.navy, marginBottom: 4 }}>
          Curriculum Upload
        </h1>
        <p style={{ color: C.muted, fontWeight: 600 }}>
          Upload topics and subtopics as JSON. Saved exactly as written — AI only generates lesson content, not the structure.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>

        {/* Class list */}
        <div>
          <div style={{ fontWeight: 800, fontSize: 13, color: C.muted, letterSpacing: 0.8, marginBottom: 12 }}>
            SELECT CLASS / EXAM
          </div>
          {lpLoading ? (
            <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(learningPaths || []).map(lp => (
                <div key={lp.id}
                  onClick={() => { setSelectedLp(lp); setResult(null); setSaveError(null); setProgress(''); }}
                  style={{
                    padding: "12px 16px", borderRadius: 14, cursor: "pointer",
                    border: `2px solid ${selectedLp?.id === lp.id ? C.fire : C.border}`,
                    background: selectedLp?.id === lp.id ? `${C.fire}10` : "#fff",
                    display: "flex", alignItems: "center", gap: 10,
                    transition: "all 0.18s",
                  }}>
                  <span style={{ fontSize: 20 }}>{lp.icon || "📚"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: C.navy }}>{lp.name}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{lp.mode} · {lp.grade}</div>
                  </div>
                  {lp.has_curriculum && <span title="Curriculum uploaded">✅</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload form */}
        <div>
          {!selectedLp ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontWeight: 600, fontSize: 15 }}>
              ← Select a class to upload curriculum
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 20, color: C.navy }}>
                  {selectedLp.icon} {selectedLp.name}
                </div>
                {selectedLp.has_curriculum && <Pill color={C.mint}>Curriculum uploaded ✓</Pill>}
              </div>

              <div style={{
                background: `${C.sky}12`, border: `1.5px solid ${C.sky}33`,
                borderRadius: 12, padding: "12px 16px", marginBottom: 14,
                fontSize: 13, fontWeight: 600, color: '#1565C0', lineHeight: 1.7,
              }}>
                <strong>JSON format:</strong> Array of topics. Each needs a <code style={{ background: '#E3F2FD', padding: '1px 5px', borderRadius: 4 }}>name</code> and <code style={{ background: '#E3F2FD', padding: '1px 5px', borderRadius: 4 }}>subtopics</code> array (strings or objects with a name key). Optional: <code style={{ background: '#E3F2FD', padding: '1px 5px', borderRadius: 4 }}>icon</code>, <code style={{ background: '#E3F2FD', padding: '1px 5px', borderRadius: 4 }}>description</code>.
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

              <textarea
                value={jsonText}
                onChange={e => { setJsonText(e.target.value); setSaveError(null); setResult(null); }}
                placeholder={'[{"name":"Algebra","icon":"🔢","subtopics":["Linear Equations","Quadratic Equations"]}]'}
                rows={16}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 16, resize: "vertical",
                  border: `2px solid ${saveError ? C.rose : C.border}`,
                  fontSize: 13, fontWeight: 500, color: C.navy,
                  background: "#FAFAF8", fontFamily: "monospace",
                  lineHeight: 1.8, boxSizing: 'border-box',
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
                <div style={{ marginTop: 10, padding: "14px 18px", borderRadius: 12, background: result.subtopics === 0 ? `${C.rose}12` : `${C.mint}12`, border: `1.5px solid ${result.subtopics === 0 ? C.rose : C.mint}44`, fontSize: 14, fontWeight: 700, lineHeight: 1.8, color: result.subtopics === 0 ? C.rose : '#1a5c3a' }}>
                  {result.subtopics === 0
                    ? `⚠️ ${result.topics} topic${result.topics !== 1 ? 's' : ''} saved but 0 subtopics — see errors below.`
                    : `✅ ${result.topics} topic${result.topics !== 1 ? 's' : ''} and ${result.subtopics} subtopic${result.subtopics !== 1 ? 's' : ''} saved.`
                  }
                  {result.warnings.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12, color: C.rose, fontWeight: 600, background: `${C.rose}10`, padding: '8px 10px', borderRadius: 8, fontFamily: 'monospace' }}>
                      {result.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
                    </div>
                  )}
                  {result.subtopics > 0 && (
                    <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600 }}>
                      Next step → <strong>Gen Lessons</strong> tab to generate lesson content.
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <Btn onClick={handleUpload} disabled={saving || !jsonText.trim()} size="lg" style={{ flex: 1 }}>
                  {saving ? "Saving…" : "📤 Upload Curriculum"}
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
    </div>
  );
}