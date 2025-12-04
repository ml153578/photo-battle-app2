import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PlayerSubmission {
  nickname: string;
  imageUrl: string;
}

interface JudgeRequest {
  topic: string;
  submissions: PlayerSubmission[];
  geminiApiKey: string;
}

interface RankingResult {
  nickname: string;
  rank: number;
  score: number;
  funny_critique: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { topic, submissions, geminiApiKey }: JudgeRequest = await req.json();

    if (!topic || !submissions || submissions.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const imagePromises = submissions.map(async (sub) => {
      try {
        const response = await fetch(sub.imageUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(arrayBuffer))
        );
        return {
          nickname: sub.nickname,
          base64Image: base64,
          mimeType: blob.type || "image/jpeg",
        };
      } catch (error) {
        console.error(`Error fetching image for ${sub.nickname}:`, error);
        return null;
      }
    });

    const images = (await Promise.all(imagePromises)).filter(
      (img) => img !== null
    );

    if (images.length === 0) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch any images" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const imageParts = images.map((img, index) => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64Image,
      },
    }));

    const playerList = images.map((img) => img.nickname).join(", ");

    const prompt = `You are a harsh but fair photography critic with a great sense of humor. The photography challenge topic was: "${topic}".

I will show you ${images.length} photos from different players: ${playerList}.

Your task:
1. Rank these images from best to worst based on creativity, humor, and adherence to the topic
2. Give each photo a score from 0-100
3. Write a SHORT, funny, slightly roasting critique for each (max 15 words)

Be entertaining but not mean. Make the critiques memorable!

Return ONLY a valid JSON object with this exact structure:
{
  "rankings": [
    {"nickname": "player_name", "rank": 1, "score": 95, "funny_critique": "Your funny comment here"},
    ...
  ]
}

The order should match the player order I mentioned: ${playerList}. Return one ranking per player in that exact order.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                ...imageParts,
              ],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI judgment", details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", rawResponse: responseText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const rankings = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(rankings), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in judge-photos function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});