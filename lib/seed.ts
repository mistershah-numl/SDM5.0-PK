import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import User from "./models/User";
import Company from "./models/Company";
import IndexVersion from "./models/IndexVersion";
import Pillar from "./models/Pillar";
import Dimension from "./models/Dimension";
import Question from "./models/Question";
import Formula from "./models/Formula";
import MaturityLevel from "./models/MaturityLevel";

export async function seedDatabase() {
  await connectDB();

  // Check if already seeded
  const existingVersion = await IndexVersion.findOne({ name: "SDM 5.0 v1.0" });
  if (existingVersion) {
    return { message: "Database already seeded" };
  }

  // Create admin user
  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  const admin = await User.create({
    email: "admin@sdm5.com",
    passwordHash: adminPasswordHash,
    role: "admin",
    name: "SDM5 Administrator",
  });

  // Create test company
  const testCompany = await Company.create({
    name: "Test Company Inc",
    industry: "Technology",
    size: "50-249",
    region: "North America",
    contactEmail: "company@test.com",
  });

  // Create test company user
  const companyPasswordHash = await bcrypt.hash("company123", 12);
  await User.create({
    email: "company@test.com",
    passwordHash: companyPasswordHash,
    role: "company",
    companyId: testCompany._id,
    name: "Test Company User",
  });

  // Create index version
  const indexVersion = await IndexVersion.create({
    name: "SDM 5.0 v1.0",
    description:
      "Sustainable Digital Maturity 5.0 - Initial version based on ICT4S and Sustainable ICT pillars for SME assessment aligned with Industry 5.0 and SDGs.",
    isActive: true,
    createdBy: admin._id,
  });

  const vId = indexVersion._id;

  // ============================================
  // PILLAR 1: ICT for Sustainability (ICT4S)
  // ============================================
  const pillar1 = await Pillar.create({
    indexVersionId: vId,
    name: "ICT for Sustainability (ICT4S)",
    description:
      "How advanced technologies tackle sustainability challenges and contribute to UN Sustainable Development Goals. Measures the degree to which ICT is leveraged as an enabler for sustainable outcomes.",
    weight: 50,
    order: 1,
  });

  // Dimension 1.1: Technology
  const dim1_1 = await Dimension.create({
    pillarId: pillar1._id,
    indexVersionId: vId,
    name: "Technology",
    description:
      "Adoption of advanced digital technologies (AI, IoT, BDA, digital twins, VR/AR, additive manufacturing, quantum computing) for sustainability-driven outcomes.",
    weight: 25,
    order: 1,
  });

  await Question.insertMany([
    {
      dimensionId: dim1_1._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "To what extent does your organization use AI/Machine Learning to optimize resource consumption (energy, water, materials)?",
      helpText: "Consider any AI-based systems for predictive maintenance, demand forecasting, energy optimization, or waste reduction.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 1,
    },
    {
      dimensionId: dim1_1._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "How extensively does your organization deploy IoT sensors for real-time environmental monitoring (emissions, energy, waste)?",
      helpText: "Think about connected sensors monitoring air quality, energy meters, water usage, or production line efficiency.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 2,
    },
    {
      dimensionId: dim1_1._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "Does your organization use Big Data Analytics to support sustainability decision-making?",
      helpText: "Consider data-driven dashboards, sustainability KPIs, or analytics platforms that process large environmental datasets.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 3,
    },
    {
      dimensionId: dim1_1._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "To what degree has your organization adopted digital twins or simulation tools for sustainable product/process design?",
      helpText: "Digital twins simulate physical assets to optimize lifecycle performance, reduce prototyping waste, or improve energy efficiency.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 4,
    },
    {
      dimensionId: dim1_1._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "Does your organization use cloud computing or edge computing specifically to reduce its environmental footprint?",
      helpText: "Consider migration to greener cloud providers, serverless architectures, or edge computing to reduce data transfer emissions.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 5,
    },
  ]);

  // Dimension 1.2: Strategy
  const dim1_2 = await Dimension.create({
    pillarId: pillar1._id,
    indexVersionId: vId,
    name: "Strategy",
    description:
      "Digital strategic planning for sustainable outcomes, alignment of digital transformation roadmaps with SDGs, and long-term sustainability vision.",
    weight: 20,
    order: 2,
  });

  await Question.insertMany([
    {
      dimensionId: dim1_2._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "Does your organization have a formal digital strategy that explicitly integrates sustainability goals?",
      helpText: "A documented strategy linking digital transformation milestones to specific environmental/social targets.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 1,
    },
    {
      dimensionId: dim1_2._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "How well are your ICT investments aligned with the UN Sustainable Development Goals (SDGs)?",
      helpText: "Consider whether technology projects are evaluated against SDG targets (e.g., SDG 7: Clean Energy, SDG 12: Responsible Consumption).",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 2,
    },
    {
      dimensionId: dim1_2._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "Does your organization set measurable KPIs for digital sustainability initiatives?",
      helpText: "Examples: carbon reduction targets from digitalization, energy savings from smart systems, waste reduction metrics.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 3,
    },
    {
      dimensionId: dim1_2._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "How frequently does leadership review the progress of sustainability-driven digital projects?",
      helpText: "Consider board-level or C-suite reviews of green IT initiatives, sustainability dashboards, or ESG reporting related to ICT.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 4,
    },
  ]);

  // Dimension 1.3: People & Culture
  const dim1_3 = await Dimension.create({
    pillarId: pillar1._id,
    indexVersionId: vId,
    name: "People & Culture",
    description:
      "Skills development, digital literacy, change management capabilities, and organizational culture supporting sustainable technology adoption.",
    weight: 20,
    order: 3,
  });

  await Question.insertMany([
    {
      dimensionId: dim1_3._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "Does your organization provide training programs on sustainable digital practices for employees?",
      helpText: "Training on green coding, energy-efficient IT use, sustainability awareness, or eco-design principles.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 1,
    },
    {
      dimensionId: dim1_3._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "How strong is the organizational culture around sustainability and digital innovation?",
      helpText: "Consider whether employees proactively suggest green IT improvements or sustainability is part of company values.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 2,
    },
    {
      dimensionId: dim1_3._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "To what extent are employees empowered to use digital tools for sustainability problem-solving?",
      helpText: "Consider access to data analytics tools, sustainability platforms, or innovation labs for green solutions.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 3,
    },
    {
      dimensionId: dim1_3._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "Does your organization have change management processes to support sustainable digital transformation?",
      helpText: "Structured approaches to help employees adapt to new green technologies and sustainable workflows.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 4,
    },
  ]);

  // Dimension 1.4: Organization
  const dim1_4 = await Dimension.create({
    pillarId: pillar1._id,
    indexVersionId: vId,
    name: "Organization",
    description:
      "Strategic alignment, leadership commitment, cross-functional coordination, and governance structures for ICT-driven sustainability.",
    weight: 20,
    order: 4,
  });

  await Question.insertMany([
    {
      dimensionId: dim1_4._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "Is there a dedicated role or team responsible for sustainable digital transformation in your organization?",
      helpText: "Examples: Chief Sustainability Officer, Green IT team, Sustainability & Innovation committee.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 1,
    },
    {
      dimensionId: dim1_4._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "How well do different departments collaborate on sustainability-driven technology projects?",
      helpText: "Cross-functional collaboration between IT, operations, procurement, and sustainability teams.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 2,
    },
    {
      dimensionId: dim1_4._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "Does leadership actively champion ICT for sustainability initiatives?",
      helpText: "Consider whether senior leaders publicly support, fund, and prioritize green digital projects.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 3,
    },
    {
      dimensionId: dim1_4._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "Does your organization partner with external stakeholders (suppliers, research institutions, NGOs) on sustainable ICT projects?",
      helpText: "Collaborative R&D, supply chain sustainability programs, or industry consortia for green technology.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 4,
    },
  ]);

  // Dimension 1.5: Data & Cybersecurity
  const dim1_5 = await Dimension.create({
    pillarId: pillar1._id,
    indexVersionId: vId,
    name: "Data & Cybersecurity",
    description:
      "Data management capabilities for sustainability metrics, secure infrastructure for environmental data, and cybersecurity posture supporting green operations.",
    weight: 15,
    order: 5,
  });

  await Question.insertMany([
    {
      dimensionId: dim1_5._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "Does your organization systematically collect and manage data related to its environmental impact?",
      helpText: "Structured data collection on carbon emissions, energy use, waste generation, water consumption, etc.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 1,
    },
    {
      dimensionId: dim1_5._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "How robust are your data security measures for sustainability-related systems and data?",
      helpText: "Cybersecurity for IoT sensors, environmental monitoring systems, sustainability reporting platforms.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 2,
    },
    {
      dimensionId: dim1_5._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "Does your organization use data governance frameworks that include sustainability data standards?",
      helpText: "Data quality standards, metadata management, and governance policies for environmental datasets.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 3,
    },
    {
      dimensionId: dim1_5._id, pillarId: pillar1._id, indexVersionId: vId,
      text: "How well does your organization protect critical sustainability infrastructure from cyber threats?",
      helpText: "Security assessments for smart building systems, energy management platforms, or supply chain monitoring tools.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 4,
    },
  ]);

  // ============================================
  // PILLAR 2: Sustainable ICT
  // ============================================
  const pillar2 = await Pillar.create({
    indexVersionId: vId,
    name: "Sustainable ICT",
    description:
      "How technological infrastructure itself is managed sustainably. Measures the environmental footprint of ICT operations and the degree of green IT practices.",
    weight: 50,
    order: 2,
  });

  // Dimension 2.1: Green IT Infrastructure
  const dim2_1 = await Dimension.create({
    pillarId: pillar2._id,
    indexVersionId: vId,
    name: "Green IT Infrastructure",
    description:
      "Energy efficiency of IT systems, carbon footprint of hardware/software, sustainable hardware lifecycle management, and green data center practices.",
    weight: 25,
    order: 1,
  });

  await Question.insertMany([
    {
      dimensionId: dim2_1._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "To what extent has your organization optimized the energy efficiency of its IT infrastructure (servers, networks, endpoints)?",
      helpText: "Energy-efficient hardware, virtualization, power management policies, or green data center certifications.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 1,
    },
    {
      dimensionId: dim2_1._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "Does your organization track and report the carbon footprint of its ICT operations?",
      helpText: "Carbon accounting for servers, devices, cloud usage, network infrastructure, and employee digital activities.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 2,
    },
    {
      dimensionId: dim2_1._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "How mature is your organization's approach to sustainable hardware lifecycle management?",
      helpText: "Extending device lifespan, using refurbished equipment, responsible decommissioning, or device-as-a-service models.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 3,
    },
    {
      dimensionId: dim2_1._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "Does your organization use renewable energy sources to power its IT infrastructure?",
      helpText: "On-site renewables, green energy contracts, or selecting cloud providers with high renewable energy usage.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 4,
    },
    {
      dimensionId: dim2_1._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "Has your organization implemented green software engineering practices?",
      helpText: "Efficient coding practices, minimizing computational waste, optimizing algorithms, or using carbon-aware scheduling.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 5,
    },
  ]);

  // Dimension 2.2: Circular Economy Practices
  const dim2_2 = await Dimension.create({
    pillarId: pillar2._id,
    indexVersionId: vId,
    name: "Circular Economy Practices",
    description:
      "E-waste management, recycling and refurbishment programs, sustainable procurement policies, and circular design principles for ICT equipment.",
    weight: 20,
    order: 2,
  });

  await Question.insertMany([
    {
      dimensionId: dim2_2._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "Does your organization have a formal e-waste management and recycling program for IT equipment?",
      helpText: "Certified e-waste recycling, take-back programs, or partnerships with recycling organizations.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 1,
    },
    {
      dimensionId: dim2_2._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "To what extent does your organization consider sustainability criteria when procuring IT equipment and services?",
      helpText: "Green procurement policies, eco-labels (EPEAT, Energy Star), supplier sustainability assessments.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 2,
    },
    {
      dimensionId: dim2_2._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "Does your organization practice refurbishment or reuse of IT equipment before disposal?",
      helpText: "Internal reuse programs, donating old equipment, or purchasing refurbished hardware.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 3,
    },
    {
      dimensionId: dim2_2._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "How well does your organization apply circular economy principles to its software and digital services?",
      helpText: "Modular software design, extending software lifecycles, avoiding planned obsolescence in digital products.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 4,
    },
  ]);

  // Dimension 2.3: Governance & Policy
  const dim2_3 = await Dimension.create({
    pillarId: pillar2._id,
    indexVersionId: vId,
    name: "Governance & Policy",
    description:
      "Sustainability policies and governance frameworks for ICT, compliance with environmental regulations, adherence to standards, and reporting transparency.",
    weight: 20,
    order: 3,
  });

  await Question.insertMany([
    {
      dimensionId: dim2_3._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "Does your organization have formal policies governing the environmental impact of its ICT operations?",
      helpText: "Green IT policies, environmental management systems (ISO 14001), or sustainability charters for ICT.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 1,
    },
    {
      dimensionId: dim2_3._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "How well does your organization comply with environmental regulations related to ICT (e.g., WEEE, RoHS)?",
      helpText: "Compliance with e-waste directives, hazardous substance restrictions, or data center energy regulations.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 2,
    },
    {
      dimensionId: dim2_3._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "Does your organization publish sustainability reports that include ICT-specific environmental metrics?",
      helpText: "GRI-aligned reporting, ESG disclosures, or internal sustainability dashboards covering ICT footprint.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 3,
    },
    {
      dimensionId: dim2_3._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "Does your organization benchmark its green IT performance against industry standards or peers?",
      helpText: "Participation in industry benchmarks, third-party audits, or comparison against best-practice frameworks.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 4,
    },
  ]);

  // Dimension 2.4: Data Stewardship
  const dim2_4 = await Dimension.create({
    pillarId: pillar2._id,
    indexVersionId: vId,
    name: "Data Stewardship",
    description:
      "Responsible data management, privacy protection, ethical AI practices, and minimizing the environmental impact of data storage and processing.",
    weight: 20,
    order: 4,
  });

  await Question.insertMany([
    {
      dimensionId: dim2_4._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "Does your organization practice data minimization to reduce storage and processing energy consumption?",
      helpText: "Policies to avoid unnecessary data collection, regular data purging, or tiered storage strategies.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 1,
    },
    {
      dimensionId: dim2_4._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "How well does your organization ensure ethical and responsible use of AI and algorithmic decision-making?",
      helpText: "AI ethics frameworks, bias audits, transparency requirements, or responsible AI governance.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 2,
    },
    {
      dimensionId: dim2_4._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "Does your organization comply with data protection regulations (e.g., GDPR, PIPEDA) in its digital operations?",
      helpText: "Privacy by design, consent management, data protection impact assessments, or appointed DPO.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 3,
    },
    {
      dimensionId: dim2_4._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "To what extent does your organization consider the environmental impact of its data centers and cloud storage?",
      helpText: "Selecting green cloud regions, optimizing storage utilization, or using cold storage for infrequently accessed data.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 4,
    },
  ]);

  // Dimension 2.5: Energy & Carbon Management
  const dim2_5 = await Dimension.create({
    pillarId: pillar2._id,
    indexVersionId: vId,
    name: "Energy & Carbon Management",
    description:
      "Cloud optimization strategies, energy monitoring systems, carbon accounting for digital operations, and net-zero ICT roadmaps.",
    weight: 15,
    order: 5,
  });

  await Question.insertMany([
    {
      dimensionId: dim2_5._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "Does your organization monitor and optimize the energy consumption of its cloud services?",
      helpText: "Cloud cost/energy optimization tools, right-sizing instances, auto-scaling, or selecting efficient regions.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 1,
    },
    {
      dimensionId: dim2_5._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "Has your organization set carbon reduction targets specifically for its ICT operations?",
      helpText: "Science-based targets for ICT, net-zero commitments for digital operations, or carbon budgets for IT departments.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 2,
    },
    {
      dimensionId: dim2_5._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "Does your organization use energy monitoring systems for its IT infrastructure?",
      helpText: "PUE tracking for data centers, smart power management, or real-time energy dashboards for IT systems.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 3,
    },
    {
      dimensionId: dim2_5._id, pillarId: pillar2._id, indexVersionId: vId,
      text: "To what extent does your organization offset or compensate for the carbon emissions of its digital operations?",
      helpText: "Carbon offset programs, renewable energy certificates, or investment in carbon capture for ICT footprint.",
      weight: 1, scaleMin: 0, scaleMax: 5, order: 4,
    },
  ]);

  // ============================================
  // MATURITY LEVELS
  // ============================================
  await MaturityLevel.insertMany([
    {
      indexVersionId: vId, level: 0, name: "Traditional",
      description: "No awareness or adoption of sustainable digital practices. ICT is used without consideration for sustainability impacts.",
      minScore: 0, maxScore: 0.5, color: "#94a3b8",
    },
    {
      indexVersionId: vId, level: 1, name: "Beginner",
      description: "Initial awareness of sustainable ICT concepts. Ad-hoc or isolated sustainability initiatives in digital operations.",
      minScore: 0.5, maxScore: 1.5, color: "#f97316",
    },
    {
      indexVersionId: vId, level: 2, name: "Basic",
      description: "Basic policies and practices in place. Some systematic adoption of green IT practices but limited integration across the organization.",
      minScore: 1.5, maxScore: 2.5, color: "#eab308",
    },
    {
      indexVersionId: vId, level: 3, name: "Advanced",
      description: "Well-defined strategies and processes. Sustainability is integrated into digital transformation planning with measurable outcomes.",
      minScore: 2.5, maxScore: 3.5, color: "#22c55e",
    },
    {
      indexVersionId: vId, level: 4, name: "Integrated",
      description: "Comprehensive integration of sustainability across all ICT operations. Data-driven optimization and continuous improvement culture.",
      minScore: 3.5, maxScore: 4.5, color: "#3b82f6",
    },
    {
      indexVersionId: vId, level: 5, name: "Matured",
      description: "Industry-leading sustainable digital practices. Full alignment with SDGs, circular economy principles, and net-zero targets for ICT.",
      minScore: 4.5, maxScore: 5.01, color: "#8b5cf6",
    },
  ]);

  // ============================================
  // FORMULAS
  // ============================================
  await Formula.insertMany([
    {
      indexVersionId: vId,
      name: "Dimension Score (Weighted Average)",
      type: "dimension",
      expression: "dim_score = SUM(answer_value * question_weight) / SUM(question_weight)",
      normalization: "weighted_average",
      isActive: true,
    },
    {
      indexVersionId: vId,
      name: "Pillar Score (Weighted Average of Dimensions)",
      type: "pillar",
      expression: "pillar_score = SUM(dim_score * dim_weight) / SUM(dim_weight)",
      normalization: "weighted_average",
      isActive: true,
    },
    {
      indexVersionId: vId,
      name: "Overall SDM Score (Weighted Average of Pillars)",
      type: "overall",
      expression: "overall = SUM(pillar_score * pillar_weight) / SUM(pillar_weight)",
      normalization: "weighted_average",
      isActive: true,
    },
  ]);

  return {
    message: "Database seeded successfully",
    data: {
      admin: { email: "admin@sdm5.com", password: "admin123" },
      indexVersion: indexVersion.name,
      pillars: 2,
      dimensions: 10,
      questions: 43,
      maturityLevels: 6,
      formulas: 3,
    },
  };
}
