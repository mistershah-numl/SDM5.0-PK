import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import Formula from "@/lib/models/Formula";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const indexVersionId = searchParams.get("indexVersionId");
    const filter = indexVersionId ? { indexVersionId } : {};
    const formulas = await Formula.find(filter).sort({ type: 1 }).lean();
    return NextResponse.json({ formulas });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch formulas";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const data = await req.json();
    const { indexVersionId, formulaName, description, formulaExpression, pillarWeights } = data;

    if (!indexVersionId || !formulaName || !formulaExpression) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const formula = new Formula({
      indexVersionId,
      formulaName,
      description,
      formulaExpression,
      pillarWeights: pillarWeights || {},
    });

    await formula.save();
    return NextResponse.json({ formula }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create formula";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await connectDB();
    const data = await req.json();
    const { indexVersionId, formulaName, description, formulaExpression, pillarWeights } = data;

    const formula = await Formula.findByIdAndUpdate(
      id,
      {
        indexVersionId,
        formulaName,
        description,
        formulaExpression,
        pillarWeights: pillarWeights || {},
      },
      { new: true }
    );

    if (!formula) {
      return NextResponse.json({ error: "Formula not found" }, { status: 404 });
    }

    return NextResponse.json({ formula });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update formula";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await connectDB();
    const result = await Formula.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json({ error: "Formula not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Formula deleted successfully" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete formula";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
