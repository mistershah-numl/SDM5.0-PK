import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import { getAuthFromRequest } from '@/lib/auth';
import Assessment from '@/lib/models/Assessment';
import SurveyResponse from '@/lib/models/SurveyResponse';
import Question from '@/lib/models/Question';
import Dimension from '@/lib/models/Dimension';
import Pillar from '@/lib/models/Pillar';
import Company from '@/lib/models/Company';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connect();

    const data = await request.json();
    const { indexVersionId, responses, overallScore, pillarScores, dimensionScores, questions } = data;

    // Save individual responses
    const responsePromises = Object.entries(responses).map((entry: any) => {
      const [questionId, score] = entry;
      return new SurveyResponse({
        userId: auth.id,
        companyId: auth.companyId,
        indexVersionId,
        questionId,
        score,
      }).save();
    });

    await Promise.all(responsePromises);

    // Save assessment summary
    const assessment = new Assessment({
      userId: auth.id,
      companyId: auth.companyId,
      indexVersionId,
      overallScore,
      pillarScores,
      dimensionScores,
      status: 'completed',
    });

    const savedAssessment = await assessment.save();

    // Get questions with dimension and pillar info for AI feedback
    const questionsWithContext = await Promise.all(
      questions.map(async (q: any) => {
        const dimension = await Dimension.findById(q.dimensionId).select('name').lean();
        const pillar = await Pillar.findById(q.pillarId).select('name').lean();
        return {
          _id: q._id,
          text: q.text,
          dimensionName: dimension?.name || 'Unknown',
          pillarName: pillar?.name || 'Unknown',
          weight: q.weight,
        };
      })
    );

    // Get company info
    const company = await Company.findById(auth.companyId).select('name').lean();

    // Call AI feedback endpoint
    let aiFeedback = null;
    try {
      const feedbackResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: questionsWithContext,
          answers: responses,
          scores: {
            overall: overallScore,
            maturityLevel: Math.ceil(overallScore),
            maturityName: getMaturitLevelName(overallScore),
            pillars: pillarScores,
          },
          indexVersionId,
          companyName: company?.name || 'Assessment Client',
        }),
      });

      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        aiFeedback = feedbackData.feedback;
      }
    } catch (error) {
      console.error('AI feedback error:', error);
      // Don't fail the submission if AI feedback fails
    }

    return NextResponse.json(
      { 
        assessment: savedAssessment,
        aiFeedback,
        message: 'Survey submitted successfully with AI analysis'
      }, 
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Submit survey error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit survey' }, { status: 500 });
  }
}

function getMaturitLevelName(score: number): string {
  if (score < 1.5) return 'Traditional';
  if (score < 2.5) return 'Transitional';
  if (score < 3.5) return 'Transformed';
  if (score < 4.5) return 'Advanced';
  return 'Leading';
}
