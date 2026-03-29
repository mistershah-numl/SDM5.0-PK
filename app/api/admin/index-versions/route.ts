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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const body = await req.json();

    // If activating, deactivate all others first
    if (body.isActive) {
      await IndexVersion.updateMany({}, { isActive: false });
    }

    const version = await IndexVersion.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!version) {
      return NextResponse.json({ error: "Index version not found" }, { status: 404 });
    }
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

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Import models for cascade delete
    const Pillar = require("@/lib/models/Pillar").default;
    const Dimension = require("@/lib/models/Dimension").default;
    const Question = require("@/lib/models/Question").default;
    const MaturityLevel = require("@/lib/models/MaturityLevel").default;
    const Formula = require("@/lib/models/Formula").default;

    // Get all pillars for this index version
    const pillars = await Pillar.find({ indexVersionId: id }).select("_id").lean();
    const pillarIds = pillars.map((p: any) => p._id);

    // Get all dimensions for these pillars
    const dimensions = await Dimension.find({ pillarId: { $in: pillarIds } }).select("_id").lean();
    const dimensionIds = dimensions.map((d: any) => d._id);

    // Delete all data related to this index version in correct order
    await Promise.all([
      Question.deleteMany({ dimensionId: { $in: dimensionIds } }),
      Dimension.deleteMany({ pillarId: { $in: pillarIds } }),
      Pillar.deleteMany({ indexVersionId: id }),
      MaturityLevel.deleteMany({ indexVersionId: id }),
      Formula.deleteMany({ indexVersionId: id }),
      IndexVersion.findByIdAndDelete(id),
    ]);

    return NextResponse.json({ message: "Index version and all related data deleted" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete index version";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
