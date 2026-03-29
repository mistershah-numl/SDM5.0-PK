import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import Dimension from "@/lib/models/Dimension";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const indexVersionId = searchParams.get("indexVersionId");
    const pillarId = searchParams.get("pillarId");

    const filter: Record<string, string> = {};
    if (indexVersionId) filter.indexVersionId = indexVersionId;
    if (pillarId) filter.pillarId = pillarId;

    const dimensions = await Dimension.find(filter).sort({ order: 1 }).lean();
    return NextResponse.json({ dimensions });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch dimensions";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const dimension = await Dimension.create(body);
    return NextResponse.json({ dimension }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create dimension";
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
    const dimension = await Dimension.findByIdAndUpdate(_id, update, { new: true }).lean();
    return NextResponse.json({ dimension });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update dimension";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await Dimension.findByIdAndDelete(id);
    return NextResponse.json({ message: "Dimension deleted" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete dimension";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
