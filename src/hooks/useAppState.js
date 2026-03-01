// src/hooks/useAppState.js
// ============================================================
// Root app state — Supabase-powered.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useAppState() {
  // ── Auth ──────────────────────────────────────────────────
  const [authUser,  setAuthUser]  = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // ── Profile ───────────────────────────────────────────────
  const [profile,  setProfile]  = useState(null);
  const [profReady, setProfReady] = useState(false);

  // ── Phase ─────────────────────────────────────────────────
  // loading | splash | name | levelSelect | tutorial | app
  const [phase, setPhase] = useState('loading');
  // Prevent the phase-deciding useEffect from overriding manual setPhase calls
  // during onboarding (e.g. after user picks grade, we manually set 'tutorial')
  const phaseLockedRef = useRef(false);

  // ── Navigation ────────────────────────────────────────────
  const [screen,       setScreen]       = useState('home');
  const [learningPath, setLearningPath] = useState(null);
  const [topic,        setTopic]        = useState(null);
  const [subtopic,     setSubtopic]     = useState(null);
  const [lessonOpen,   setLessonOpen]   = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [showAdmin,    setShowAdmin]    = useState(false);

  // ── Progress ──────────────────────────────────────────────
  const [completedIds, setCompletedIds] = useState([]);

  // ── Fetch profile from Supabase ───────────────────────────
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); setProfReady(true); return; }
    const { data } = await supabase
      .from('user_profiles').select('*').eq('id', userId).single();
    setProfile(data || null);
    setProfReady(true);
  }, []);

  // ── Fetch completed subtopic IDs ──────────────────────────
  const fetchCompleted = useCallback(async (userId) => {
    if (!userId) { setCompletedIds([]); return; }
    const { data, error } = await supabase
      .from('user_progress').select('subtopic_id').eq('user_id', userId);
    if (error) console.error('[progress load]', error.message);
    setCompletedIds((data || []).map(r => r.subtopic_id));
  }, []);

  // ── 1. Auth listener ──────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setAuthUser(u);
      setAuthReady(true);
      fetchProfile(u?.id ?? null);
      fetchCompleted(u?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setAuthUser(u);
        if (!u) { setProfile(null); setProfReady(true); setCompletedIds([]); }
        else { fetchProfile(u.id); fetchCompleted(u.id); }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchCompleted]);

  // ── 2. Decide phase once auth + profile are ready ─────────
  useEffect(() => {
    if (!authReady || !profReady) return;
    // Don't override if we're mid-onboarding
    if (phaseLockedRef.current) return;

    if (!authUser) { setPhase('splash'); return; }

    // Name is collected during signup — skip name phase if already set
    if (!profile?.name)                    { setPhase('name');        return; }
    if (!profile?.grade || !profile?.mode) { setPhase('levelSelect'); return; }

    setPhase('app');
  }, [authReady, profReady, authUser, profile]);

  // ── 3. Resolve learning path when grade/mode changes ──────
  useEffect(() => {
    if (!profile?.grade || !profile?.mode) { setLearningPath(null); return; }
    let cancelled = false;

    // Grade aliases — profile might store 'JS1' but DB row might be 'JSS1' or vice versa
    const gradeAliases = {
      'JS1': ['JS1','JSS1','JSS 1'],
      'JS2': ['JS2','JSS2','JSS 2'],
      'JS3': ['JS3','JSS3','JSS 3'],
      'JSS1': ['JSS1','JS1','JSS 1'],
      'JSS2': ['JSS2','JS2','JSS 2'],
      'JSS3': ['JSS3','JS3','JSS 3'],
    };
    const gradesToTry = gradeAliases[profile.grade] || [profile.grade];

    supabase
      .from('learning_paths')
      .select('id, name, slug, mode, grade, has_curriculum, icon')
      .in('grade', gradesToTry)
      .eq('mode',  profile.mode)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled && data) setLearningPath(data); });
    return () => { cancelled = true; };
  }, [profile?.grade, profile?.mode]);

  // ── Navigation helpers ────────────────────────────────────
  const switchScreen = useCallback((s) => {
    setScreen(s); setTopic(null); setSubtopic(null);
    setLessonOpen(false); setPracticeMode(false);
  }, []);

  const selectTopic = useCallback((t) => {
    setTopic(t); setSubtopic(null); setLessonOpen(false);
  }, []);

  const selectSubtopic = useCallback((s) => {
    setSubtopic(s); setLessonOpen(true); setPracticeMode(false);
  }, []);

  // ── Profile save helpers ──────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    if (!authUser) return;
    const { data, error } = await supabase
      .from('user_profiles').update(updates).eq('id', authUser.id).select().single();
    if (!error && data) setProfile(data);
    return { error };
  }, [authUser]);

  const handleSaveName = useCallback(async (name) => {
    phaseLockedRef.current = true;
    await updateProfile({ name });
    setPhase('levelSelect');
  }, [updateProfile]);

  const handleSaveClass = useCallback(async (grade) => {
    const examTypes = ['WAEC', 'JAMB', 'NECO', 'GCE', 'BECE', 'IGCSE'];
    const mode = examTypes.includes(grade) ? 'exam' : 'school';
    await updateProfile({ grade, mode });
    // Reset navigation so new content loads
    setScreen('home');
    setTopic(null); setSubtopic(null); setLessonOpen(false);
    setPracticeMode(false); setLearningPath(null);
  }, [updateProfile]);

  // Called during initial onboarding only — sets grade + goes to tutorial
  const handleOnboardClass = useCallback(async (grade) => {
    phaseLockedRef.current = true;
    const examTypes = ['WAEC', 'JAMB', 'NECO', 'GCE', 'BECE', 'IGCSE'];
    const mode = examTypes.includes(grade) ? 'exam' : 'school';
    await updateProfile({ grade, mode });
    setLearningPath(null);
    setPhase('tutorial');
  }, [updateProfile]);

  // ── Refresh progress + XP after completing a lesson ───────
  const refreshAfterComplete = useCallback(async () => {
    if (!authUser?.id) return;
    // Refresh completed IDs
    await fetchCompleted(authUser.id);
    // Refresh profile (XP etc)
    const { data } = await supabase
      .from('user_profiles').select('*').eq('id', authUser.id).single();
    if (data) setProfile(data);
  }, [authUser?.id, fetchCompleted]);

  const unlockApp = useCallback(() => {
    phaseLockedRef.current = false;
    setPhase('app');
  }, []);

  return {
    // Auth
    authUser, authReady,
    // Phase
    phase, setPhase,
    // Profile
    profile,
    // Navigation
    screen, switchScreen,
    learningPath, setLearningPath,
    topic, selectTopic,
    subtopic, selectSubtopic,
    lessonOpen, setLessonOpen,
    practiceMode, setPracticeMode,
    showAdmin, setShowAdmin,
    // Progress
    completedIds, setCompletedIds, refreshAfterComplete,
    // Actions
    handleSaveName, handleSaveClass, handleOnboardClass, updateProfile, unlockApp,
  };
}