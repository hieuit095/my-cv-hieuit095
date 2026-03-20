import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TOGETHER_API_KEY = Deno.env.get("TOGETHER_API_KEY");
const TOGETHER_BASE_URL = "https://api.together.xyz/v1";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { idea, documentText, userId } = await req.json();

    if (!TOGETHER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "TOGETHER_API_KEY is not configured. Please add it to your edge function secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!idea || !userId) {
      return new Response(
        JSON.stringify({ error: "idea and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userContent = [
      `Blog idea: ${idea}`,
      documentText ? `\n\nAdditional context from attached document:\n${documentText}` : "",
    ].join("");

    const systemPrompt = `You are an expert blog writer. Generate a comprehensive, engaging, well-structured blog post.

Return ONLY a valid JSON object with these exact fields:
{
  "title": "Compelling blog post title",
  "excerpt": "A 1-2 sentence summary under 300 characters",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "reading_time": 7,
  "image_prompts": [
    "detailed artistic image prompt for cover/intro image",
    "detailed artistic image prompt for mid-article image",
    "detailed artistic image prompt for conclusion image"
  ],
  "content": "Full markdown content with {{IMAGE_0}}, {{IMAGE_1}}, {{IMAGE_2}} placeholders"
}

Rules:
- content must be rich markdown: use H2/H3 headers, bullet lists, bold text, code blocks if relevant
- Place {{IMAGE_0}} right after the intro paragraph (it will also be the cover image)
- Place {{IMAGE_1}} between major sections
- Place {{IMAGE_2}} near the end before conclusion (optional, only if it adds value)
- image_prompts must be vivid, descriptive prompts for an AI image generator matching the article's topic and mood
- reading_time should be realistic (average 200 words per minute)
- Return ONLY the JSON object, no markdown fences, no extra text`;

    const llamaResponse = await fetch(`${TOGETHER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOGETHER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!llamaResponse.ok) {
      const err = await llamaResponse.text();
      throw new Error(`Text generation failed: ${err}`);
    }

    const llamaData = await llamaResponse.json();
    const rawContent = llamaData.choices?.[0]?.message?.content || "";

    let blogData: {
      title: string;
      excerpt: string;
      tags: string[];
      reading_time: number;
      image_prompts: string[];
      content: string;
    };

    try {
      const jsonMatch = rawContent.match(/```json\n?([\s\S]*?)\n?```/) || rawContent.match(/({[\s\S]*})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : rawContent;
      blogData = JSON.parse(jsonStr.trim());
    } catch {
      throw new Error("Failed to parse AI response. Please try again.");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const imageUrls: string[] = [];
    const prompts: string[] = blogData.image_prompts || [];

    for (let i = 0; i < Math.min(prompts.length, 3); i++) {
      try {
        const imgResponse = await fetch(`${TOGETHER_BASE_URL}/images/generations`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${TOGETHER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "Lykon/DreamShaper",
            prompt: prompts[i],
            n: 1,
            steps: 20,
            width: 1024,
            height: 576,
            response_format: "b64_json",
          }),
        });

        if (!imgResponse.ok) {
          console.error(`Image ${i} generation failed: ${await imgResponse.text()}`);
          imageUrls.push("");
          continue;
        }

        const imgData = await imgResponse.json();
        const b64 = imgData.data?.[0]?.b64_json;

        if (!b64) {
          imageUrls.push("");
          continue;
        }

        const binaryStr = atob(b64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let j = 0; j < binaryStr.length; j++) {
          bytes[j] = binaryStr.charCodeAt(j);
        }

        const filePath = `${userId}/blog/ai-${Date.now()}-${i}.png`;
        const { error: uploadError } = await supabase.storage
          .from("project-images")
          .upload(filePath, bytes, { contentType: "image/png" });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          imageUrls.push("");
        } else {
          const { data } = supabase.storage.from("project-images").getPublicUrl(filePath);
          imageUrls.push(data.publicUrl);
        }
      } catch (e) {
        console.error(`Error processing image ${i}:`, e);
        imageUrls.push("");
      }
    }

    let finalContent = blogData.content || "";
    for (let i = 0; i < imageUrls.length; i++) {
      if (imageUrls[i]) {
        finalContent = finalContent.replace(
          `{{IMAGE_${i}}}`,
          `\n\n![${blogData.title} - Image ${i + 1}](${imageUrls[i]})\n\n`
        );
      } else {
        finalContent = finalContent.replace(`{{IMAGE_${i}}}`, "");
      }
    }

    return new Response(
      JSON.stringify({
        title: blogData.title || "",
        excerpt: blogData.excerpt || "",
        tags: Array.isArray(blogData.tags) ? blogData.tags.join(", ") : "",
        reading_time: blogData.reading_time || 5,
        content: finalContent,
        cover_image_url: imageUrls[0] || "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
