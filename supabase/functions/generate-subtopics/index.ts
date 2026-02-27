// supabase/functions/generate-subtopics/index.ts

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
    const { topic_id } = body;

    if (!topic_id) {
      return new Response(JSON.stringify({ error: "topic_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Fetch topic
    const { data: topic, error: tErr } = await supabase
      .from("topics").select("id, name, learning_path_id").eq("id", topic_id).maybeSingle();
    if (tErr) throw new Error(`DB error: ${tErr.message}`);
    if (!topic) return new Response(JSON.stringify({ error: "Topic not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // 2. Guard: subtopics already exist?
    const { data: existing } = await supabase
      .from("subtopics").select("id").eq("topic_id", topic_id).eq("is_active", true).limit(1);
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: "Subtopics already exist" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Fetch curriculum context
    const { data: currFiles } = await supabase
      .from("curriculum_files").select("raw_text")
      .eq("learning_path_id", topic.learning_path_id)
      .order("created_at", { ascending: false }).limit(1);
    const ctx = currFiles?.[0]?.raw_text ? `\n\nCURRICULUM:\n${currFiles[0].raw_text.slice(0, 4000)}` : "";

    // 4. Call AI
    const prompt = `Generate 4-7 subtopics for the mathematics topic: "${topic.name}".${ctx}

Return ONLY this JSON:
{"subtopics":["Subtopic 1","Subtopic 2","Subtopic 3"]}

Keep names concise (2-5 words). Base them on the curriculum if provided.`;

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const openaiKey    = Deno.env.get("OPENAI_API_KEY");
    let subtopicNames: string[] = [];

    if (anthropicKey) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-3-5-haiku-20241022", max_tokens: 512, messages: [{ role: "user", content: prompt }] }),
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(`Claude ${res.status}: ${txt}`);
      subtopicNames = extractJSON(JSON.parse(txt).content?.[0]?.text ?? "").subtopics ?? [];

    } else if (openaiKey) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: "gpt-4o-mini", response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(`OpenAI ${res.status}: ${txt}`);
      subtopicNames = JSON.parse(JSON.parse(txt).choices?.[0]?.message?.content ?? "{}").subtopics ?? [];

    } else {
      throw new Error("No AI key configured.");
    }

    if (!subtopicNames.length) throw new Error("AI returned no subtopics");

    // 5. Write to DB
    const { error: insErr } = await supabase.from("subtopics").insert(
      subtopicNames.filter(Boolean).map((name: string, i: number) => ({
        topic_id:     topic_id,
        name:         name.trim(),
        slug:         name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        sort_order:   i,
        is_active:    true,
        ai_generated: true,
        generated_at: new Date().toISOString(),
      }))
    );
    if (insErr) throw new Error(`DB insert failed: ${insErr.message}`);

    return new Response(
      JSON.stringify({ success: true, subtopics_created: subtopicNames.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("generate-subtopics error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
