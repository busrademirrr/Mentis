import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `
Sen profesyonel bir içerik üreticisisin.

MentisApp bilgi platformu için kullanıcıların girdiği konu başlıklarına dair yapılandırılmış JSON döneceksin.

Kurallar:

- Sadece JSON döndür.
- Markdown kullanma.
- JSON şu alanları içermeli:

{
  "title": "",
  "short_description": "",
  "content": "",
  "did_you_know": "",
  "tags": [],
  "category": ""
}

Kategori yalnızca şunlardan biri olabilir:

Felsefe
Tarih
Sanat
Bilim
Teknoloji
Genel

Asla JSON dışında açıklama yazma.
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const { topic } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({
          error: "Topic is required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY not found",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const MODEL = "gemini-2.5-flash";

    console.log("TOPIC:", topic);
    console.log("MODEL:", MODEL);
    console.log("API KEY EXISTS:", !!GEMINI_API_KEY);

    let response: Response | null = null;
    let lastError = "";

    // 503 gelirse 3 kez tekrar dene
    for (let attempt = 1; attempt <= 3; attempt++) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: SYSTEM_PROMPT,
                },
              ],
            },
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Konu: ${topic}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (response.ok) {
        break;
      }

      lastError = await response.text();

      console.error(
        `Attempt ${attempt} failed:`,
        response.status,
        lastError
      );

      if (response.status === 503 && attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }

      break;
    }

    if (!response || !response.ok) {
      return new Response(
        JSON.stringify({
          error: "Gemini API Error",
          details: lastError,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await response.json();

    const generatedText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("Model returned empty response");
    }

    const parsedData = JSON.parse(generatedText);

    return new Response(JSON.stringify(parsedData), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("EDGE FUNCTION ERROR:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
