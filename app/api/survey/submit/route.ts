import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import SurveyResponse from "@/lib/models/SurveyResponse";
import { calculateScores, calculateBenchmarkPercentile } from "@/lib/scoring-engine";

export async function POST(req: NextRequest) {
  try {
    console.log("[v0] Survey submit API called");
    const auth = await getAuthFromCookies();
    console.log("[v0] Auth check - user ID:", auth?.userId, "role:", auth?.role);
    
    if (!auth || auth.role !== "company") {
      console.log("[v0] Auth failed - not company role");
      return NextResponse.json({ error: "Forbidden - must be company user" }, { status: 403 });
    }

    if (!auth.companyId) {
      console.log("[v0] No company associated with user");
      return NextResponse.json({ error: "No company associated with this user" }, { status: 400 });
    }

    await connectDB();
    console.log("[v0] Database connected");
    
    const body = await req.json();
    const { indexVersionId, answers } = body;
    console.log("[v0] Request body - indexVersionId:", indexVersionId, "answers count:", answers?.length);

    if (!indexVersionId || !answers || !Array.isArray(answers)) {
      console.log("[v0] Missing required fields");
      return NextResponse.json(
        { error: "indexVersionId and answers array are required" },
        { status: 400 }
      );
    }

    // Calculate scores dynamically
    console.log("[v0] Calculating scores");
    const scores = await calculateScores(indexVersionId, answers);
    console.log("[v0] Scores calculated - overall:", scores.overall);

    // Create the survey response
    console.log("[v0] Creating survey response document");
    const response = await SurveyResponse.create({
      companyId: auth.companyId,
      indexVersionId,
      userId: auth.userId,
      answers,
      scores,
      submittedAt: new Date(),
    });
    console.log("[v0] Survey response created with ID:", response._id);

    // Calculate benchmark percentile
    console.log("[v0] Calculating benchmark percentile");
    const benchmarkPercentile = await calculateBenchmarkPercentile(
      indexVersionId,
      scores.overall
    );

    // Update with benchmark
    response.benchmarkPercentile = benchmarkPercentile;
    await response.save();
    console.log("[v0] Survey submission successful");

    return NextResponse.json(
      {
        surveyResponse: {
          id: response._id,
          scores: response.scores,
          benchmarkPercentile,
          submittedAt: response.submittedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[v0] Survey submit error:", error);
    const msg = error instanceof Error ? error.message : "Survey submission failed";
    console.error("[v0] Error details:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
