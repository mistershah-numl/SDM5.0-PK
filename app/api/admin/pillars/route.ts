import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import Pillar from "@/lib/models/Pillar";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const indexVersionId = searchParams.get("indexVersionId");

    const filter = indexVersionId ? { indexVersionId } : {};
    const pillars = await Pillar.find(filter).sort({ order: 1 }).lean();
    return NextResponse.json({ pillars });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch pillars";
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
    const pillar = await Pillar.create(body);
    return NextResponse.json({ pillar }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create pillar";
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
    const pillar = await Pillar.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!pillar) {
      return NextResponse.json({ error: "Pillar not found" }, { status: 404 });
    }
    return NextResponse.json({ pillar });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update pillar";
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
    await Pillar.findByIdAndDelete(id);
    return NextResponse.json({ message: "Pillar deleted" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete pillar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
