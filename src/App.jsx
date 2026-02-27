// src/App.jsx
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

// Lesson
import LessonPage     from './components/lesson/LessonPage';
import PracticeModule from './components/lesson/PracticeModule';

// Admin
import AdminApp from './components/admin/AdminApp';

export default function App() {
  const app = useAppState();

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

  // ── Admin ─────────────────────────────────────────────────────
  if (app.showAdmin) return <AdminApp onExitAdmin={() => app.setShowAdmin(false)} />;

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
      <TopBar user={user} onAdminClick={() => app.setShowAdmin(true)} />

      {/* Practice mode */}
      {app.lessonOpen && app.practiceMode ? (
        <PracticeModule
          subtopicId={app.subtopic?.id}
          subtopic={app.subtopic}
          onBack={() => app.setPracticeMode(false)}
        />

      /* Lesson */
      ) : app.lessonOpen ? (
        <LessonPage
          subtopic={app.subtopic}
          userId={app.authUser?.id ?? null}
          onBack={() => { app.setLessonOpen(false); app.setSubtopic(null); }}
          onComplete={async () => {
            app.setLessonOpen(false);
            app.setSubtopic(null);
            await app.refreshAfterComplete();   // ← refreshes both completedIds AND profile XP
          }}
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
            <TopicListScreen
              grade={app.profile?.grade || 'SS2'}
              mode={app.profile?.mode  || 'school'}
              topics={topics}
              status={topicsStatus}
              completedIds={app.completedIds}
              onSelectTopic={app.selectTopic}
              isAdmin={app.profile?.is_admin || false}
              onAdminUpload={() => app.setShowAdmin(true)}
            />
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
              onAdminClick={() => app.setShowAdmin(true)}
            />
          )}
          <BottomNav screen={app.screen} onNavigate={app.switchScreen} />
        </>
      )}
    </div>
  );
}