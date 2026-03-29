import { NextResponse } from "next/server";
import { connect } from "@/lib/mongodb";
import IndexVersion from "@/lib/models/IndexVersion";
import Pillar from "@/lib/models/Pillar";
import Dimension from "@/lib/models/Dimension";
import Question from "@/lib/models/Question";
import MaturityLevel from "@/lib/models/MaturityLevel";

export async function POST() {
  try {
    await connect();

    // Check if already seeded
    const existingVersions = await IndexVersion.countDocuments();
    if (existingVersions > 0) {
      return NextResponse.json({ message: "Database already seeded" }, { status: 200 });
    }

    // Create Index Version
    const version = await IndexVersion.create({
      name: "SDM 5.0",
      description: "Sustainable Digital Maturity Framework 5.0",
    });

    // Create Pillars
    const pillar1 = await Pillar.create({
      indexVersionId: version._id,
      name: "ICT4S",
      description: "Information and Communication Technology for Sustainability",
      weight: 50,
      order: 1,
    });

    const pillar2 = await Pillar.create({
      indexVersionId: version._id,
      name: "Sustainable ICT",
      description: "Sustainable practices in ICT operations",
      weight: 50,
      order: 2,
    });

    // Create Dimensions for Pillar 1
    const dim1 = await Dimension.create({
      indexVersionId: version._id,
      pillarId: pillar1._id,
      name: "Technology",
      weight: 40,
      order: 1,
    });

    const dim2 = await Dimension.create({
      indexVersionId: version._id,
      pillarId: pillar1._id,
      name: "Strategy",
      weight: 30,
      order: 2,
    });

    const dim3 = await Dimension.create({
      indexVersionId: version._id,
      pillarId: pillar1._id,
      name: "People",
      weight: 30,
      order: 3,
    });

    // Create Dimensions for Pillar 2
    const dim4 = await Dimension.create({
      indexVersionId: version._id,
      pillarId: pillar2._id,
      name: "Green Operations",
      weight: 50,
      order: 1,
    });

    const dim5 = await Dimension.create({
      indexVersionId: version._id,
      pillarId: pillar2._id,
      name: "Governance",
      weight: 50,
      order: 2,
    });

    // Create Questions
    const questions = [
      { dimensionId: dim1._id, pillarId: pillar1._id, text: "How mature is your technology infrastructure?" },
      { dimensionId: dim2._id, pillarId: pillar1._id, text: "Do you have a digital sustainability strategy?" },
      { dimensionId: dim3._id, pillarId: pillar1._id, text: "Are your teams trained in digital practices?" },
      { dimensionId: dim4._id, pillarId: pillar2._id, text: "What is your energy efficiency level?" },
      { dimensionId: dim5._id, pillarId: pillar2._id, text: "Do you have sustainability governance?" },
    ];

    for (const q of questions) {
      await Question.create({
        indexVersionId: version._id,
        dimensionId: q.dimensionId,
        pillarId: q.pillarId,
        text: q.text,
        helpText: "",
        weight: 1,
        scaleMin: 0,
        scaleMax: 5,
      });
    }

    // Create Maturity Levels
    const levels = [
      { level: 0, name: "Traditional", description: "No digital maturity" },
      { level: 1, name: "Initial", description: "Basic digital practices" },
      { level: 2, name: "Developing", description: "Growing digital adoption" },
      { level: 3, name: "Defined", description: "Established digital practices" },
      { level: 4, name: "Managed", description: "Optimized digital practices" },
      { level: 5, name: "Matured", description: "Leading digital maturity" },
    ];

    for (const level of levels) {
      await MaturityLevel.create(level);
    }

    return NextResponse.json({
      message: "Database seeded successfully",
      version: version._id,
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
