import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Assessment from "@/lib/models/Assessment";
import IndexVersion from "@/lib/models/IndexVersion";
import Pillar from "@/lib/models/Pillar";
import Dimension from "@/lib/models/Dimension";
import Question from "@/lib/models/Question";
import SurveyResponse from "@/lib/models/SurveyResponse";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get("assessmentId");
    const indexVersionId = searchParams.get("indexVersionId");

    if (!assessmentId && !indexVersionId) {
      return NextResponse.json(
        { error: "assessmentId or indexVersionId required" },
        { status: 400 }
      );
    }

    let assessment;
    let iVId;

    if (assessmentId) {
      assessment = await Assessment.findById(assessmentId).lean();
      if (!assessment) {
        return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
      }
      iVId = assessment.indexVersionId;
    } else {
      iVId = indexVersionId;
    }

    const indexVersion = await IndexVersion.findById(iVId).lean();
    const pillars = await Pillar.find({ indexVersionId: iVId }).sort({ order: 1 }).lean();
    const dimensions = await Dimension.find({ indexVersionId: iVId }).sort({ order: 1 }).lean();
    const questions = await Question.find({ indexVersionId: iVId }).sort({ order: 1 }).lean();

    // Get individual responses if assessment exists
    let responses: any[] = [];
    if (assessment) {
      responses = await SurveyResponse.find({
        userId: auth.id,
        assessmentId,
      }).lean();
    }

    // Generate CSV content
    const csvContent = generateCSV(
      indexVersion,
      pillars,
      dimensions,
      questions,
      responses,
      assessment
    );

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${indexVersion.name}_Assessment_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Export failed";
    console.error("Export error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function escapeCSV(str: string | number): string {
  const stringValue = String(str);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function generateCSV(
  indexVersion: any,
  pillars: any[],
  dimensions: any[],
  questions: any[],
  responses: any[],
  assessment: any
): string {
  const lines: string[] = [];

  // Section 1: Summary
  lines.push("Assessment Summary");
  lines.push("");
  lines.push(`Index Version,${escapeCSV(indexVersion.name)}`);
  lines.push(`Assessment Date,${assessment ? new Date(assessment.createdAt).toLocaleDateString() : "N/A"}`);
  lines.push(`Overall Score,${assessment?.overallScore || "N/A"}`);
  lines.push(`Maturity Level,${assessment?.maturityLevel || "N/A"}`);
  lines.push("");

  // Section 2: Pillar Scores
  lines.push("Pillar Scores");
  lines.push("Pillar Name,Score,Weight");
  pillars.forEach((p) => {
    const pillarScore = assessment?.pillarScores?.find(
      (ps: any) => ps.pillarId.toString() === p._id.toString()
    );
    lines.push(`${escapeCSV(p.name)},${pillarScore?.score || 0},${p.weight}`);
  });
  lines.push("");

  // Section 3: Detailed Breakdown
  lines.push("Detailed Assessment Breakdown");
  lines.push("Level,Name,Score,Weight,Type");
  
  pillars.forEach((pillar) => {
    lines.push(`Pillar,${escapeCSV(pillar.name)},,${pillar.weight},Pillar Weight`);
    
    const pillarDimensions = dimensions.filter((d) =>
      d.pillarId.toString() === pillar._id.toString()
    );

    pillarDimensions.forEach((dimension) => {
      const dimensionScore = assessment?.pillarScores
        ?.find((ps: any) => ps.pillarId.toString() === pillar._id.toString())
        ?.dimensions?.find((d: any) => d.dimensionId.toString() === dimension._id.toString());

      lines.push(
        `Dimension,${escapeCSV(dimension.name)},${dimensionScore?.score || 0},${dimension.weight},Dimension Weight`
      );

      const dimensionQuestions = questions.filter((q) =>
        q.dimensionId.toString() === dimension._id.toString()
      );

      dimensionQuestions.forEach((question) => {
        const response = responses.find((r) => r.questionId.toString() === question._id.toString());
        lines.push(
          `Question,${escapeCSV(question.text)},${response?.score || 0},${question.weight},Question Weight`
        );
      });
    });
  });

  lines.push("");

  // Section 4: Calculation Logic
  lines.push("Scoring Methodology");
  lines.push("");
  lines.push("Level,Formula,Description");
  lines.push("Question,Direct Response,User selected answer (0-5)");
  lines.push(
    "Dimension,Weighted Average of Questions,Sum of (Question Score × Weight) / Sum of Weights"
  );
  lines.push(
    "Pillar,Weighted Average of Dimensions,Sum of (Dimension Score × Weight) / Sum of Weights"
  );
  lines.push(
    "Overall,Weighted Average of Pillars,Sum of (Pillar Score × Weight) / Sum of Weights"
  );
  lines.push("");
  lines.push("Example Calculation");
  lines.push("Level,Description");
  lines.push("Dimension,Governance has 3 questions with scores: 3.5 4.0 3.2 and weights: 1 2 1");
  lines.push("Result,Dimension Score = (3.5×1 + 4.0×2 + 3.2×1) / (1+2+1) = 3.675");
  lines.push("");
  lines.push("Pillar,Strategy Pillar has 3 dimensions with scores: 3.7 3.8 3.6 and weights: 30 40 30");
  lines.push("Result,Pillar Score = (3.7×30 + 3.8×40 + 3.6×30) / (30+40+30) = 3.73");

  return lines.join("\n");
}

