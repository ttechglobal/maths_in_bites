import { useState, useRef, useEffect } from "react";
import { C } from '../../constants/colors';
import { useExtendedQuestions, useLesson } from '../../hooks/useContent';
import { flagQuestion } from '../../services/content';
import Btn from '../ui/Btn';
import Pill from '../ui/Pill';
import ProgressBar from '../ui/ProgressBar';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseOptions(raw) {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

// ── Setup Screen ──────────────────────────────────────────────
function PracticeSetup({ subtopicName, questionCount, onStart, onBack }) {
  const [mode,  setMode]  = useState(null);
  const [count, setCount] = useState(10);
  const [mins,  setMins]  = useState(2);
  const ready = mode !== null;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "28px 16px 100px" }}>
      <button onClick={onBack} style={{ background:"transparent",border:"none",color:C.muted,fontSize:14,fontWeight:700,marginBottom:24,cursor:"pointer" }}>
        ← Back to Lesson
      </button>
      <div className="anim-fadeUp" style={{ marginBottom: 24 }}>
        <Pill color={C.purple}>🎯 Practice Mode</Pill>
        <h1 style={{ fontFamily:"'Baloo 2'",fontWeight:900,fontSize:32,color:C.navy,margin:"10px 0 4px" }}>Practice More</h1>
        <p style={{ color:C.muted,fontWeight:600 }}>{subtopicName} · <strong style={{ color:C.purple }}>{questionCount}</strong> questions available</p>
      </div>

      <div className="card anim-fadeUp" style={{ padding:24,marginBottom:16 }}>
        <div style={{ fontFamily:"'Baloo 2'",fontWeight:800,fontSize:17,color:C.navy,marginBottom:14 }}>How do you want to practice?</div>
        <div style={{ display:"flex",gap:12 }}>
          {[{id:"count",icon:"🔢",label:"By Questions",sub:"Set a target"},{id:"time",icon:"⏱️",label:"By Time",sub:"Race the clock"}].map(({id,icon,label,sub})=>(
            <div key={id} onClick={()=>setMode(id)} style={{ flex:1,padding:"18px 14px",borderRadius:18,textAlign:"center",cursor:"pointer",border:`2.5px solid ${mode===id?C.purple:C.border}`,background:mode===id?`${C.purple}10`:"#fff",transition:"all 0.2s" }}>
              <div style={{ fontSize:32,marginBottom:6 }}>{icon}</div>
              <div style={{ fontWeight:800,fontSize:14,color:mode===id?C.purple:C.navy }}>{label}</div>
              <div style={{ fontSize:11,color:C.muted,fontWeight:600,marginTop:2 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {mode==="count" && (
        <div className="card anim-fadeUp" style={{ padding:24,marginBottom:16 }}>
          <div style={{ fontFamily:"'Baloo 2'",fontWeight:800,fontSize:16,color:C.navy,marginBottom:12 }}>How many questions?</div>
          <div style={{ display:"flex",gap:10 }}>
            {[10,20,Math.min(questionCount,50)].map(v=>(
              <div key={v} onClick={()=>setCount(v)} style={{ flex:1,padding:"16px 8px",borderRadius:16,textAlign:"center",cursor:"pointer",border:`2.5px solid ${count===v?C.fire:C.border}`,background:count===v?`${C.fire}10`:"#fff",fontFamily:"'Baloo 2'",fontWeight:900,fontSize:20,color:count===v?C.fire:C.navy,transition:"all 0.2s" }}>
                {v===Math.min(questionCount,50)&&v!==10&&v!==20?`All ${v}`:v}
                <div style={{ fontSize:11,fontWeight:700,color:C.muted,marginTop:2 }}>{v===10?"Quick":v===20?"Standard":"Full set"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode==="time" && (
        <div className="card anim-fadeUp" style={{ padding:24,marginBottom:16 }}>
          <div style={{ fontFamily:"'Baloo 2'",fontWeight:800,fontSize:16,color:C.navy,marginBottom:12 }}>How long?</div>
          <div style={{ display:"flex",gap:10 }}>
            {[1,2,5].map(m=>(
              <div key={m} onClick={()=>setMins(m)} style={{ flex:1,padding:"16px 8px",borderRadius:16,textAlign:"center",cursor:"pointer",border:`2.5px solid ${mins===m?C.sky:C.border}`,background:mins===m?`${C.sky}10`:"#fff",fontFamily:"'Baloo 2'",fontWeight:900,fontSize:20,color:mins===m?C.sky:C.navy,transition:"all 0.2s" }}>
                {m}m
                <div style={{ fontSize:11,fontWeight:700,color:C.muted,marginTop:2 }}>{m===1?"Sprint":m===2?"Standard":"Marathon"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Btn onClick={()=>ready&&onStart({mode,count,mins})} disabled={!ready} size="lg" color={C.purple}
        style={{ width:"100%",marginTop:8,boxShadow:ready?`0 5px 0 ${C.purple}66`:"none" }}>
        Start Practising 🚀
      </Btn>
    </div>
  );
}

// ── Per-question review item ──────────────────────────────────
function ReviewItem({ index, question, selectedIdx, isCorrect, opts }) {
  const [open, setOpen] = useState(!isCorrect); // auto-open wrong ones
  const correctIdx = question?.answer ?? 0;
  return (
    <div style={{ borderBottom:"1px solid #F5F2EC" }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ display:"flex",alignItems:"flex-start",gap:12,padding:"12px 20px",cursor:"pointer",background:open?"#FAFAF8":"#fff" }}>
        <div style={{ width:28,height:28,borderRadius:8,flexShrink:0,marginTop:2,background:isCorrect?`${C.mint}20`:"#FFE8E8",border:`1.5px solid ${isCorrect?C.mint:"#E74C3C"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:isCorrect?"#1a7a56":"#C0392B" }}>
          {isCorrect?"✓":"✗"}
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:13,fontWeight:600,color:C.navy,lineHeight:1.5 }}>Q{index+1}. {question?.question}</div>
          {!isCorrect && (
            <div style={{ fontSize:12,color:"#999",fontWeight:600,marginTop:3 }}>
              You chose: <span style={{ color:"#C0392B" }}>{opts[selectedIdx]??"–"}</span>
              {" · "}Correct: <span style={{ color:"#1a7a56" }}>{opts[correctIdx]}</span>
            </div>
          )}
        </div>
        <span style={{ fontSize:14,color:C.muted,flexShrink:0,transform:open?"rotate(90deg)":"none",transition:"transform 0.2s" }}>›</span>
      </div>
      {open && (
        <div style={{ padding:"0 20px 16px 60px" }}>
          <div style={{ display:"flex",flexDirection:"column",gap:6,marginBottom:10 }}>
            {opts.map((opt,oi)=>(
              <div key={oi} style={{ padding:"8px 12px",borderRadius:8,fontSize:13,fontWeight:600,background:oi===correctIdx?"#D4F5EC":oi===selectedIdx&&!isCorrect?"#FFE8E8":"#F5F2EC",border:`1.5px solid ${oi===correctIdx?C.mint:oi===selectedIdx&&!isCorrect?"#E74C3C":"#E8E8EE"}`,color:oi===correctIdx?"#1a5c3a":C.navy }}>
                <span style={{ fontWeight:800,marginRight:6 }}>{["A","B","C","D"][oi]}.</span>{opt}
                {oi===correctIdx&&<span style={{ marginLeft:8,fontSize:11,color:"#1a7a56" }}>✓ Correct</span>}
                {oi===selectedIdx&&!isCorrect&&<span style={{ marginLeft:8,fontSize:11,color:"#C0392B" }}>✗ Your answer</span>}
              </div>
            ))}
          </div>
          {question?.explanation && (
            <div style={{ background:"#EEF4FF",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#3a5a8a",lineHeight:1.6,fontWeight:600 }}>
              💡 {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Results / Summary Screen ──────────────────────────────────
function PracticeResults({ results, subtopicName, onRetryAll, onRetryWrong, onGoLesson }) {
  const [reviewFilter, setReviewFilter] = useState("all");
  const correct  = results.filter(r=>r.isCorrect).length;
  const total    = results.length;
  const accuracy = total>0?Math.round((correct/total)*100):0;
  const wrong    = results.filter(r=>!r.isCorrect);
  const accentColor = accuracy>=80?C.mint:accuracy>=50?C.sun:"#E74C3C";
  const trophy   = accuracy>=80?"🏆":accuracy>=50?"💪":"📚";
  const message  = accuracy>=80?"Outstanding! You've mastered this topic! 🌟":accuracy>=50?"Good work! Keep practising to improve. 💪":"Don't worry — review the lesson and try again! 📖";

  const reviewItems = results.filter(r=>{
    if(reviewFilter==="wrong") return !r.isCorrect;
    if(reviewFilter==="correct") return r.isCorrect;
    return true;
  });

  return (
    <div style={{ maxWidth:580,margin:"0 auto",padding:"28px 16px 100px" }}>
      {/* Score card */}
      <div className="card anim-popIn" style={{ padding:"32px 28px",textAlign:"center",marginBottom:16,background:`linear-gradient(135deg,${accentColor}08,#fff)`,border:`2px solid ${accentColor}33` }}>
        <div style={{ fontSize:60,marginBottom:8 }}>{trophy}</div>
        <h2 style={{ fontFamily:"'Baloo 2'",fontWeight:900,fontSize:28,color:C.navy,marginBottom:4 }}>Session Complete!</h2>
        <p style={{ color:C.muted,fontWeight:600,marginBottom:24,fontSize:14 }}>{subtopicName}</p>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20 }}>
          {[{label:"Correct",value:correct,icon:"✅",color:C.mint},{label:"Wrong",value:wrong.length,icon:"❌",color:"#E74C3C"},{label:"Accuracy",value:`${accuracy}%`,icon:"🎯",color:accentColor}].map(({label,value,icon,color})=>(
            <div key={label} style={{ background:"#fff",borderRadius:14,padding:"14px 8px",border:"1.5px solid #F0EDE8" }}>
              <div style={{ fontSize:20,marginBottom:4 }}>{icon}</div>
              <div style={{ fontFamily:"'Baloo 2'",fontWeight:900,fontSize:22,color }}>{value}</div>
              <div style={{ fontSize:11,color:C.muted,fontWeight:700,marginTop:2 }}>{label}</div>
            </div>
          ))}
        </div>
        <ProgressBar pct={accuracy} color={accentColor} height={10} />
        <p style={{ color:C.muted,fontSize:13,fontWeight:600,marginTop:10 }}>{message}</p>
      </div>

      {/* Action buttons */}
      <div style={{ display:"flex",gap:10,marginBottom:20,flexWrap:"wrap" }}>
        <Btn onClick={onRetryAll} outline color={C.purple} style={{ flex:1 }}>🔄 Retry All</Btn>
        {wrong.length>0&&(
          <Btn onClick={onRetryWrong} color={C.fire} style={{ flex:1,boxShadow:`0 4px 0 ${C.fire}55` }}>
            🎯 Retry {wrong.length} Wrong
          </Btn>
        )}
        <Btn onClick={onGoLesson} color={accuracy<60?C.fire:C.mint} style={{ flex:1,boxShadow:`0 4px 0 ${accuracy<60?C.fire:C.mint}55` }}>
          {accuracy<60?"📖 Review Lesson":"📖 Back to Lesson"}
        </Btn>
      </div>

      {/* Question review */}
      <div style={{ background:"#fff",borderRadius:16,border:"1.5px solid #E8E8EE",overflow:"hidden" }}>
        <div style={{ padding:"14px 20px",borderBottom:"1px solid #F0EDE8",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#FAFAF8" }}>
          <span style={{ fontFamily:"'Baloo 2'",fontWeight:800,fontSize:15,color:C.navy }}>📋 Review Answers</span>
          <div style={{ display:"flex",gap:6 }}>
            {[["all",`All ${total}`],["wrong",`Wrong (${wrong.length})`],["correct",`Correct (${correct})`]].map(([f,label])=>(
              <button key={f} onClick={()=>setReviewFilter(f)} style={{ padding:"4px 12px",borderRadius:20,cursor:"pointer",fontWeight:700,fontSize:11,border:`1.5px solid ${reviewFilter===f?C.navy:"#E8E8EE"}`,background:reviewFilter===f?C.navy:"#fff",color:reviewFilter===f?"#fff":C.muted }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ maxHeight:500,overflowY:"auto" }}>
          {reviewItems.map((r,i)=>(
            <ReviewItem key={i} index={results.indexOf(r)} question={r.question} selectedIdx={r.selectedIdx} isCorrect={r.isCorrect} opts={parseOptions(r.question?.options)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Active Session ────────────────────────────────────────────
function PracticeSession({ questions, config, onBack, onResults }) {
  const pool         = useRef(shuffleArray(questions));
  const limit        = config.mode==="count"?config.count:Infinity;
  const totalSeconds = config.mode==="time"?config.mins*60:null;

  const [qIndex,    setQIndex]    = useState(0);
  const [selected,  setSelected]  = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [results,   setResults]   = useState([]);
  const [timeLeft,  setTimeLeft]  = useState(totalSeconds);
  const [flagged,   setFlagged]   = useState({});
  const [flagging,  setFlagging]  = useState(false);
  const finishedRef = useRef(false);

  const currentQ = pool.current[qIndex%pool.current.length];
  const opts = parseOptions(currentQ?.options);
  const correctSoFar = results.filter(r=>r.isCorrect).length;

  const handleFlag = async () => {
    if (!currentQ?.id||flagged[currentQ.id]||flagging) return;
    setFlagging(true);
    try { await flagQuestion(currentQ.id); setFlagged(f=>({...f,[currentQ.id]:true})); }
    catch(e){ console.error("Flag failed:",e); }
    setFlagging(false);
  };

  // Timer
  useEffect(()=>{
    if(totalSeconds===null) return;
    if(timeLeft<=0){
      if(!finishedRef.current){ finishedRef.current=true; onResults(results); }
      return;
    }
    const id=setTimeout(()=>setTimeLeft(t=>t-1),1000);
    return ()=>clearTimeout(id);
  },[timeLeft,totalSeconds]);

  const advance = (newResults) => {
    const next = qIndex+1;
    if(next>=limit||next>=pool.current.length){
      if(!finishedRef.current){ finishedRef.current=true; onResults(newResults); }
    } else {
      setQIndex(next); setSelected(null); setConfirmed(false);
    }
  };

  const handleConfirm = () => {
    if(selected===null) return;
    const isCorrect = selected===currentQ.answer;
    const newResults = [...results,{isCorrect,selectedIdx:selected,question:currentQ}];
    setConfirmed(true);
    setResults(newResults);
    if(config.mode==="time") setTimeout(()=>advance(newResults),1500);
  };

  const displayMins = Math.floor((timeLeft||0)/60);
  const displaySecs = (timeLeft||0)%60;
  const pct     = limit<Infinity?Math.round((qIndex/limit)*100):0;
  const timePct = totalSeconds?Math.round(((totalSeconds-(timeLeft||0))/totalSeconds)*100):0;

  return (
    <div style={{ maxWidth:560,margin:"0 auto",padding:"28px 16px 100px" }}>
      {/* Header */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
        <button onClick={onBack} style={{ background:"transparent",border:"none",color:C.muted,fontSize:14,fontWeight:700,cursor:"pointer" }}>✕ Exit</button>
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          {config.mode==="time"&&(
            <div style={{ background:timeLeft<=10?"#FFE8E8":"#E8F5FF",border:`2px solid ${timeLeft<=10?"#E74C3C":C.sky}44`,borderRadius:50,padding:"4px 16px",fontFamily:"'Baloo 2'",fontWeight:900,fontSize:18,color:timeLeft<=10?"#E74C3C":C.sky }}>
              ⏱ {displayMins}:{String(displaySecs).padStart(2,"0")}
            </div>
          )}
          <Pill color={C.purple}>{limit<Infinity?`${qIndex+1}/${limit}`:`Q${qIndex+1}`}</Pill>
          <Pill color={C.mint}>✓ {correctSoFar}</Pill>
        </div>
      </div>

      {/* Progress bars */}
      {limit<Infinity&&<div style={{ marginBottom:20 }}><ProgressBar pct={pct} color={C.purple}/></div>}
      {config.mode==="time"&&<div style={{ marginBottom:20 }}><ProgressBar pct={timePct} color={timeLeft<=10?"#E74C3C":C.sky}/></div>}

      {/* Question */}
      <div className="card anim-scaleIn" key={qIndex} style={{ padding:28,marginBottom:18 }}>
        <div style={{ display:"flex",gap:12,marginBottom:20,alignItems:"flex-start" }}>
          <div style={{ width:36,height:36,borderRadius:12,flexShrink:0,background:`linear-gradient(135deg,${C.purple},${C.sky})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:"#fff" }}>Q</div>
          <p style={{ fontWeight:700,fontSize:16,color:C.navy,lineHeight:1.6,paddingTop:4,margin:0 }}>{currentQ.question}</p>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {opts.map((opt,oi)=>{
            let bg="#F8F5F0",border=C.border,textColor=C.navy;
            if(!confirmed&&selected===oi){bg=`${C.purple}12`;border=C.purple;textColor=C.purple;}
            if(confirmed&&oi===currentQ.answer){bg=`${C.mint}18`;border=C.mint;textColor="#1a5c3a";}
            if(confirmed&&oi===selected&&oi!==currentQ.answer){bg="#FFE8E8";border="#E74C3C";textColor="#C0392B";}
            return(
              <div key={oi} onClick={()=>!confirmed&&setSelected(oi)} style={{ padding:"13px 18px",borderRadius:16,border:`2.5px solid ${border}`,background:bg,color:textColor,fontWeight:700,fontSize:15,cursor:confirmed?"default":"pointer",display:"flex",alignItems:"center",gap:10,transition:"all 0.15s" }}>
                <span style={{ width:26,height:26,borderRadius:8,flexShrink:0,background:`${border}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900 }}>
                  {confirmed?(oi===currentQ.answer?"✓":oi===selected?"✗":String.fromCharCode(65+oi)):String.fromCharCode(65+oi)}
                </span>
                {opt}
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      {confirmed&&currentQ.explanation&&(
        <div className="anim-fadeUp" style={{ marginBottom:12,padding:"14px 18px",borderRadius:16,background:"#EEF4FF",border:`1.5px solid ${C.sky}33` }}>
          <div style={{ fontWeight:800,fontSize:12,color:C.sky,marginBottom:6,letterSpacing:0.5 }}>💡 EXPLANATION</div>
          <div style={{ fontSize:14,fontWeight:600,color:C.navy,lineHeight:1.65 }}>{currentQ.explanation}</div>
        </div>
      )}

      {/* Source badge */}
      {confirmed&&currentQ.source&&currentQ.source!=="Original"&&(
        <div style={{ textAlign:"center",marginBottom:10 }}>
          <span style={{ fontSize:11,fontWeight:700,color:"#6C63FF",background:"#EEF",padding:"2px 10px",borderRadius:20 }}>
            📚 {currentQ.source}
          </span>
        </div>
      )}

      {/* Buttons */}
      {!confirmed&&<Btn onClick={handleConfirm} disabled={selected===null} size="lg" color={C.purple} style={{ width:"100%",boxShadow:`0 5px 0 ${C.purple}66` }}>Confirm Answer</Btn>}
      {confirmed&&config.mode==="count"&&<Btn onClick={()=>advance(results)} size="lg" color={C.sky} style={{ width:"100%",boxShadow:`0 5px 0 ${C.sky}66` }}>Next Question →</Btn>}

      {confirmed&&(
        <div style={{ marginTop:10,textAlign:"center" }}>
          <button onClick={handleFlag} disabled={flagged[currentQ?.id]||flagging} style={{ background:"transparent",border:"none",cursor:flagged[currentQ?.id]?"default":"pointer",fontSize:12,fontWeight:700,color:flagged[currentQ?.id]?C.muted:"#E74C3C",opacity:flagged[currentQ?.id]?0.5:1 }}>
            {flagged[currentQ?.id]?"✓ Flagged — thanks!":"🚩 Flag as incorrect"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Orchestrator ──────────────────────────────────────────────
export default function PracticeModule({ subtopicId, subtopic, onBack }) {
  const [phase,   setPhase]   = useState("setup");
  const [config,  setConfig]  = useState(null);
  const [pool,    setPool]    = useState(null);
  const [results, setResults] = useState([]);

  const { lesson, questions: lessonQuestions, loading: lessonLoading } = useLesson(subtopicId);
  const { questions: extendedQuestions, loading: extLoading } = useExtendedQuestions(lesson?.id ?? null);
  const allQuestions = extendedQuestions?.length ? extendedQuestions : lessonQuestions || [];
  const loading = lessonLoading || extLoading;

  const startSession = (cfg, questionPool) => {
    setConfig(cfg);
    setPool(questionPool || allQuestions);
    setPhase("session");
  };

  if (loading) return (
    <div style={{ maxWidth:480,margin:"0 auto",padding:"80px 24px",textAlign:"center" }}>
      <div style={{ fontSize:48,marginBottom:16 }}>⏳</div>
      <div style={{ fontFamily:"'Baloo 2'",fontWeight:900,fontSize:22,color:C.navy }}>Loading questions…</div>
    </div>
  );

  if (!allQuestions.length) return (
    <div style={{ maxWidth:480,margin:"0 auto",padding:"80px 24px",textAlign:"center" }}>
      <div style={{ fontSize:48,marginBottom:16 }}>📭</div>
      <div style={{ fontFamily:"'Baloo 2'",fontWeight:900,fontSize:22,color:C.navy,marginBottom:10 }}>No practice questions yet</div>
      <p style={{ color:C.muted,fontWeight:600,marginBottom:24 }}>Questions for <strong>{subtopic?.name}</strong> haven't been generated yet.</p>
      <Btn onClick={onBack} outline color={C.muted}>← Back to Lesson</Btn>
    </div>
  );

  if (phase==="session"&&config&&pool) return (
    <PracticeSession
      questions={pool}
      config={config}
      onBack={()=>setPhase("setup")}
      onResults={res=>{ setResults(res); setPhase("results"); }}
    />
  );

  if (phase==="results") {
    const wrongQs = results.filter(r=>!r.isCorrect).map(r=>r.question).filter(Boolean);
    return (
      <PracticeResults
        results={results}
        subtopicName={subtopic?.name||"Topic"}
        onRetryAll={()=>startSession(config, allQuestions)}
        onRetryWrong={()=>wrongQs.length>0&&startSession({mode:"count",count:wrongQs.length}, wrongQs)}
        onGoLesson={onBack}
      />
    );
  }

  return (
    <PracticeSetup
      subtopicName={subtopic?.name||"Topic"}
      questionCount={allQuestions.length}
      onStart={cfg=>startSession(cfg, allQuestions)}
      onBack={onBack}
    />
  );
}