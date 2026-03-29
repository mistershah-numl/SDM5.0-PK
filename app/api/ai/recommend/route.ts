import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import SurveyResponse from "@/lib/models/SurveyResponse";
import Company from "@/lib/models/Company";
import AIReport from "@/lib/models/AIReport";
import { generateText } from "ai";
import { xai } from "@ai-sdk/xai";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { surveyResponseId } = await req.json();

    if (!surveyResponseId) {
      return NextResponse.json({ error: "surveyResponseId is required" }, { status: 400 });
    }

    // Check if report already exists
    const existing = await AIReport.findOne({ surveyResponseId }).lean();
    if (existing) {
      return NextResponse.json({ report: existing });
    }

    const response = await SurveyResponse.findById(surveyResponseId).lean();
    if (!response) {
      return NextResponse.json({ error: "Survey response not found" }, { status: 404 });
    }

    const company = await Company.findById(response.companyId).lean();
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Build structured context for AI
    const allDimensions = response.scores.pillars.flatMap((p) =>
      p.dimensions.map((d) => ({ pillar: p.name, dimension: d.name, score: d.score }))
    );

    const weakDimensions = allDimensions
      .filter((d) => d.score < 2.5)
      .sort((a, b) => a.score - b.score);

    const strongDimensions = allDimensions
      .filter((d) => d.score >= 3.0)
      .sort((a, b) => b.score - a.score);

    const prompt = `You are an expert consultant specializing in Sustainable Digital Maturity for Small and Medium-Sized Enterprises (SMEs). You are analyzing the results of an SDM 5.0 assessment based on the Industry 5.0 framework.

COMPANY PROFILE:
- Name: ${company.name}
- Industry: ${company.industry}
- Size: ${company.size} enterprise
- Region: ${company.region}

ASSESSMENT RESULTS:
- Overall SDM Score: ${response.scores.overall}/5.0
- Maturity Level: ${response.scores.maturityName} (Level ${response.scores.maturityLevel}/5)
- Benchmark Percentile: ${response.benchmarkPercentile || "N/A"}th percentile

PILLAR SCORES:
${response.scores.pillars.map((p) => `- ${p.name}: ${p.score}/5.0`).join("\n")}

DIMENSION SCORES:
${allDimensions.map((d) => `- ${d.pillar} > ${d.dimension}: ${d.score}/5.0`).join("\n")}

WEAKEST DIMENSIONS (below 2.5):
${weakDimensions.length > 0 ? weakDimensions.map((d) => `- ${d.dimension} (${d.pillar}): ${d.score}`).join("\n") : "None - all dimensions score 2.5 or above"}

STRONGEST DIMENSIONS (3.0 and above):
${strongDimensions.length > 0 ? strongDimensions.map((d) => `- ${d.dimension} (${d.pillar}): ${d.score}`).join("\n") : "None - all dimensions score below 3.0"}

Please generate a comprehensive analysis in the following JSON structure:
{
  "executiveSummary": "A 3-4 paragraph executive summary of the company's sustainable digital maturity position, key findings, and overall outlook",
  "strengthsAnalysis": "Detailed analysis of the company's strongest areas, what they're doing well, and how to leverage these strengths",
  "weaknessesAnalysis": "Detailed analysis of areas needing improvement, root cause insights, and impact on overall sustainability goals",
  "roadmapRecommendations": "Structured roadmap with short-term (0-6 months), medium-term (6-18 months), and long-term (18-36 months) recommendations specific to this company's profile",
  "nextBestActions": ["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"]
}

The nextBestActions should be 5 specific, prioritized, and immediately actionable items.

Respond ONLY with the JSON object, no other text.`;

    const { text } = await generateText({
      model: xai("grok-3-mini"),
      prompt,
      maxTokens: 4000,
    });

    // Parse AI response
    let parsed;
    try {
      // Remove any markdown code fences if present
      const cleaned = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        executiveSummary: text,
        strengthsAnalysis: "",
        weaknessesAnalysis: "",
        roadmapRecommendations: "",
        nextBestActions: [],
      };
    }

    const report = await AIReport.create({
      surveyResponseId,
      companyId: response.companyId,
      executiveSummary: parsed.executiveSummary || "",
      strengthsAnalysis: parsed.strengthsAnalysis || "",
      weaknessesAnalysis: parsed.weaknessesAnalysis || "",
      roadmapRecommendations: parsed.roadmapRecommendations || "",
      nextBestActions: parsed.nextBestActions || [],
      model: "grok-3-mini",
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "AI recommendation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
