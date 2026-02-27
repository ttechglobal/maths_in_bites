import { useState } from "react";
import { C } from '../../constants/colors';
import { PAGE_ACCENTS } from '../../constants/accents';
import { SCHOOL_CLASSES, EXAM_TYPES } from '../../constants/curriculum';
import Pill from '../ui/Pill';
import Btn from '../ui/Btn';

export default function SettingsScreen({ user, grade, mode, onSaveName, onSaveClass, onAdminClick }) {
  const accent = PAGE_ACCENTS.settings;
  const [editName,  setEditName]  = useState(user?.name || "");
  const [editClass, setEditClass] = useState(grade || "SS2");
  const [saved,     setSaved]     = useState(false);

  const hasChanges = editName.trim() !== (user?.name || "") || editClass !== grade;

  const handleSave = () => {
    if (editName.trim()) onSaveName(editName.trim());
    onSaveClass(editClass);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
          {SCHOOL_CLASSES.map(cls => (
            <div key={cls} onClick={() => setEditClass(cls)} style={{
              padding: "8px 16px", borderRadius: 50, cursor: "pointer", fontWeight: 800, fontSize: 13,
              border: `2px solid ${editClass === cls ? accent.primary : C.border}`,
              background: editClass === cls ? `${accent.primary}15` : "#fff",
              color: editClass === cls ? accent.primary : C.muted,
              transition: "all 0.18s",
            }}>{cls}</div>
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
        <Btn onClick={handleSave} disabled={!hasChanges && !saved} size="lg" color={accent.primary} style={{ width: "100%", boxShadow: `0 5px 0 ${accent.primary}55` }}>
          {saved ? "✅ Saved!" : "Save Changes"}
        </Btn>
      </div>

      {saved && (
        <div className="anim-fadeIn" style={{ marginTop: 12, textAlign: "center", fontSize: 13, fontWeight: 700, color: C.mint }}>
          {editClass !== grade ? "Class updated — topics refreshed across the app ✨" : "Profile updated successfully!"}
        </div>
      )}

      <Btn color={C.navy} onClick={onAdminClick} style={{ width: "100%", marginTop: 16 }}>
        🔐 Admin Dashboard
      </Btn>
    </div>
  );
}