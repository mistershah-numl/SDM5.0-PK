import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import Assessment from "@/lib/models/Assessment";
import IndexVersion from "@/lib/models/IndexVersion";
import Pillar from "@/lib/models/Pillar";
import Dimension from "@/lib/models/Dimension";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const assessments = await Assessment.find({ userId: auth.id })
      .populate({
        path: "indexVersionId",
        model: IndexVersion,
        select: "name",
      })
      .populate({
        path: "pillarScores.pillarId",
        model: Pillar,
        select: "name",
      })
      .populate({
        path: "dimensionScores.dimensionId",
        model: Dimension,
        select: "name",
      })
      .sort({ completedAt: -1 })
      .lean();

    // Format assessments with proper name extraction
    const formattedAssessments = assessments.map((a: any) => ({
      _id: a._id.toString(),
      versionName: a.indexVersionId?.name || "Unknown",
      overallScore: a.overallScore,
      status: a.status,
      completedAt: a.completedAt,
      pillarScores: (a.pillarScores || []).map((ps: any) => ({
        pillarId: ps.pillarId?._id || ps.pillarId,
        score: ps.score,
        name: ps.pillarId?.name || "Unknown Pillar",
      })),
      dimensionScores: (a.dimensionScores || []).map((ds: any) => ({
        dimensionId: ds.dimensionId?._id || ds.dimensionId,
        score: ds.score,
        name: ds.dimensionId?.name || "Unknown Dimension",
      })),
    }));

    return NextResponse.json({ assessments: formattedAssessments });
  } catch (error: any) {
    console.error("Get assessments error:", error);
    return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 });
  }
}
