// src/components/admin/CurriculumUploader.jsx
// ============================================================
// Curriculum upload — top-level shell with School | Exam tabs.
//
//   School tab → SchoolCurriculumUploader  (JSS1–SS3, term-structured JSON)
//   Exam tab   → ExamCurriculumUploader    (WAEC/JAMB/NECO, flat array — original, untouched)
//
// The two uploaders are completely independent components with
// no shared state or logic. Switching tabs is purely cosmetic.
// ============================================================

import { useState } from "react";
import { C } from '../../constants/colors';
import SchoolCurriculumUploader from './SchoolCurriculumUploader';
import ExamCurriculumUploader   from './ExamCurriculumUploader';

const TABS = [
  { id: 'school', label: '🏫 School',   sub: 'JSS1 – SS3 · Term structure' },
  { id: 'exam',   label: '📋 Exam Prep', sub: 'WAEC · JAMB · NECO · Flat topics' },
];

export default function CurriculumUploader() {
  const [tab, setTab] = useState('school');

  return (
    <div style={{ padding: 32 }}>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 32, color: C.navy, marginBottom: 4 }}>
          Curriculum Upload
        </h1>
        <p style={{ color: C.muted, fontWeight: 600 }}>
          Upload topics and subtopics for your classes. School and exam curricula use different formats.
        </p>
      </div>

      {/* School | Exam tab switcher */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 28,
        background: '#F0EDE8', borderRadius: 18, padding: 5,
        width: 'fit-content',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 22px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: tab === t.id ? '#fff' : 'transparent',
              boxShadow: tab === t.id ? '0 2px 10px rgba(0,0,0,0.09)' : 'none',
              transition: 'all 0.2s',
              textAlign: 'left',
            }}
          >
            <div style={{
              fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 15,
              color: tab === t.id ? C.navy : C.muted,
              marginBottom: 1,
            }}>
              {t.label}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: tab === t.id ? C.fire : C.muted }}>
              {t.sub}
            </div>
          </button>
        ))}
      </div>

      {/* Active uploader — each is fully self-contained */}
      {tab === 'school' && <SchoolCurriculumUploader />}
      {tab === 'exam'   && <ExamCurriculumUploader   />}
    </div>
  );
}
