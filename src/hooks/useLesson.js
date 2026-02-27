// This manages all the quiz state inside LessonPage:
// answers, submission, confetti, XP popup, retry, and inline admin editing.

// src/hooks/useLesson.js
import { useState, useRef, useCallback } from 'react';

export function useLesson(lesson, isAdmin, onLessonChange) {
  const [localLesson, setLocalLesson] = useState(lesson);
  const [answers,     setAnswers]     = useState({});       // { qId: selectedIndex }
  const [submitted,   setSubmitted]   = useState(false);
  const [showConf,    setShowConf]    = useState(false);    // confetti
  const [showXP,      setShowXP]      = useState(false);    // XP popup
  const [retryMsg,    setRetryMsg]    = useState(false);
  const [regenTarget, setRegenTarget] = useState(null);     // "intro" | "examples" | null
  const quizRef = useRef(null);

  // In admin mode, use the local editable copy; in student mode, use the prop directly
  const L = isAdmin ? localLesson : lesson;

  // Admin: update a deeply-nested field in the lesson object
  const updateField = useCallback((path, val) => {
    setLocalLesson(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let cur = next;
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
      cur[path[path.length - 1]] = val;
      onLessonChange?.(next);
      return next;
    });
  }, [onLessonChange]);

  const correct     = L.practiceQuestions.filter(q => answers[q.id] === q.answer).length;
  const allAnswered  = L.practiceQuestions.every(q => q.id in answers);

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
    if (correct >= 1) {
      setShowConf(true);
      setShowXP(true);
      setTimeout(() => setShowConf(false), 2600);
    } else {
      setRetryMsg(true);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setRetryMsg(false);
    quizRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return {
    L, answers, submitted, showConf, showXP, retryMsg, regenTarget,
    quizRef, correct, allAnswered,
    setAnswers, setShowXP, setRegenTarget,
    handleSubmit, handleRetry, updateField,
  };
}