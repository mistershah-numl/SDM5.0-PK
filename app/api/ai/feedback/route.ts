import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(req: NextRequest) {
  try {
    const { questions, answers, scores, companyName } = await req.json();

    if (!questions || !answers || !scores) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `You are an expert consultant specializing in Sustainable Digital Maturity 5.0 for SMEs, based on Prof. Myriam Ertz's research.

Company: ${companyName || "Assessment Client"}
Overall SDM 5.0 Score: ${scores.overall}/5.0
Maturity Level: ${scores.maturityName} (Level ${scores.maturityLevel}/5)

Pillar Scores:
${scores.pillars?.map((p: any) => `- ${p.name}: ${p.score}/5.0`).join("\n") || ""}

Provide constructive feedback in this exact JSON format only:

{
  "overallFeedback": "A clear 2-3 sentence summary of the company's sustainable digital maturity status",
  "dimensionalInsights": {
    "Pillar Name": {
      "Dimension Name": "Specific, practical feedback for this dimension"
    }
  },
  "keyObservations": ["Observation 1", "Observation 2", "Observation 3"],
  "immediateActions": ["Action 1", "Action 2", "Action 3"],
  "scoreJustification": "Explanation based on 60% ICT for Sustainability + 40% Sustainable ICT weighting"
}

Respond ONLY with valid JSON. No extra text.`;

    const { text } = await generateText({
      model: google("gemini-2.0-flash", {
        apiKey: process.env.GOOGLE_API_KEY,   // Explicitly pass your key
      }),
      prompt,
      maxTokens: 1500,
    });

    let parsed;
    try {
      const cleaned = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      parsed = {
        overallFeedback: text.substring(0, 600),
        dimensionalInsights: {},
        keyObservations: ["AI response could not be parsed"],
        immediateActions: ["Review assessment manually"],
        scoreJustification: "Weighted 60/40 scoring applied",
      };
    }

    return NextResponse.json({ feedback: parsed });
  } catch (error: any) {
    console.error("AI Feedback Error:", error);
    return NextResponse.json({ error: error.message || "AI feedback failed" }, { status: 500 });
  }
}