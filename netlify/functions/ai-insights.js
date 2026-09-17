// Netlify serverless function.
// Receives the summarized dashboard data from the browser, sends it to Groq's
// free LLM API, and returns a short written briefing.
//
// Set GROQ_API_KEY in Netlify: Site settings -> Environment variables.
// Get a free key at https://console.groq.com (no credit card required).

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "GROQ_API_KEY is not set in Netlify environment variables." }),
    };
  }

  let summary;
  try {
    summary = JSON.parse(event.body || "{}").summary;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body." }) };
  }

  const prompt = `You are a sales operations analyst reviewing a construction/MEP tendering pipeline.
Given this JSON summary (values in LKR millions unless noted), write a concise executive briefing of
150-200 words with three short sections: "Wins", "Risks", and "Recommendations". Be specific and use
the actual numbers from the data.

IMPORTANT: Do not calculate your own totals, sums, or averages from the per-QS arrays (qsQuoted,
qsWon, qsWinRate, qsHitRate) — you are prone to arithmetic errors when summing raw numbers. For any
grand total or overall figure (total quoted value, total won value, overall win rate, etc.), use the
"totalRow" field, which already contains the correct precomputed totals from the spreadsheet, in the
same column order as the qsSummary table (Total Projects, Active, Submitted, Won, Lost, Total Quoted
Value, Won Value, Win Rate, Hit Rate, Sales Funnel Achievement, Business Obtaining). Do not invent
numbers that aren't in the data.

Never mention field names, variable names, array indices, or any part of the JSON's internal
structure in your output (e.g. do not write things like "totalRow", "pipeValues[1]", "(qsWon)").
Write purely in plain business language, as if explaining the numbers to a sales manager who has
never seen the underlying spreadsheet or data model.

DATA:
${JSON.stringify(summary, null, 2)}`;

  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1200,
        reasoning_effort: "low",
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify({ error: data.error || data }) };
    }

    const insight = data.choices?.[0]?.message?.content?.trim() || "No response generated.";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insight }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
