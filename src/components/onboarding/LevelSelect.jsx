// src/components/onboarding/LevelSelect.jsx  (v3)
// ============================================================
// All 6 school classes + 3 exam types. Mobile-first grid.
// ============================================================

import { useState } from "react";
import { C } from '../../constants/colors';
import Btn from '../ui/Btn';
import { SCHOOL_LEVELS, EXAM_LEVELS } from '../../types';

const SCHOOL_LABELS = {
  JS1: "JSS 1",  JS2: "JSS 2",  JS3: "JSS 3",
  SS1: "SS 1",   SS2: "SS 2",   SS3: "SS 3",
};

const EXAM_LABELS = {
  WAEC: "WAEC",  JAMB: "JAMB",  NECO: "NECO",
};

const EXAM_DESCRIPTIONS = {
  WAEC: "West African Senior School Certificate",
  JAMB: "University Entrance (UTME)",
  NECO: "National Exams Council",
};

export default function LevelSelect({ onSelect }) {
  const [tab,      setTab]      = useState("school");   // "school" | "exam"
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "#FFFBF0", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 480 }} className="anim-fadeUp">

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>📚</div>
          <h1 style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 30, color: "#1a1a2e", marginBottom: 6 }}>
            What are you studying?
          </h1>
          <p style={{ color: "#6B7280", fontWeight: 600 }}>Choose your class or exam type</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", background: "#EDE8E0", borderRadius: 18, padding: 4, marginBottom: 20 }}>
          {[["school","🏫 School"], ["exam","📋 Exam Prep"]].map(([id, label]) => (
            <div key={id} onClick={() => { setTab(id); setSelected(null); }} style={{
              flex: 1, textAlign: "center", padding: "10px 0",
              borderRadius: 14, cursor: "pointer",
              background: tab === id ? "#fff" : "transparent",
              fontWeight: 800, fontSize: 14,
              color: tab === id ? C.fire : C.muted,
              boxShadow: tab === id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
            }}>{label}</div>
          ))}
        </div>

        {/* School classes — 2-column grid */}
        {tab === "school" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {SCHOOL_LEVELS.map(level => {
              const isJSS = level.startsWith("J");
              const color = isJSS ? C.sky : C.fire;
              const isSelected = selected === level;
              return (
                <div key={level} onClick={() => setSelected(level)} style={{
                  padding: "20px 16px", borderRadius: 18, textAlign: "center", cursor: "pointer",
                  border: `2.5px solid ${isSelected ? color : C.border}`,
                  background: isSelected ? `${color}12` : "#fff",
                  transition: "all 0.2s",
                }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{isJSS ? "📗" : "📕"}</div>
                  <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 22, color: isSelected ? color : "#1a1a2e" }}>
                    {SCHOOL_LABELS[level]}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginTop: 2 }}>
                    {isJSS ? "Junior Secondary" : "Senior Secondary"}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Exam types — stacked cards with description */}
        {tab === "exam" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            {EXAM_LEVELS.map(level => {
              const colors = { WAEC: C.mint, JAMB: C.purple, NECO: C.sky };
              const color = colors[level];
              const isSelected = selected === level;
              return (
                <div key={level} onClick={() => setSelected(level)} style={{
                  padding: "18px 20px", borderRadius: 18, cursor: "pointer",
                  border: `2.5px solid ${isSelected ? color : C.border}`,
                  background: isSelected ? `${color}12` : "#fff",
                  display: "flex", alignItems: "center", gap: 14,
                  transition: "all 0.2s",
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: `${color}22`, border: `2px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 15, color }}>
                    {level}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Baloo 2'", fontWeight: 900, fontSize: 18, color: isSelected ? color : "#1a1a2e" }}>
                      {EXAM_LABELS[level]}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginTop: 1 }}>
                      {EXAM_DESCRIPTIONS[level]}
                    </div>
                  </div>
                  {isSelected && <div style={{ marginLeft: "auto", fontSize: 20 }}>✅</div>}
                </div>
              );
            })}
          </div>
        )}

        <Btn
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          size="lg"
          style={{ width: "100%", boxShadow: selected ? `0 5px 0 ${C.fire}55` : "none" }}
        >
          {selected ? `Continue with ${SCHOOL_LABELS[selected] || selected} →` : "Select a level first"}
        </Btn>
      </div>
    </div>
  );
}
