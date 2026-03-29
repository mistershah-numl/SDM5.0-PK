import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import Question from "@/lib/models/Question";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const indexVersionId = searchParams.get("indexVersionId");
    const dimensionId = searchParams.get("dimensionId");
    const pillarId = searchParams.get("pillarId");

    const filter: Record<string, string> = {};
    if (indexVersionId) filter.indexVersionId = indexVersionId;
    if (dimensionId) filter.dimensionId = dimensionId;
    if (pillarId) filter.pillarId = pillarId;

    const questions = await Question.find(filter).sort({ order: 1 }).lean();
    return NextResponse.json({ questions });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch questions";
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
    const question = await Question.create(body);
    return NextResponse.json({ question }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create question";
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
    const question = await Question.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    return NextResponse.json({ question });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update question";
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
    await Question.findByIdAndDelete(id);
    return NextResponse.json({ message: "Question deleted" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete question";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
