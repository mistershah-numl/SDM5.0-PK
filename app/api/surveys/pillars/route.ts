import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongodb";
import Pillar from "@/lib/models/Pillar";

export async function GET(request: NextRequest) {
  try {
    await connect();
    const pillars = await Pillar.find().select("name indexVersionId").lean();
    return NextResponse.json({ pillars });
  } catch (error: any) {
    console.error("Get pillars error:", error);
    return NextResponse.json({ error: "Failed to fetch pillars" }, { status: 500 });
  }
}
