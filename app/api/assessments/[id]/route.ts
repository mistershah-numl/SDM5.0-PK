import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import Assessment from "@/lib/models/Assessment";
import IndexVersion from "@/lib/models/IndexVersion";
import Pillar from "@/lib/models/Pillar";
import Dimension from "@/lib/models/Dimension";
import User from "@/lib/models/User";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthFromRequest(request);

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const assessment = await Assessment.findById(params.id)
      .populate({
        path: "indexVersionId",
        model: IndexVersion,
        select: "name",
      })
      .populate({
        path: "userId",
        model: User,
        select: "name email",
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
      .lean();

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Verify user owns this assessment
    if (assessment.userId._id.toString() !== auth.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Format scores with names
    const formattedAssessment = {
      ...assessment,
      pillarScores: (assessment.pillarScores || []).map((ps: any) => ({
        pillarId: ps.pillarId?._id || ps.pillarId,
        score: ps.score,
        name: ps.pillarId?.name || "Unknown Pillar",
      })),
      dimensionScores: (assessment.dimensionScores || []).map((ds: any) => ({
        dimensionId: ds.dimensionId?._id || ds.dimensionId,
        score: ds.score,
        name: ds.dimensionId?.name || "Unknown Dimension",
      })),
    };

    return NextResponse.json({ assessment: formattedAssessment });
  } catch (error: any) {
    console.error("Get assessment error:", error);
    return NextResponse.json({ error: "Failed to fetch assessment" }, { status: 500 });
  }
}
