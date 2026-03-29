import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongodb";
import Dimension from "@/lib/models/Dimension";

export async function GET(request: NextRequest) {
  try {
    await connect();
    const dimensions = await Dimension.find().select("name pillarId indexVersionId").lean();
    return NextResponse.json({ dimensions });
  } catch (error: any) {
    console.error("Get dimensions error:", error);
    return NextResponse.json({ error: "Failed to fetch dimensions" }, { status: 500 });
  }
}
