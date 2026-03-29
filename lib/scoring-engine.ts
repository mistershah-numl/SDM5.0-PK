import { connectDB } from "./db";
import Pillar from "./models/Pillar";
import Dimension from "./models/Dimension";
import Question from "./models/Question";
import MaturityLevel from "./models/MaturityLevel";
import SurveyResponse from "./models/SurveyResponse";
import { IAnswerItem, IScores, IPillarScore, IDimensionScore } from "./models/SurveyResponse";

interface AnswerMap {
  [questionId: string]: number;
}

/**
 * Dynamic Scoring Engine
 * 
 * Calculates scores based on weights stored in DB.
 * No hardcoded formulas -- changing weights changes scores automatically.
 * 
 * Algorithm:
 * 1. Dimension Score = weighted average of question answers
 * 2. Pillar Score = weighted average of dimension scores  
 * 3. Overall Score = weighted average of pillar scores
 * 4. Maturity Level = lookup from thresholds
 */
export async function calculateScores(
  indexVersionId: string,
  answers: IAnswerItem[]
): Promise<IScores> {
  await connectDB();

  // Build answer lookup map
  const answerMap: AnswerMap = {};
  for (const answer of answers) {
    answerMap[answer.questionId.toString()] = answer.value;
  }

  // Load structure from DB
  const pillars = await Pillar.find({ indexVersionId }).sort({ order: 1 }).lean();
  const dimensions = await Dimension.find({ indexVersionId }).sort({ order: 1 }).lean();
  const questions = await Question.find({ indexVersionId }).sort({ order: 1 }).lean();
  const maturityLevels = await MaturityLevel.find({ indexVersionId })
    .sort({ level: 1 })
    .lean();

  // Group questions by dimension
  const questionsByDimension: Record<string, typeof questions> = {};
  for (const q of questions) {
    const dimId = q.dimensionId.toString();
    if (!questionsByDimension[dimId]) questionsByDimension[dimId] = [];
    questionsByDimension[dimId].push(q);
  }

  // Group dimensions by pillar
  const dimensionsByPillar: Record<string, typeof dimensions> = {};
  for (const d of dimensions) {
    const pilId = d.pillarId.toString();
    if (!dimensionsByPillar[pilId]) dimensionsByPillar[pilId] = [];
    dimensionsByPillar[pilId].push(d);
  }

  // Calculate dimension scores
  const dimensionScores: Record<string, number> = {};
  for (const dim of dimensions) {
    const dimId = dim._id.toString();
    const dimQuestions = questionsByDimension[dimId] || [];

    if (dimQuestions.length === 0) {
      dimensionScores[dimId] = 0;
      continue;
    }

    let weightedSum = 0;
    let totalWeight = 0;
    for (const q of dimQuestions) {
      const qId = q._id.toString();
      const answerValue = answerMap[qId] ?? 0;
      weightedSum += answerValue * q.weight;
      totalWeight += q.weight;
    }

    dimensionScores[dimId] = totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  // Calculate pillar scores
  const pillarScoresData: IPillarScore[] = [];
  for (const pillar of pillars) {
    const pilId = pillar._id.toString();
    const pilDimensions = dimensionsByPillar[pilId] || [];

    const dimScoresList: IDimensionScore[] = [];
    let weightedSum = 0;
    let totalWeight = 0;

    for (const dim of pilDimensions) {
      const dimId = dim._id.toString();
      const score = dimensionScores[dimId] ?? 0;
      dimScoresList.push({
        dimensionId: dim._id,
        name: dim.name,
        score: Math.round(score * 100) / 100,
      });
      weightedSum += score * dim.weight;
      totalWeight += dim.weight;
    }

    const pillarScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    pillarScoresData.push({
      pillarId: pillar._id,
      name: pillar.name,
      score: Math.round(pillarScore * 100) / 100,
      dimensions: dimScoresList,
    });
  }

  // Calculate overall score
  let overallWeightedSum = 0;
  let overallTotalWeight = 0;
  for (let i = 0; i < pillars.length; i++) {
    overallWeightedSum += pillarScoresData[i].score * pillars[i].weight;
    overallTotalWeight += pillars[i].weight;
  }
  const overallScore =
    overallTotalWeight > 0 ? overallWeightedSum / overallTotalWeight : 0;
  const roundedOverall = Math.round(overallScore * 100) / 100;

  // Determine maturity level
  let maturityLevel = 0;
  let maturityName = "Traditional";
  for (const ml of maturityLevels) {
    if (roundedOverall >= ml.minScore && roundedOverall < ml.maxScore) {
      maturityLevel = ml.level;
      maturityName = ml.name;
      break;
    }
    // Handle the top level (maxScore is inclusive for the highest)
    if (ml.level === maturityLevels[maturityLevels.length - 1]?.level && roundedOverall >= ml.minScore) {
      maturityLevel = ml.level;
      maturityName = ml.name;
    }
  }

  return {
    overall: roundedOverall,
    maturityLevel,
    maturityName,
    pillars: pillarScoresData,
  };
}

/**
 * Calculate benchmark percentile for a company's score
 * Compares against all submissions for the same index version
 */
export async function calculateBenchmarkPercentile(
  indexVersionId: string,
  overallScore: number
): Promise<number> {
  await connectDB();

  const totalResponses = await SurveyResponse.countDocuments({ indexVersionId });
  if (totalResponses <= 1) return 100; // First submission is at 100th percentile

  const belowCount = await SurveyResponse.countDocuments({
    indexVersionId,
    "scores.overall": { $lt: overallScore },
  });

  return Math.round((belowCount / totalResponses) * 100);
}
