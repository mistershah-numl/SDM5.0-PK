import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongodb";
import Formula from "@/lib/models/Formula";

export async function GET(request: NextRequest) {
  try {
    await connect();
    const formulas = await Formula.find().select("formulaExpression indexVersionId").lean();
    return NextResponse.json({ formulas });
  } catch (error: any) {
    console.error("Get formulas error:", error);
    return NextResponse.json({ error: "Failed to fetch formulas" }, { status: 500 });
  }
}
