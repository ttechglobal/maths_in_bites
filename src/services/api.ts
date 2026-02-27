// src/services/api.ts
// ============================================================
// All data fetching. Edge Functions called with plain fetch
// to avoid SDK CORS issues.
// ============================================================

import { supabase } from '../lib/supabase';
import { SEED_TOPICS } from '../constants/curriculum';
import type {
  LearningPath, Topic, Subtopic, Lesson,
  LessonExample, PracticeQuestion, LevelName, LevelType
} from '../types';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ── Helper: call an Edge Function ────────────────────────────
async function invokeFunction(name: string, body: object): Promise<any> {
  let session = (await supabase.auth.getSession()).data.session;
  if (!session) {
    await new Promise(r => setTimeout(r, 800));
    session = (await supabase.auth.getSession()).data.session;
  }

  const token = session?.access_token ?? SUPABASE_ANON_KEY;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${name} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ── LEARNING PATHS ────────────────────────────────────────────

export async function getLearningPaths(levelType?: LevelType): Promise<LearningPath[]> {
  let query = supabase
    .from('learning_paths')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (levelType) query = query.eq('level_type', levelType);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getLearningPathByLevel(levelName: LevelName): Promise<LearningPath | null> {
  const levelType: LevelType = ['WAEC', 'JAMB', 'NECO'].includes(levelName) ? 'exam' : 'school';

  let { data, error } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('grade', levelName)
    .eq('mode', levelType)
    .eq('is_active', true)
    .maybeSingle();

  if (!data) {
    const res = await supabase
      .from('learning_paths')
      .select('*')
      .eq('level_name', levelName)
      .eq('level_type', levelType)
      .eq('is_active', true)
      .maybeSingle();
    data = res.data;
    error = res.error;
  }

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

// ── TOPICS ────────────────────────────────────────────────────

export async function getTopics(learningPathId: string): Promise<Topic[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('learning_path_id', learningPathId)
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function checkHasCurriculum(learningPathId: string): Promise<boolean> {
  const { data } = await supabase
    .from('learning_paths')
    .select('has_curriculum')
    .eq('id', learningPathId)
    .maybeSingle();
  return data?.has_curriculum || false;
}

/**
 * Seeds topics DIRECTLY from the curriculum.js constant into Supabase —
 * no AI call, no curriculum upload required.
 *
 * Called by useTopics when the DB has no topics yet for this learning path.
 * Uses upsert so it's safe to call multiple times (idempotent).
 *
 * Returns the number of rows inserted (0 = grade not in SEED_TOPICS yet).
 */
export async function seedTopicsFromCurriculum(
  learningPathId: string,
  grade: LevelName
): Promise<number> {
  const seedTopics = (SEED_TOPICS as Record<string, typeof SEED_TOPICS[keyof typeof SEED_TOPICS]>)[grade];
  if (!seedTopics || seedTopics.length === 0) return 0;

  const rows = seedTopics.map((t, i) => ({
    learning_path_id: learningPathId,
    name:             t.name,
    slug:             t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    icon:             t.icon ?? null,
    sort_order:       i,
    is_active:        true,
    ai_generated:     false,
  }));

  const { data, error } = await supabase
    .from('topics')
    .upsert(rows, { onConflict: 'learning_path_id,slug', ignoreDuplicates: true })
    .select('id');

  if (error) throw error;
  return (data || []).length;
}

// ── SUBTOPICS ─────────────────────────────────────────────────

export async function getSubtopics(topicId: string): Promise<Subtopic[]> {
  const { data, error } = await supabase
    .from('subtopics')
    .select('*')
    .eq('topic_id', topicId)
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

/**
 * Triggers AI subtopic generation, enriched with curriculum hints.
 *
 * Passes `hint_subtopics` (the original curriculum subtopics for this topic)
 * so the AI can use them as a pedagogical scaffold — expanding and sequencing
 * them into proper, bite-sized, progressive learning steps rather than
 * generating from the topic name alone.
 *
 * The edge function prompt should:
 *   1. Accept the topic name + hint_subtopics
 *   2. Break these into granular, progressive bite-sized subtopics
 *      (e.g. "Quadratic Equations" → "What is a Quadratic?", "Factorisation Method",
 *       "Completing the Square", "Quadratic Formula", "Word Problems", etc.)
 *   3. Return JSON array of { name, sort_order }
 */
export async function triggerGenerateSubtopics(
  topicId: string,
  grade?: LevelName,
  topicName?: string
): Promise<void> {
  // Find matching curriculum entry to pass as AI context
  let hintSubtopics: string[] = [];
  if (grade && topicName) {
    const seedTopics =
      (SEED_TOPICS as Record<string, typeof SEED_TOPICS[keyof typeof SEED_TOPICS]>)[grade] ?? [];
    const match = seedTopics.find(
      t => t.name.toLowerCase() === topicName.toLowerCase()
    );
    if (match) {
      hintSubtopics = match.subtopics.map((s: { name: string }) => s.name);
    }
  }

  await invokeFunction('generate-subtopics', {
    topic_id:       topicId,
    hint_subtopics: hintSubtopics,  // AI uses these as seeds for better subtopics
    bite_sized:     true,           // instruct edge fn to prefer granular steps
  });
}

// ── LESSONS ───────────────────────────────────────────────────

export async function getLesson(subtopicId: string): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('subtopic_id', subtopicId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getLessonExamples(lessonId: string): Promise<LessonExample[]> {
  const { data, error } = await supabase
    .from('lesson_examples')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('sort_order');
  if (error) throw error;
  return (data || []).map(ex => ({
    ...ex,
    steps: typeof ex.steps === 'string' ? JSON.parse(ex.steps) : ex.steps,
  }));
}

export async function getLessonQuestions(
  lessonId: string,
  category: 'lesson' | 'extended' = 'lesson'
): Promise<PracticeQuestion[]> {
  const { data, error } = await supabase
    .from('practice_questions')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('category', category)
    .order('sort_order');
  if (error) throw error;
  return (data || []).map(q => ({
    ...q,
    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
  }));
}

export async function triggerGenerateLesson(subtopicId: string): Promise<void> {
  await invokeFunction('generate-lesson', { subtopic_id: subtopicId });
}

// ── PROGRESS ──────────────────────────────────────────────────

export async function saveProgress(
  userId: string,
  subtopicId: string,
  score: number,
  xpEarned: number
): Promise<void> {
  const { error } = await supabase.from('user_progress').upsert(
    {
      user_id:      userId,
      subtopic_id:  subtopicId,
      completed:    true,
      score,
      xp_earned:    xpEarned,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,subtopic_id' }
  );
  if (error) throw error;
  await supabase.rpc('increment_xp', { user_id_input: userId, xp_input: xpEarned });
}

export async function getCompletedSubtopicIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_progress')
    .select('subtopic_id')
    .eq('user_id', userId)
    .eq('completed', true);
  return (data || []).map(r => r.subtopic_id);
}
