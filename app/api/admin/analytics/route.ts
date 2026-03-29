import { NextResponse } from "next/server";
import { connect } from "@/lib/mongodb";
import Assessment from "@/lib/models/Assessment";
import Company from "@/lib/models/Company";

export async function GET() {
  try {
    await connect();

    const totalCompanies = await Company.countDocuments();
    const totalAssessments = await Assessment.countDocuments();

    const assessments = await Assessment.find().lean();
    const avgScore = assessments.length > 0
      ? assessments.reduce((sum, a) => sum + a.overallScore, 0) / assessments.length
      : 0;

    const topAssessments = await Assessment.find()
      .sort({ overallScore: -1 })
      .limit(Math.ceil(assessments.length * 0.2))
      .lean();

    const bottomAssessments = await Assessment.find()
      .sort({ overallScore: 1 })
      .limit(Math.ceil(assessments.length * 0.2))
      .lean();

    const leadersAvg = topAssessments.length > 0
      ? topAssessments.reduce((sum, a) => sum + a.overallScore, 0) / topAssessments.length
      : 0;

    const laggardsAvg = bottomAssessments.length > 0
      ? bottomAssessments.reduce((sum, a) => sum + a.overallScore, 0) / bottomAssessments.length
      : 0;

    return NextResponse.json({
      totalCompanies,
      totalAssessments,
      avgScore,
      leadersAvg,
      laggardsAvg,
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
