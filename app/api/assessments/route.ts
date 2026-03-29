import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import SurveyResponse from "@/lib/models/SurveyResponse";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    if (auth.role === "admin") {
      // Admin sees all assessments
      const responses = await SurveyResponse.find()
        .populate("companyId", "name industry size")
        .sort({ submittedAt: -1 })
        .lean();
      return NextResponse.json({ assessments: responses });
    }

    if (!auth.companyId) {
      return NextResponse.json({ error: "No company associated" }, { status: 400 });
    }

    // Company user sees only their own
    const responses = await SurveyResponse.find({ companyId: auth.companyId })
      .sort({ submittedAt: -1 })
      .lean();
    return NextResponse.json({ assessments: responses });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch assessments";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
