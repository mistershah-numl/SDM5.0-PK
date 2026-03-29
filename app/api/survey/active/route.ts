import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import IndexVersion from "@/lib/models/IndexVersion";
import Pillar from "@/lib/models/Pillar";
import Dimension from "@/lib/models/Dimension";
import Question from "@/lib/models/Question";

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const activeVersion = await IndexVersion.findOne({ isActive: true }).lean();
    if (!activeVersion) {
      return NextResponse.json({ error: "No active index version found" }, { status: 404 });
    }

    const vId = activeVersion._id;
    const pillars = await Pillar.find({ indexVersionId: vId }).sort({ order: 1 }).lean();
    const dimensions = await Dimension.find({ indexVersionId: vId }).sort({ order: 1 }).lean();
    const questions = await Question.find({ indexVersionId: vId }).sort({ order: 1 }).lean();

    return NextResponse.json({
      indexVersion: activeVersion,
      pillars,
      dimensions,
      questions,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load survey";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
