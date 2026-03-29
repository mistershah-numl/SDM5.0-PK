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

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const level = await MaturityLevel.create(body);
    return NextResponse.json({ level }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create maturity level";
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const level = await MaturityLevel.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!level) {
      return NextResponse.json({ error: "Maturity level not found" }, { status: 404 });
    }
    return NextResponse.json({ level });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update maturity level";
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
    await MaturityLevel.findByIdAndDelete(id);
    return NextResponse.json({ message: "Maturity level deleted" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete maturity level";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
