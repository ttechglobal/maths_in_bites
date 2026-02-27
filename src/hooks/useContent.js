// src/hooks/useContent.js
// ============================================================
// Clean, unified content hooks.
//
// BUG FIXES:
//   - useExtendedQuestions returns { questions, loading, error }
//     (previously returned { data, loading } — broke PracticeModule)
//   - useSubtopics also exposes `data` alias for backward compat
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import * as content from '../services/content';

function startPolling(fetchFn, onResult, isDone, intervalMs = 3000) {
  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    const result = await fetchFn();
    if (stopped) return;
    onResult(result);
    if (!isDone(result) && !stopped) setTimeout(tick, intervalMs);
  };
  setTimeout(tick, intervalMs);
  return () => { stopped = true; };
}

// ── useTopics ─────────────────────────────────────────────────
export function useTopics(learningPathId, grade) {
  const [topics, setTopics] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error,  setError]  = useState(null);
  const seededRef = useRef(false);

  const loadTopics = useCallback(async () => {
    if (!learningPathId) { setStatus('idle'); return; }
    setStatus('loading'); setError(null);
    try {
      const rows = await content.getTopics(learningPathId);
      if (rows.length > 0) { setTopics(rows); setStatus('ready'); return; }
      if (!grade || seededRef.current) { setStatus('no_curriculum'); return; }
      seededRef.current = true;
      const inserted = await content.seedTopicsFromCurriculum(learningPathId, grade);
      if (inserted === 0) { setStatus('no_curriculum'); return; }
      const fresh = await content.getTopics(learningPathId);
      setTopics(fresh); setStatus('ready');
    } catch (e) {
      console.error('[useTopics]', e);
      setError(e.message); setStatus('error');
    }
  }, [learningPathId, grade]);

  useEffect(() => { seededRef.current = false; loadTopics(); }, [loadTopics]);
  return { topics, status, error, loading: status === 'loading' };
}

// ── useSubtopics ──────────────────────────────────────────────
// Subtopics now come from admin JSON upload — no AI generation.
export function useSubtopics(topicId) {
  const [subtopics, setSubtopics] = useState([]);
  const [status,    setStatus]    = useState('idle');
  const [error,     setError]     = useState(null);

  useEffect(() => {
    if (!topicId) { setStatus('idle'); setSubtopics([]); return; }
    setStatus('loading'); setError(null);
    let cancelled = false;

    content.getSubtopics(topicId)
      .then(rows => {
        if (cancelled) return;
        setSubtopics(rows);
        setStatus(rows.length > 0 ? 'ready' : 'empty');
      })
      .catch(e => {
        if (cancelled) return;
        console.error('[useSubtopics]', e);
        setError(e.message); setStatus('error');
      });

    return () => { cancelled = true; };
  }, [topicId]);

  return { subtopics, data: subtopics, status, error, loading: status === 'loading' };
}

// ── useLesson ─────────────────────────────────────────────────
export function useLesson(subtopicId) {
  const [lesson,    setLesson]    = useState(null);
  const [examples,  setExamples]  = useState([]);
  const [questions, setQuestions] = useState([]);
  const [status,    setStatus]    = useState('idle');
  const [error,     setError]     = useState(null);
  const stopPollRef  = useRef(null);
  const triggeredRef = useRef(false);

  const stopPolling    = useCallback(() => { stopPollRef.current?.(); stopPollRef.current = null; }, []);
  const fetchLessonData = useCallback(async (lessonRow) => {
    const [exs, qs] = await Promise.all([
      content.getLessonExamples(lessonRow.id),
      content.getLessonQuestions(lessonRow.id, 'lesson'),
    ]);
    return { examples: exs, questions: qs };
  }, []);

  useEffect(() => {
    if (!subtopicId) { setStatus('idle'); setLesson(null); return; }
    setStatus('loading'); setError(null);
    triggeredRef.current = false; stopPolling();
    let cancelled = false;

    async function load() {
      try {
        const lessonRow = await content.getLesson(subtopicId);
        if (cancelled) return;
        if (lessonRow) {
          const { examples, questions } = await fetchLessonData(lessonRow);
          if (cancelled) return;
          setLesson(lessonRow); setExamples(examples); setQuestions(questions); setStatus('ready');
          return;
        }
        if (!triggeredRef.current) {
          triggeredRef.current = true; setStatus('generating');
          content.triggerLessonGeneration(subtopicId)
            .catch(e => console.error('[useLesson] trigger failed:', e));
        }
        if (cancelled) return;
        stopPollRef.current = startPolling(
          () => content.getLesson(subtopicId),
          async (polled) => {
            if (!polled || cancelled) return;
            const { examples, questions } = await fetchLessonData(polled);
            if (cancelled) return;
            setLesson(polled); setExamples(examples); setQuestions(questions);
            setStatus('ready'); stopPolling();
          },
          (polled) => polled !== null,
          3000
        );
      } catch (e) {
        if (cancelled) return;
        console.error('[useLesson]', e);
        setError(e.message); setStatus('error');
      }
    }

    load();
    return () => { cancelled = true; stopPolling(); };
  }, [subtopicId, fetchLessonData, stopPolling]);

  return { lesson, examples, questions, status, error, loading: status === 'loading' || status === 'generating', isGenerating: status === 'generating' };
}

// ── useExtendedQuestions ──────────────────────────────────────
// FIX: returns { questions, loading, error } — NOT { data, loading }
// PracticeModule was destructuring `data` which was always undefined.
export function useExtendedQuestions(lessonId) {
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    if (!lessonId) { setQuestions([]); return; }
    let cancelled = false;
    setLoading(true);
    content.getLessonQuestions(lessonId, 'extended')
      .then(qs  => { if (!cancelled) { setQuestions(qs); setLoading(false); } })
      .catch(e  => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [lessonId]);

  // `data` alias kept for any legacy callers
  return { questions, data: questions, loading, error };
}

// ── useProgress ───────────────────────────────────────────────
export function useProgress(userId) {
  const [completedIds, setCompletedIds] = useState([]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const ids = await content.getCompletedSubtopicIds(userId);
    setCompletedIds(ids);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback(async (subtopicId, score, xpEarned) => {
    if (!userId) return;
    await content.saveProgress(userId, subtopicId, score, xpEarned);
    await refresh();
  }, [userId, refresh]);

  return { completedIds, saveProgress: save, refresh };
}

// ── useLearningPath ───────────────────────────────────────────
export function useLearningPath(grade, mode) {
  const [learningPath, setLearningPath] = useState(null);
  const [loading,      setLoading]      = useState(false);

  useEffect(() => {
    if (!grade || !mode) { setLearningPath(null); return; }
    let cancelled = false;
    setLoading(true);
    content.getLearningPath(grade, mode)
      .then(lp => { if (!cancelled) { setLearningPath(lp); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [grade, mode]);

  return { learningPath, loading };
}

// ── usePracticeQuestions ──────────────────────────────────────
// Loads all practice questions for a subtopic.
export function usePracticeQuestions(subtopicId) {
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    if (!subtopicId) { setQuestions([]); return; }
    let cancelled = false;
    setLoading(true);
    content.getPracticeQuestions(subtopicId)
      .then(qs => { if (!cancelled) { setQuestions(qs);    setLoading(false); } })
      .catch(e  => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [subtopicId]);

  return { questions, loading, error };
}