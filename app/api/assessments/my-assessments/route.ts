import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongodb";
import { getAuthFromRequest } from "@/lib/auth";
import Assessment from "@/lib/models/Assessment";
import IndexVersion from "@/lib/models/IndexVersion";
import Pillar from "@/lib/models/Pillar";
import Dimension from "@/lib/models/Dimension";
import Question from "@/lib/models/Question";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();

    const assessments = await Assessment.find({ userId: auth.id })
      .populate("indexVersionId", "name")
      .populate("pillarScores.pillarId", "name")
      .populate("dimensionScores.dimensionId", "name")
      .sort({ completedAt: -1 })
      .lean();

    // Format assessments
    const formattedAssessments = assessments.map((a: any) => ({
      _id: a._id.toString(),
      versionName: a.indexVersionId?.name || "Unknown",
      overallScore: a.overallScore,
      status: a.status,
      completedAt: a.completedAt,
      pillarScores: a.pillarScores || [],
      dimensionScores: a.dimensionScores || [],
    }));

    return NextResponse.json({ assessments: formattedAssessments });
  } catch (error: any) {
    console.error("Get assessments error:", error);
    return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 });
  }
}
