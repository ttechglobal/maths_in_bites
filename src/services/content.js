// src/services/content.js
// ============================================================
// Single source of truth for all content operations.
// Clean, no duplication, no confusion.
//
// ARCHITECTURE:
//   Topics    → seeded directly from curriculum constant (no AI needed)
//   Subtopics → AI-generated from topic + curriculum hints
//               The AI takes the curriculum's raw subtopics/objectives
//               and breaks them into proper bite-sized learning steps.
//   Lessons   → AI-generated per subtopic
//   Questions → AI-generated with the lesson
// ============================================================

import { supabase } from '../lib/supabase';
import { CURRICULUM } from '../constants/curriculum';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Edge function caller ──────────────────────────────────────
// Uses fetch directly to avoid Supabase SDK CORS edge-case bugs.
async function callEdge(fnName, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? SUPABASE_ANON_KEY;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Edge fn "${fnName}" failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ── Learning Path ─────────────────────────────────────────────

export async function getLearningPath(grade, mode) {
  const { data, error } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('grade', grade)
    .eq('mode', mode)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLearningPaths() {
  const { data, error } = await supabase
    .from('learning_paths')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

// ── Topics ────────────────────────────────────────────────────
// Topics are seeded DIRECTLY from the curriculum constant —
// no AI needed, no edge function. Fast and deterministic.

export async function getTopics(learningPathId) {
  // Fetch topics with subtopic count embedded
  const { data, error } = await supabase
    .from('topics')
    .select('*, subtopics(id)')
    .eq('learning_path_id', learningPathId)
    .order('sort_order');
  if (error) throw error;
  // Attach subtopic_count for progress calculations
  return (data || []).map(t => ({
    ...t,
    subtopic_count: Array.isArray(t.subtopics) ? t.subtopics.length : 0,
  }));
}

// Get curriculum data for a given grade (used for seeding + AI hints)
export function getCurriculumTopics(grade) {
  return CURRICULUM[grade] ?? [];
}

// Seed topics from the curriculum constant into Supabase.
// Safe to call multiple times (uses upsert + ignoreDuplicates).
// Returns number of rows inserted.
export async function seedTopicsFromCurriculum(learningPathId, grade) {
  const curriculumTopics = getCurriculumTopics(grade);
  if (!curriculumTopics.length) return 0;

  const rows = curriculumTopics.map((t, i) => ({
    learning_path_id: learningPathId,
    name:         t.name,
    slug:         slugify(t.name),
    icon:         t.icon ?? null,
    description:  t.description ?? null,
    sort_order:   i,
    is_active:    true,
    ai_generated: false,
  }));

  const { data, error } = await supabase
    .from('topics')
    .upsert(rows, { onConflict: 'learning_path_id,slug', ignoreDuplicates: true })
    .select('id');

  if (error) throw error;
  return (data || []).length;
}

// ── Subtopics ─────────────────────────────────────────────────
// Subtopics are AI-generated.
// The AI receives the topic name + curriculum hints (the raw subtopics/objectives
// from the curriculum) and generates better, progressive, bite-sized steps.
//
// EXAMPLE:
//   Curriculum hint: ["Quadratic Equations", "Simultaneous Equations"]
//   AI output: [
//     "What is Algebra?",
//     "Understanding Variables",
//     "Solving Simple Equations",
//     "Quadratic Equations: Introduction",
//     "Factorisation Method",
//     "The Quadratic Formula",
//     "Simultaneous Equations: Substitution",
//     "Simultaneous Equations: Elimination",
//   ]

export async function getSubtopics(topicId) {
  const { data, error } = await supabase
    .from('subtopics')
    .select('*')
    .eq('topic_id', topicId)
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

// Get only AI-generated subtopics (filters out any stale seed rows)
export function filterAiSubtopics(subtopics) {
  const aiRows = subtopics.filter(s => s.ai_generated === true);
  return aiRows.length > 0 ? aiRows : [];
}

// Build the curriculum hints payload for the AI.
// Includes both subtopic names AND objectives so the AI has full context.
export function buildCurriculumHints(grade, topicName) {
  const curriculumTopics = getCurriculumTopics(grade);
  const match = curriculumTopics.find(
    t => t.name.toLowerCase() === topicName?.toLowerCase()
  );
  if (!match) return { subtopics: [], objectives: [] };

  return {
    subtopics:  (match.subtopics  || []).map(s => typeof s === 'string' ? s : s.name),
    objectives: (match.objectives || []),
  };
}

// Trigger AI subtopic generation.
// The edge function should:
//   1. Accept topic_id, topic_name, grade, curriculum_hints
//   2. Use the hints to generate 6-12 progressive, bite-sized subtopics
//   3. Store them in the subtopics table with ai_generated = true
export async function triggerSubtopicGeneration(topicId, topicName, grade) {
  const hints = buildCurriculumHints(grade, topicName);
  return callEdge('generate-subtopics', {
    topic_id:      topicId,
    topic_name:    topicName,
    grade,
    // These give the AI full context to generate BETTER subtopics
    hint_subtopics:  hints.subtopics,
    hint_objectives: hints.objectives,
    // Instruct AI to produce progressive, bite-sized, ordered steps
    strategy: 'progressive_bite_sized',
  });
}

// ── Lessons ───────────────────────────────────────────────────

export async function getLesson(subtopicId) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('subtopic_id', subtopicId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function getLessonExamples(lessonId) {
  const { data, error } = await supabase
    .from('lesson_examples')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('sort_order');
  if (error) throw error;
  return (data || []).map(ex => ({
    ...ex,
    steps: parseJsonField(ex.steps),
  }));
}

export async function getLessonQuestions(lessonId, category = 'lesson') {
  // First try by lesson_id
  const { data, error } = await supabase
    .from('practice_questions')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('category', category)
    .order('created_at');
  if (error) throw error;

  const rows = data || [];
  if (rows.length > 0) {
    return rows.map(q => ({ ...q, options: parseJsonField(q.options) }));
  }

  // Fallback: fetch the subtopic_id from the lesson, then query by subtopic_id
  // (needed when generate-practice stores questions with subtopic_id, not lesson_id)
  if (category === 'extended') {
    const { data: lesson } = await supabase
      .from('lessons').select('subtopic_id').eq('id', lessonId).single();
    if (lesson?.subtopic_id) {
      const { data: bySubtopic } = await supabase
        .from('practice_questions')
        .select('*')
        .eq('subtopic_id', lesson.subtopic_id)
        .eq('category', 'extended')
        .order('created_at');
      return (bySubtopic || []).map(q => ({ ...q, options: parseJsonField(q.options) }));
    }
  }
  return [];
}

// Trigger AI lesson generation.
// The edge function should generate:
//   - title, introduction, explanation, summary
//   - 2-3 worked examples with step-by-step solutions
//   - 3-5 lesson gate questions (category: 'lesson')
//   - 8-15 extended practice questions (category: 'extended')
export async function triggerLessonGeneration(subtopicId) {
  return callEdge('generate-lesson', { subtopic_id: subtopicId });
}

// ── Progress ──────────────────────────────────────────────────

export async function getCompletedSubtopicIds(userId) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('subtopic_id')
    .eq('user_id', userId);
  if (error) console.error('[getCompletedSubtopicIds]', error);
  return (data || []).map(r => r.subtopic_id);
}

export async function saveProgress(userId, subtopicId, score, xpEarned) {
  // Upsert progress record — omit 'completed' column (not in new schema)
  const { error } = await supabase.from('user_progress').upsert({
    user_id:     userId,
    subtopic_id: subtopicId,
    score:       score       || 0,
    xp_earned:   xpEarned   || 0,
  }, { onConflict: 'user_id,subtopic_id' });

  if (error) {
    console.error('[saveProgress] upsert error:', error);
    // Don't throw — still try to update XP
  }

  // Update XP on profile — try RPC first, fallback to manual update
  try {
    const rpcRes = await supabase.rpc('increment_xp', {
      user_id_input: userId,
      xp_input:      xpEarned || 0,
    });
    if (rpcRes.error) throw rpcRes.error;
  } catch {
    // Fallback: fetch current XP and increment manually
    const { data: profileData } = await supabase
      .from('user_profiles').select('total_xp').eq('id', userId).single();
    const currentXP = profileData?.total_xp || 0;
    await supabase.from('user_profiles')
      .update({ total_xp: currentXP + (xpEarned || 0) })
      .eq('id', userId);
  }
}

// ── Flagged questions ─────────────────────────────────────────

export async function flagQuestion(questionId) {
  await supabase.from('flagged_questions').upsert({
    question_id: questionId,
    flagged_at:  new Date().toISOString(),
    reason:      'user_reported_incorrect',
  }, { onConflict: 'question_id' });
}

// ── Utilities ─────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function parseJsonField(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

// Get all practice questions for a subtopic (for the Practice page)
export async function getPracticeQuestions(subtopicId) {
  const { data, error } = await supabase
    .from('practice_questions')
    .select('*')
    .eq('subtopic_id', subtopicId)
    .order('created_at');
  if (error) throw error;
  return (data || []).map(q => ({
    ...q,
    options: parseJsonField(q.options),
  }));
}