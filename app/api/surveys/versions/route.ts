import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongodb";
import IndexVersion from "@/lib/models/IndexVersion";

export async function GET(request: NextRequest) {
  try {
    await connect();
    const versions = await IndexVersion.find().select("name description").lean();
    return NextResponse.json({ versions });
  } catch (error: any) {
    console.error("Get versions error:", error);
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
  }
}
