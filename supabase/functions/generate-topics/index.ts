// supabase/functions/generate-topics/index.ts

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
  if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found in AI response");
  return JSON.parse(clean.slice(firstBrace, lastBrace + 1));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { learning_path_id } = body;

    if (!learning_path_id) {
      return new Response(JSON.stringify({ error: "learning_path_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Fetch learning path
    const { data: lp, error: lpErr } = await supabase
      .from("learning_paths")
      .select("id, name, grade, mode")
      .eq("id", learning_path_id)
      .maybeSingle();

    if (lpErr) throw new Error(`DB error: ${lpErr.message}`);
    if (!lp)   return new Response(JSON.stringify({ error: "Learning path not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // 2. Guard: topics already exist?
    const { data: existing } = await supabase
      .from("topics").select("id").eq("learning_path_id", learning_path_id).eq("is_active", true).limit(1);
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: "Topics already exist" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Fetch curriculum
    const { data: currFiles, error: currErr } = await supabase
      .from("curriculum_files")
      .select("raw_text")
      .eq("learning_path_id", learning_path_id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (currErr) throw new Error(`DB error fetching curriculum: ${currErr.message}`);
    const curriculumText = currFiles?.[0]?.raw_text?.trim();
    if (!curriculumText) {
      return new Response(JSON.stringify({ error: "No curriculum found for this learning path" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Call AI
    const prompt = `Extract topics from this ${lp.grade ?? "secondary school"} mathematics curriculum.

Return ONLY this JSON, no other text:
{"topics":[{"name":"Topic Name","icon":"📐","subtopics":["Subtopic 1","Subtopic 2","Subtopic 3"]}]}

- Only include topics explicitly in the curriculum
- 3-6 subtopics per topic
- Use math emojis for icons

CURRICULUM:
${curriculumText.slice(0, 8000)}`;

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const openaiKey    = Deno.env.get("OPENAI_API_KEY");
    let topics: Array<{ name: string; icon: string; subtopics: string[] }> = [];

    if (anthropicKey) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-3-5-haiku-20241022", max_tokens: 2048, messages: [{ role: "user", content: prompt }] }),
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(`Claude ${res.status}: ${txt}`);
      topics = extractJSON(JSON.parse(txt).content?.[0]?.text ?? "").topics ?? [];

    } else if (openaiKey) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: "gpt-4o-mini", response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(`OpenAI ${res.status}: ${txt}`);
      topics = JSON.parse(JSON.parse(txt).choices?.[0]?.message?.content ?? "{}").topics ?? [];

    } else {
      throw new Error("No AI key set. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to Supabase secrets.");
    }

    if (!topics.length) throw new Error("AI returned no topics");

    // 5. Write to DB
    let topicsCreated = 0, subtopicsCreated = 0;
    for (let ti = 0; ti < topics.length; ti++) {
      const t = topics[ti];
      if (!t?.name) continue;

      const { data: topicRow, error: tErr } = await supabase
        .from("topics")
        .insert({
          learning_path_id: learning_path_id,
          name:         t.name.trim(),
          slug:         t.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          icon:         t.icon ?? "📖",
          sort_order:   ti,
          is_active:    true,
          ai_generated: true,
          generated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (tErr || !topicRow) { console.error("Topic insert failed:", tErr?.message); continue; }
      topicsCreated++;

      const subs = (t.subtopics ?? []).filter(Boolean);
      if (subs.length > 0) {
        const { error: sErr } = await supabase.from("subtopics").insert(
          subs.map((name: string, si: number) => ({
            topic_id:     topicRow.id,
            name:         name.trim(),
            slug:         name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            sort_order:   si,
            is_active:    true,
            ai_generated: true,
            generated_at: new Date().toISOString(),
          }))
        );
        if (sErr) console.error("Subtopic insert failed:", sErr.message);
        else subtopicsCreated += subs.length;
      }
    }

    return new Response(
      JSON.stringify({ success: true, topics_created: topicsCreated, subtopics_created: subtopicsCreated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("generate-topics error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
