// src/hooks/useData.js  (v2 — full AI-trigger-aware version)
// ============================================================
// All data hooks. Each one:
//   1. Fetches from Supabase cache first
//   2. Checks if curriculum exists before allowing generation
//   3. Has AI trigger stub (ready to uncomment)
//   4. Returns { data, loading, error, status } where status is:
//      'idle' | 'loading' | 'no_curriculum' | 'generating' | 'ready' | 'error'
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Helper: call an Edge Function ────────────────────────────
async function invokeFunction(name, body) {
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

// ── HOOK 1: Learning Paths ────────────────────────────────────
export function useLearningPaths(mode = null) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      let query = supabase
        .from('learning_paths')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (mode) query = query.eq('mode', mode);
      const { data: rows, error: err } = await query;
      if (!cancelled) {
        setData(rows || []);
        setError(err?.message || null);
        setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [mode]);

  return { data, loading, error };
}

// ── HOOK 2: Topics ────────────────────────────────────────────
// Status flow:
//   loading → check DB → topics exist? → 'ready'
//                      → no topics + no curriculum? → 'no_curriculum'
//                      → no topics + has curriculum? → trigger AI → 'generating' → poll → 'ready'
export function useTopics(learningPathId) {
  const [data,       setData]       = useState([]);
  const [status,     setStatus]     = useState('idle');    // 'idle'|'loading'|'no_curriculum'|'generating'|'ready'|'error'
  const [error,      setError]      = useState(null);
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const load = useCallback(async () => {
    if (!learningPathId) { setData([]); setStatus('idle'); return; }
    setStatus('loading');

    // 1. Fetch existing topics
    const { data: rows, error: err } = await supabase
      .from('topics')
      .select('*')
      .eq('learning_path_id', learningPathId)
      .eq('is_active', true)
      .order('sort_order');

    if (err) { setError(err.message); setStatus('error'); return; }

    // 2. Topics already exist — done
    if (rows && rows.length > 0) {
      setData(rows);
      setStatus('ready');
      stopPolling();
      return;
    }

    // 3. No topics — check if curriculum exists
    const { data: lpRow } = await supabase
      .from('learning_paths')
      .select('has_curriculum')
      .eq('id', learningPathId)
      .maybeSingle();

    if (!lpRow?.has_curriculum) {
      setStatus('no_curriculum');
      return;
    }

    // 4. Has curriculum but no topics → trigger AI generation
    setStatus('generating');

    // ── AI TRIGGER ─────────────────────────────────────────────
    try {
      await invokeFunction('generate-topics', { learning_path_id: learningPathId });
    } catch (e) {
      console.error('Topic generation trigger failed:', e);
    }

    // 5. Poll every 3s until topics appear
    stopPolling();
    pollRef.current = setInterval(async () => {
      const { data: polled } = await supabase
        .from('topics')
        .select('*')
        .eq('learning_path_id', learningPathId)
        .eq('is_active', true)
        .order('sort_order');
      if (polled && polled.length > 0) {
        setData(polled);
        setStatus('ready');
        stopPolling();
      }
    }, 3000);
  }, [learningPathId]);

  useEffect(() => {
    load();
    return () => stopPolling();
  }, [load]);

  return { data, status, error, loading: status === 'loading' || status === 'generating' };
}

// ── HOOK 3: Subtopics ─────────────────────────────────────────
export function useSubtopics(topicId) {
  const [data,   setData]   = useState([]);
  const [status, setStatus] = useState('idle');
  const [error,  setError]  = useState(null);
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const load = useCallback(async () => {
    if (!topicId) { setData([]); setStatus('idle'); return; }
    setStatus('loading');

    const { data: rows, error: err } = await supabase
      .from('subtopics')
      .select('*')
      .eq('topic_id', topicId)
      .eq('is_active', true)
      .order('sort_order');

    if (err) { setError(err.message); setStatus('error'); return; }

    if (rows && rows.length > 0) {
      setData(rows);
      setStatus('ready');
      stopPolling();
      return;
    }

    // No subtopics — trigger AI
    setStatus('generating');

    // ── AI TRIGGER ─────────────────────────────────────────────
    try {
      await invokeFunction('generate-subtopics', { topic_id: topicId });
    } catch (e) {
      console.error('Subtopic generation trigger failed:', e);
    }

    stopPolling();
    pollRef.current = setInterval(async () => {
      const { data: polled } = await supabase
        .from('subtopics')
        .select('*')
        .eq('topic_id', topicId)
        .eq('is_active', true)
        .order('sort_order');
      if (polled && polled.length > 0) {
        setData(polled);
        setStatus('ready');
        stopPolling();
      }
    }, 3000);
  }, [topicId]);

  useEffect(() => {
    load();
    return () => stopPolling();
  }, [load]);

  return { data, status, error, loading: status === 'loading' || status === 'generating' };
}

// ── HOOK 4: Full Lesson ───────────────────────────────────────
export function useLesson(subtopicId) {
  const [lesson,    setLesson]    = useState(null);
  const [examples,  setExamples]  = useState([]);
  const [questions, setQuestions] = useState([]);
  const [status,    setStatus]    = useState('idle');
  const [error,     setError]     = useState(null);
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const load = useCallback(async () => {
    if (!subtopicId) { setLesson(null); setStatus('idle'); return; }
    setStatus('loading');

    const { data: lessonRow, error: err } = await supabase
      .from('lessons')
      .select('*')
      .eq('subtopic_id', subtopicId)
      .maybeSingle();

    if (err) {
      setError(err.message); setStatus('error'); return;
    }

    if (lessonRow) {
      // Lesson exists — fetch examples and questions in parallel
      const [exRes, qRes] = await Promise.all([
        supabase.from('lesson_examples').select('*').eq('lesson_id', lessonRow.id).order('sort_order'),
        supabase.from('practice_questions').select('*').eq('lesson_id', lessonRow.id).eq('category', 'lesson').order('sort_order'),
      ]);
      setLesson(lessonRow);
      setExamples(exRes.data || []);
      setQuestions(qRes.data || []);
      setStatus('ready');
      stopPolling();
      return;
    }

    // No lesson yet — trigger AI generation
    setStatus('generating');

    // ── AI TRIGGER ─────────────────────────────────────────────
    try {
      await invokeFunction('generate-lesson', { subtopic_id: subtopicId });
    } catch (e) {
      console.error('Lesson generation trigger failed:', e);
    }

    // Poll until lesson appears
    stopPolling();
    pollRef.current = setInterval(async () => {
      const { data: polled } = await supabase
        .from('lessons')
        .select('*')
        .eq('subtopic_id', subtopicId)
        .maybeSingle();
      if (polled) {
        const [exRes, qRes] = await Promise.all([
          supabase.from('lesson_examples').select('*').eq('lesson_id', polled.id).order('sort_order'),
          supabase.from('practice_questions').select('*').eq('lesson_id', polled.id).eq('category', 'lesson').order('sort_order'),
        ]);
        setLesson(polled);
        setExamples(exRes.data || []);
        setQuestions(qRes.data || []);
        setStatus('ready');
        stopPolling();
      }
    }, 3000);
  }, [subtopicId]);

  useEffect(() => {
    load();
    return () => stopPolling();
  }, [load]);

  return {
    lesson, examples, questions, status, error,
    loading: status === 'loading' || status === 'generating',
    isGenerating: status === 'generating',
  };
}

// ── HOOK 5: Extended Practice Questions (lazy) ────────────────
export function useExtendedQuestions(lessonId) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!lessonId) { setData([]); return; }
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      const { data: rows, error: err } = await supabase
        .from('practice_questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('category', 'extended')
        .order('sort_order');
      if (!cancelled) {
        setData(rows || []);
        setError(err?.message || null);
        setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [lessonId]);

  return { data, loading, error };
}

// ── HOOK 6: User Progress ─────────────────────────────────────
export function useProgress() {
  const [completedIds, setCompletedIds] = useState([]);
  const [totalXP,      setTotalXP]      = useState(0);
  const [loading,      setLoading]      = useState(true);

  const loadProgress = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [progressRes, profileRes] = await Promise.all([
      supabase.from('user_progress').select('subtopic_id').eq('user_id', user.id).eq('completed', true),
      supabase.from('user_profiles').select('total_xp').eq('id', user.id).single(),
    ]);

    setCompletedIds((progressRes.data || []).map(r => r.subtopic_id));
    setTotalXP(profileRes.data?.total_xp || 0);
    setLoading(false);
  }, []);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  const saveProgress = useCallback(async (subtopicId, score, xpEarned) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not logged in' };

    const { error: progressErr } = await supabase
      .from('user_progress')
      .upsert({ user_id: user.id, subtopic_id: subtopicId, completed: true, score, xp_earned: xpEarned, completed_at: new Date().toISOString() },
              { onConflict: 'user_id,subtopic_id' });
    if (progressErr) return { error: progressErr.message };

    await supabase.rpc('increment_xp', { user_id_input: user.id, xp_input: xpEarned });
    await loadProgress();
    return { error: null };
  }, [loadProgress]);

  return { completedIds, totalXP, saveProgress, loading };
}

// ── HOOK 7: User Profile ──────────────────────────────────────
export function useProfile() {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data, error: err } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
      if (!cancelled) { setProfile(data); setError(err?.message || null); setLoading(false); }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not logged in' };
    const { data, error: err } = await supabase.from('user_profiles').update(updates).eq('id', user.id).select().single();
    if (!err) setProfile(data);
    return { error: err?.message || null };
  }, []);

  return { profile, updateProfile, loading, error };
}

// ── HOOK 8: Curriculum Upload ─────────────────────────────────
// Used by admin dashboard to check + upload curriculum files.
export function useCurriculum(learningPathId) {
  const [files,   setFiles]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!learningPathId) return;
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      const { data } = await supabase
        .from('curriculum_files')
        .select('*')
        .eq('learning_path_id', learningPathId)
        .order('created_at', { ascending: false });
      if (!cancelled) { setFiles(data || []); setLoading(false); }
    }
    fetch();
    return () => { cancelled = true; };
  }, [learningPathId]);

  const upload = useCallback(async ({ learningPathId: lpId, rawText, fileType, originalName }) => {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Insert the curriculum file
    const { data, error } = await supabase.from('curriculum_files').insert({
      learning_path_id: lpId,
      raw_text:         rawText,
      file_type:        fileType || 'text',
      original_name:    originalName || 'curriculum',
      uploaded_by:      user?.id,
      processed:        true,
    }).select().single();

    if (error) return { data: null, error: error.message };

    // 2. Mark has_curriculum = true on the learning_path row so AI generation triggers
    await supabase
      .from('learning_paths')
      .update({ has_curriculum: true })
      .eq('id', lpId);

    setFiles(f => [data, ...f]);
    return { data, error: null };
  }, []);

  return { files, loading, upload };
}
