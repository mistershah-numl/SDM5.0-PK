import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongodb";
import { getAuthFromRequest } from "@/lib/auth";
import Assessment from "@/lib/models/Assessment";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthFromRequest(request);

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();

    const assessment = await Assessment.findById(params.id)
      .populate("indexVersionId", "name")
      .populate("userId", "name email")
      .lean();

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Verify user owns this assessment
    if (assessment.userId._id.toString() !== auth.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ assessment });
  } catch (error: any) {
    console.error("Get assessment error:", error);
    return NextResponse.json({ error: "Failed to fetch assessment" }, { status: 500 });
  }
}
