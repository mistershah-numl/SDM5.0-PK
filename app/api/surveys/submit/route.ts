import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/lib/mongodb';
import { getAuthFromRequest } from '@/lib/auth';
import Assessment from '@/lib/models/Assessment';
import SurveyResponse from '@/lib/models/SurveyResponse';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connect();

    const data = await request.json();
    const { indexVersionId, responses, overallScore, pillarScores, dimensionScores } = data;

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

    return NextResponse.json({ assessment: savedAssessment }, { status: 201 });
  } catch (error: any) {
    console.error('Submit survey error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit survey' }, { status: 500 });
  }
}
