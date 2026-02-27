// supabase/functions/generate-lesson/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractJSON(text: string): any {
  let clean = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  const firstBrace = clean.search(/[{[]/);
  const lastBrace  = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]"));
  if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON in response");
  return JSON.parse(clean.slice(firstBrace, lastBrace + 1));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { subtopic_id } = body;

    if (!subtopic_id) {
      return new Response(JSON.stringify({ error: "subtopic_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Fetch subtopic + topic
    const { data: subtopic, error: subErr } = await supabase
      .from("subtopics").select("id, name, topic_id").eq("id", subtopic_id).maybeSingle();
    if (subErr) throw new Error(`DB error: ${subErr.message}`);
    if (!subtopic) return new Response(JSON.stringify({ error: "Subtopic not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const { data: topic, error: topicErr } = await supabase
      .from("topics").select("id, name, learning_path_id").eq("id", subtopic.topic_id).maybeSingle();
    if (topicErr) throw new Error(`DB error: ${topicErr.message}`);
    if (!topic) return new Response(JSON.stringify({ error: "Topic not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // 2. Guard: lesson already exists?
    const { data: existing } = await supabase
      .from("lessons").select("id").eq("subtopic_id", subtopic_id).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ message: "Lesson already exists", lesson_id: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Fetch curriculum
    const { data: currFiles } = await supabase
      .from("curriculum_files").select("raw_text")
      .eq("learning_path_id", topic.learning_path_id)
      .order("created_at", { ascending: false }).limit(1);
    const ctx = currFiles?.[0]?.raw_text ? `\n\nCURRICULUM CONTEXT:\n${currFiles[0].raw_text.slice(0, 5000)}` : "";

    // 4. Call AI
    const prompt = `You are a mathematics teacher. Create a lesson on "${subtopic.name}" (topic: "${topic.name}").${ctx}

Return ONLY this JSON object, no markdown, no extra text:
{
  "title": "Lesson title",
  "introduction": "2-3 sentence friendly intro connecting to real life",
  "explanation": "3-4 paragraph explanation. Use **bold** for key terms. Separate paragraphs with \\n\\n",
  "examples": [
    {"title": "Example 1", "problem": "Problem statement", "steps": ["Step 1", "Step 2", "✅ Answer: ..."]},
    {"title": "Example 2", "problem": "Problem statement", "steps": ["Step 1", "✅ Answer: ..."]}
  ],
  "questions": [
    {"question": "Q1?", "options": ["A", "B", "C", "D"], "answer": 0, "explanation": "Why A is correct"},
    {"question": "Q2?", "options": ["A", "B", "C", "D"], "answer": 2, "explanation": "Why C is correct"},
    {"question": "Q3?", "options": ["A", "B", "C", "D"], "answer": 1, "explanation": "Why B is correct"}
  ]
}

Write for secondary school students. questions must have exactly 3 items. answer is 0-based index.`;

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const openaiKey    = Deno.env.get("OPENAI_API_KEY");
    let lessonData: any = null;

    if (anthropicKey) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-3-5-sonnet-20241022", max_tokens: 4096, messages: [{ role: "user", content: prompt }] }),
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(`Claude ${res.status}: ${txt}`);
      lessonData = extractJSON(JSON.parse(txt).content?.[0]?.text ?? "");

    } else if (openaiKey) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: "gpt-4o", response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(`OpenAI ${res.status}: ${txt}`);
      lessonData = JSON.parse(JSON.parse(txt).choices?.[0]?.message?.content ?? "{}");

    } else {
      throw new Error("No AI key configured.");
    }

    if (!lessonData?.title) throw new Error(`AI returned invalid lesson. Got: ${JSON.stringify(lessonData)}`);

    // 5. Insert lesson
    const { data: lessonRow, error: lessonErr } = await supabase
      .from("lessons")
      .insert({
        subtopic_id:  subtopic_id,
        title:        lessonData.title,
        introduction: lessonData.introduction ?? "",
        explanation:  lessonData.explanation ?? "",
        approved:     false,
        ai_generated: true,
        generated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (lessonErr || !lessonRow) throw new Error(`Lesson insert failed: ${lessonErr?.message}`);

    // 6. Insert examples
    const examples = (lessonData.examples ?? []).filter((e: any) => e?.title);
    if (examples.length > 0) {
      const { error: exErr } = await supabase.from("lesson_examples").insert(
        examples.map((ex: any, i: number) => ({
          lesson_id:  lessonRow.id,
          title:      ex.title,
          problem:    ex.problem ?? "",
          steps:      JSON.stringify(Array.isArray(ex.steps) ? ex.steps : []),
          sort_order: i,
        }))
      );
      if (exErr) console.error("Examples insert error:", exErr.message);
    }

    // 7. Insert practice questions
    const questions = (lessonData.questions ?? []).filter((q: any) => q?.question);
    if (questions.length > 0) {
      const { error: qErr } = await supabase.from("practice_questions").insert(
        questions.map((q: any, i: number) => ({
          lesson_id:   lessonRow.id,
          category:    "lesson",
          question:    q.question,
          options:     JSON.stringify(Array.isArray(q.options) ? q.options : []),
          answer:      typeof q.answer === "number" ? q.answer : 0,
          explanation: q.explanation ?? "",
          sort_order:  i,
          ai_generated: true,
        }))
      );
      if (qErr) console.error("Questions insert error:", qErr.message);
    }

    return new Response(
      JSON.stringify({ success: true, lesson_id: lessonRow.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("generate-lesson error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
