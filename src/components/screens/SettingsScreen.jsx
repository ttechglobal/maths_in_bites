import { useState, useEffect, useRef } from "react";
import { C } from '../../constants/colors';
import { PAGE_ACCENTS } from '../../constants/accents';
import { EXAM_TYPES } from '../../constants/curriculum';
import { SCHOOL_LEVELS } from '../../types';
import Pill from '../ui/Pill';
import Btn from '../ui/Btn';

// Display labels — must match LevelSelect exactly
const SCHOOL_LABELS = {
  JS1: 'JSS 1', JS2: 'JSS 2', JS3: 'JSS 3',
  SS1: 'SS 1',  SS2: 'SS 2',  SS3: 'SS 3',
};

export default function SettingsScreen({ user, grade, mode, onSaveName, onSaveClass }) {
  const accent = PAGE_ACCENTS.settings;

  // editClass is what the user has selected in the UI
  const [editName,  setEditName]  = useState(user?.name || "");
  const [editClass, setEditClass] = useState(grade || "SS1");
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  // savedClass tracks the last value actually committed to the DB.
  // We use a ref so updating it never triggers a re-render that would
  // re-lock the Save button. It starts at the prop value (current DB value).
  const savedClassRef = useRef(grade || "SS1");
  const savedNameRef  = useRef(user?.name || "");

  // Only sync name display when it changes from outside (e.g. another session)
  useEffect(() => { setEditName(user?.name || ""); }, [user?.name]);
  // NOTE: intentionally NO useEffect for grade — we manage that via savedClassRef

  const nameChanged  = editName.trim() !== savedNameRef.current;
  const classChanged = editClass !== savedClassRef.current;
  const hasChanges   = nameChanged || classChanged;

  const handleSave = async () => {
    if (!editName.trim()) return;
    const didChangeClass = classChanged;
    setSaving(true);
    if (nameChanged) {
      await onSaveName(editName.trim());
      savedNameRef.current = editName.trim();
    }
    if (classChanged) {
      await onSaveClass(editClass);
      savedClassRef.current = editClass;
    }
    setSaving(false);
    setSaved(didChangeClass ? 'class' : 'name');
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 16px 100px" }}>
      <div className="anim-fadeUp" style={{ marginBottom: 28 }}>
        <Pill color={accent.primary}>⚙️ Settings</Pill>
        <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 32, color: C.navy, margin: "10px 0 4px" }}>Your Profile</h1>
        <p style={{ color: C.muted, fontWeight: 600 }}>Update your name or class below</p>
      </div>

      {/* Name editor */}
      <div className="card anim-fadeUp" style={{ padding: 24, marginBottom: 14, animationDelay: "0.05s" }}>
        <label style={{ fontWeight: 800, fontSize: 14, color: C.navy, display: "block", marginBottom: 10 }}>👤 Your Name</label>
        <input
          value={editName}
          onChange={e => setEditName(e.target.value)}
          placeholder="Enter your name"
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 14,
            border: `2px solid ${editName !== (user?.name || "") ? accent.primary : C.border}`,
            fontSize: 16, fontWeight: 700, color: C.navy, background: "#FAFAF8",
          }}
        />
      </div>

      {/* Class selector */}
      <div className="card anim-fadeUp" style={{ padding: 24, marginBottom: 20, animationDelay: "0.08s" }}>
        <label style={{ fontWeight: 800, fontSize: 14, color: C.navy, display: "block", marginBottom: 10 }}>🎓 Your Class</label>
        <p style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 14 }}>
          Changing your class updates the topics shown in Learn and Practice.
        </p>

        <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: 0.8, marginBottom: 8 }}>SCHOOL</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {SCHOOL_LEVELS.map(cls => (
            <div key={cls} onClick={() => setEditClass(cls)} style={{
              padding: "8px 16px", borderRadius: 50, cursor: "pointer", fontWeight: 800, fontSize: 13,
              border: `2px solid ${editClass === cls ? accent.primary : C.border}`,
              background: editClass === cls ? `${accent.primary}15` : "#fff",
              color: editClass === cls ? accent.primary : C.muted,
              transition: "all 0.18s",
            }}>{SCHOOL_LABELS[cls] || cls}</div>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: 0.8, marginBottom: 8 }}>EXAM PREP</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {EXAM_TYPES.map(cls => (
            <div key={cls} onClick={() => setEditClass(cls)} style={{
              padding: "8px 16px", borderRadius: 50, cursor: "pointer", fontWeight: 800, fontSize: 13,
              border: `2px solid ${editClass === cls ? C.fire : C.border}`,
              background: editClass === cls ? `${C.fire}12` : "#fff",
              color: editClass === cls ? C.fire : C.muted,
              transition: "all 0.18s",
            }}>{cls}</div>
          ))}
        </div>
      </div>

      <div className="anim-fadeUp" style={{ animationDelay: "0.11s" }}>
        <Btn onClick={handleSave} disabled={!hasChanges || saving} size="lg" color={accent.primary} style={{ width: "100%", boxShadow: `0 5px 0 ${accent.primary}55` }}>
          {saving ? "Saving…" : saved ? "✅ Saved!" : "Save Changes"}
        </Btn>
      </div>

      {saved && (
        <div className="anim-fadeIn" style={{ marginTop: 12, textAlign: "center", fontSize: 13, fontWeight: 700, color: C.mint }}>
          {saved === 'class' ? "Class updated — topics refreshed ✨" : "Profile updated successfully!"}
        </div>
      )}

    </div>
  );
}