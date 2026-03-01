// src/App.jsx
import { useState, useEffect } from 'react';
import { useAppState }        from './hooks/useAppState';
import { useTopics }          from './hooks/useContent';
import { C }                  from './constants/colors';

// Onboarding
import SplashScreen    from './components/onboarding/SplashScreen';
import LevelSelect     from './components/onboarding/LevelSelect';
import NameEntry       from './components/onboarding/NameEntry';
import TutorialOverlay from './components/onboarding/TutorialOverlay';

// Auth
import AuthScreen from './components/auth/AuthScreen';

// Layout
import TopBar    from './components/layout/TopBar';
import BottomNav from './components/layout/BottomNav';

// Screens
import HomeScreen         from './components/screens/HomeScreen';
import TopicListScreen    from './components/screens/TopicListScreen';
import SubtopicListScreen from './components/screens/SubtopicListScreen';
import PracticeScreen     from './components/screens/PracticeScreen';
import SettingsScreen     from './components/screens/SettingsScreen';
import SchoolModeScreen   from './components/screens/SchoolModeScreen';

// Lesson
import LessonPage     from './components/lesson/LessonPage';
import PracticeModule from './components/lesson/PracticeModule';

// ─────────────────────────────────────────────────────────────
// App-level exit guard
// Intercepts browser back button and tab/window close.
// Shows an encouraging dialog so students don't accidentally leave.
// ─────────────────────────────────────────────────────────────

const EXIT_MESSAGES = [
  { headline: "Learning in progress! 🚀", body: "You're building something great. Stay a little longer?" },
  { headline: "Don't stop now! ⭐", body: "Every question you answer makes you smarter. Keep it up!" },
  { headline: "Your streak is on the line! 🔥", body: "Come back and keep your learning streak alive." },
  { headline: "Almost there! 💪", body: "The best students show up even when they don't feel like it." },
  { headline: "Knowledge waits for no one! 🧠", body: "A few more minutes today = big results tomorrow." },
];

function useAppExitGuard(onExitRequest) {
  useEffect(() => {
    // Intercept browser/tab close (beforeunload)
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ''; // triggers browser's native dialog as fallback
    };

    // Intercept browser back button by pushing a history state
    // When user presses back, we catch the popstate and show our dialog instead
    window.history.pushState({ exitGuard: true }, '');
    const handlePopState = (e) => {
      // Re-push so back button keeps triggering us
      window.history.pushState({ exitGuard: true }, '');
      onExitRequest();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onExitRequest]);
}

function AppExitDialog({ onStay, onExit }) {
  const msg = EXIT_MESSAGES[Math.floor(Math.random() * EXIT_MESSAGES.length)];
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 28, maxWidth: 380, width: '100%',
        padding: 32, textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        animation: 'fadeUp 0.25s ease',
      }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>📚</div>
        <div style={{
          fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 22,
          color: '#1a2340', marginBottom: 10, lineHeight: 1.2,
        }}>
          {msg.headline}
        </div>
        <p style={{ color: '#7a8599', fontWeight: 600, fontSize: 14, marginBottom: 6, lineHeight: 1.65 }}>
          {msg.body}
        </p>
        <p style={{
          fontFamily: "'Baloo 2'", fontWeight: 800, fontSize: 13,
          color: '#FF6B35', marginBottom: 26,
        }}>
          Are you sure you want to leave?
        </p>

        <button onClick={onStay} style={{
          width: '100%', padding: '14px', borderRadius: 16, border: 'none', marginBottom: 10,
          background: 'linear-gradient(135deg,#FF6B35,#FF9500)',
          color: '#fff', fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 17,
          cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,107,53,0.4)',
        }}>
          Stay & Keep Learning! 🔥
        </button>

        <button onClick={onExit} style={{
          width: '100%', padding: '12px', borderRadius: 16,
          border: '2px solid #E8E8EE', background: 'transparent',
          color: '#aab0be', fontFamily: "'Baloo 2'", fontWeight: 700, fontSize: 14,
          cursor: 'pointer',
        }}>
          Exit anyway
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const app = useAppState();
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Intercept back button and tab close at the app level
  useAppExitGuard(() => setShowExitDialog(true));

  const { topics, status: topicsStatus } = useTopics(
    app.learningPath?.id ?? null,
    app.profile?.grade   ?? null
  );

  const user = app.profile
    ? { name: app.profile.name, xp: app.profile.total_xp || 0, streak: app.profile.streak || 1 }
    : { name: 'Student', xp: 0, streak: 1 };

  // ── Loading ──────────────────────────────────────────────────
  if (app.phase === 'loading') {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.bg }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🧮</div>
          <div style={{ fontFamily:"'Baloo 2'", fontWeight:900, fontSize:24, color:C.navy }}>Loading…</div>
        </div>
      </div>
    );
  }

  // ── Auth (not logged in) ──────────────────────────────────────
  if (!app.authUser) return <AuthScreen onAuthSuccess={() => {}} />;

  // ── Onboarding ───────────────────────────────────────────────
  // Flow: splash → name → levelSelect → tutorial → app
  // AuthScreen collects name during sign-up, so returning users skip straight to levelSelect if needed.
  if (app.phase === 'splash') return (
    <SplashScreen onStart={() => app.setPhase('name')} />
  );

  if (app.phase === 'name') return (
    <NameEntry
      onNext={name => app.handleSaveName(name)}
    />
  );

  if (app.phase === 'levelSelect') return (
    <LevelSelect
      onSelect={grade => app.handleOnboardClass(grade)}
    />
  );

  if (app.phase === 'tutorial') return (
    <TutorialOverlay
      name={app.profile?.name || 'Champ'}
      onDone={() => app.unlockApp()}
    />
  );

  // ── Main App ──────────────────────────────────────────────────
  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      {/* App-level exit guard — shows when user tries to close/navigate away */}
      {showExitDialog && (
        <AppExitDialog
          onStay={() => setShowExitDialog(false)}
          onExit={() => {
            setShowExitDialog(false);
            // Let browser navigate away naturally
            window.history.back();
          }}
        />
      )}
      <TopBar user={user} onNavigate={app.switchScreen} />

      {/* Practice mode */}
      {app.lessonOpen && app.practiceMode ? (
        <PracticeModule
          subtopicId={app.subtopic?.id}
          subtopic={app.subtopic}
          userId={app.authUser?.id ?? null}
          onBack={() => app.setPracticeMode(false)}
        />

      /* Lesson */
      ) : app.lessonOpen ? (
        <LessonPage
          subtopic={app.subtopic}
          userId={app.authUser?.id ?? null}
          onBack={() => { app.setLessonOpen(false); app.setSubtopic(null); }}
          onComplete={app.refreshAfterComplete}
          onNext={() => { app.setLessonOpen(false); app.setSubtopic(null); }}
          onPracticeMore={() => app.setPracticeMode(true)}
        />

      /* Subtopic list */
      ) : app.topic ? (
        <SubtopicListScreen
          topic={app.topic}
          grade={app.profile?.grade ?? null}
          completedIds={app.completedIds}
          onBack={() => app.selectTopic(null)}
          onSelect={app.selectSubtopic}
          onComplete={app.refreshAfterComplete}
        />

      /* Bottom-nav screens */
      ) : (
        <>
          {app.screen === 'home' && (
            <HomeScreen
              user={user}
              grade={app.profile?.grade || 'SS2'}
              mode={app.profile?.mode  || 'school'}
              topics={topics}
              topicsLoading={topicsStatus === 'loading'}
              completedIds={app.completedIds}
              onGoLearn={() => app.switchScreen('learn')}
              onGoPractice={() => app.switchScreen('practice')}
              onSelectTopic={app.selectTopic}
            />
          )}
          {app.screen === 'learn' && (
            app.profile?.mode === 'school' ? (
              <SchoolModeScreen
                grade={app.profile?.grade || 'JSS1'}
                learningPathId={app.learningPath?.id ?? null}
                completedIds={app.completedIds}
                onSelectSubtopic={(sub) => {
                  app.selectSubtopic(sub);
                }}
              />
            ) : (
              <TopicListScreen
                grade={app.profile?.grade || 'SS2'}
                mode={app.profile?.mode  || 'exam'}
                topics={topics}
                status={topicsStatus}
                completedIds={app.completedIds}
                onSelectTopic={app.selectTopic}
              />
            )
          )}
          {app.screen === 'practice' && (
            <PracticeScreen
              topics={topics}
              grade={app.profile?.grade ?? null}
            />
          )}
          {app.screen === 'settings' && (
            <SettingsScreen
              user={user}
              grade={app.profile?.grade}
              mode={app.profile?.mode}
              onSaveName={name => app.updateProfile({ name })}
              onSaveClass={app.handleSaveClass}
            />
          )}
          <BottomNav screen={app.screen} onNavigate={app.switchScreen} />
        </>
      )}
    </div>
  );
}