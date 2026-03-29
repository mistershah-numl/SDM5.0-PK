import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongodb";
import Question from "@/lib/models/Question";

export async function GET(request: NextRequest) {
  try {
    await connect();
    const questions = await Question.find().lean();
    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("Get questions error:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
