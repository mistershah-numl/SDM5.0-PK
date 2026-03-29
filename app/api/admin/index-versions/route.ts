import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import IndexVersion from "@/lib/models/IndexVersion";

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const versions = await IndexVersion.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ versions });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch index versions";
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
    body.createdBy = auth.userId;

    // If setting as active, deactivate all others
    if (body.isActive) {
      await IndexVersion.updateMany({}, { isActive: false });
    }

    const version = await IndexVersion.create(body);
    return NextResponse.json({ version }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create index version";
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

    // If activating, deactivate all others first
    if (update.isActive) {
      await IndexVersion.updateMany({}, { isActive: false });
    }

    const version = await IndexVersion.findByIdAndUpdate(_id, update, { new: true }).lean();
    return NextResponse.json({ version });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update index version";
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
    await IndexVersion.findByIdAndDelete(id);
    return NextResponse.json({ message: "Index version deleted" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete index version";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
