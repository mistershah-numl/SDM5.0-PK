import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { connectDB } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import AIReport from "@/lib/models/AIReport";
import SurveyResponse from "@/lib/models/SurveyResponse";
import Company from "@/lib/models/Company";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { surveyResponseId } = await req.json();
    if (!surveyResponseId) {
      return NextResponse.json({ error: "surveyResponseId is required" }, { status: 400 });
    }

    const survey = await SurveyResponse.findById(surveyResponseId).lean();
    if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });

    const company = await Company.findById(survey.companyId).lean();
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const prompt = `You are an expert consultant in Industry 5.0 and Sustainable Digital Maturity for SMEs.

Company: ${company.name}
Industry: ${company.industry}
Size: ${company.size} employees
Region: ${company.region}

Overall SDM 5.0 Score: ${survey.scores.overall}/5.0
Maturity Level: ${survey.scores.maturityName}

Pillar Scores:
${survey.scores.pillars.map((p: any) => `- ${p.name}: ${p.score}/5.0`).join("\n")}

Generate a professional report in this exact JSON format only:

{
  "executiveSummary": "3-4 paragraph executive summary",
  "strengthsAnalysis": "Analysis of strong areas",
  "weaknessesAnalysis": "Analysis of areas needing improvement",
  "roadmapRecommendations": "Short-term, medium-term and long-term recommendations",
  "nextBestActions": ["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"]
}

Respond ONLY with valid JSON.`;

    const { text } = await generateText({
      model: google("gemini-2.0-flash", {
        apiKey: process.env.GOOGLE_API_KEY,   // Explicitly pass the key
      }),
      prompt,
      maxTokens: 3000,
    });

    let parsed;
    try {
      const cleaned = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      parsed = {
        executiveSummary: text.substring(0, 800),
        strengthsAnalysis: "",
        weaknessesAnalysis: "",
        roadmapRecommendations: "",
        nextBestActions: ["Train staff on sustainable technologies", "Start digital carbon tracking", "Align strategy with Industry 5.0"],
      };
    }

    const report = await AIReport.create({
      surveyResponseId,
      companyId: survey.companyId,
      executiveSummary: parsed.executiveSummary || "",
      strengthsAnalysis: parsed.strengthsAnalysis || "",
      weaknessesAnalysis: parsed.weaknessesAnalysis || "",
      roadmapRecommendations: parsed.roadmapRecommendations || "",
      nextBestActions: parsed.nextBestActions || [],
      model: "gemini-2.0-flash",
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error: any) {
    console.error("AI Recommend Error:", error);
    return NextResponse.json({ error: error.message || "AI recommendation failed" }, { status: 500 });
  }
}