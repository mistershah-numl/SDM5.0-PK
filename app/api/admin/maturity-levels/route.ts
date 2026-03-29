import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import MaturityLevel from "@/lib/models/MaturityLevel";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const indexVersionId = searchParams.get("indexVersionId");
    const filter = indexVersionId ? { indexVersionId } : {};
    const levels = await MaturityLevel.find(filter).sort({ level: 1 }).lean();
    return NextResponse.json({ levels });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch maturity levels";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { _id, ...update } = body;
    const level = await MaturityLevel.findByIdAndUpdate(_id, update, { new: true }).lean();
    return NextResponse.json({ level });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update maturity level";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
