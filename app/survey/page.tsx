'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { evaluateFormula } from '@/lib/utils/formulaGenerator';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json());

interface User {
  id: string;
  name: string;
  email: string;
  companyId?: string;
  company?: {
    _id: string;
    name: string;
  };
}

export default function SurveyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: versionData } = useSWR('/api/surveys/versions', fetcher);
  const { data: pillarData } = useSWR('/api/surveys/pillars', fetcher);
  const { data: dimensionData } = useSWR('/api/surveys/dimensions', fetcher);
  const { data: questionData } = useSWR('/api/surveys/questions', fetcher);
  const { data: formulaData } = useSWR('/api/surveys/formulas', fetcher);

  const [versions, setVersions] = useState<any[]>([]);
  const [pillars, setPillars] = useState<any[]>([]);
  const [dimensions, setDimensions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [formulas, setFormulas] = useState<any[]>([]);

  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [selectedFormulaId, setSelectedFormulaId] = useState('');
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        if (!res.ok) {
          router.push('/auth/login?callbackUrl=/survey');
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        router.push('/auth/login?callbackUrl=/survey');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (versionData?.versions) setVersions(versionData.versions);
    if (pillarData?.pillars) setPillars(pillarData.pillars);
    if (dimensionData?.dimensions) setDimensions(dimensionData.dimensions);
    if (questionData?.questions) setQuestions(questionData.questions);
    if (formulaData?.formulas) setFormulas(formulaData.formulas);
  }, [versionData, pillarData, dimensionData, questionData, formulaData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirecting...</p>
      </div>
    );
  }

  const filteredQuestions = selectedVersionId
    ? questions.filter((q) => q.indexVersionId === selectedVersionId)
    : [];

  const filteredPillars = selectedVersionId
    ? pillars.filter((p) => p.indexVersionId === selectedVersionId)
    : [];

  const filteredDimensions = selectedVersionId
    ? dimensions.filter((d) => d.indexVersionId === selectedVersionId)
    : [];

  const filteredFormulas = selectedVersionId
    ? formulas.filter((f) => f.indexVersionId === selectedVersionId)
    : [];

  const handleVersionChange = (versionId: string) => {
    setSelectedVersionId(versionId);
    setSelectedFormulaId('');
    setResponses({});
  };

  const handleResponseChange = (questionId: string, score: number) => {
    setResponses({
      ...responses,
      [questionId]: Math.max(0, Math.min(5, score)),
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitLoading(true);
      setError('');

      if (!selectedVersionId) {
        setError('Please select a version');
        return;
      }

      if (filteredQuestions.length === 0) {
        setError('No questions available for this version');
        return;
      }

      // Check if all questions answered
      const unanswered = filteredQuestions.filter((q) => responses[q._id] === undefined);
      if (unanswered.length > 0) {
        setError(`Please answer all ${unanswered.length} remaining question(s)`);
        return;
      }

      // Calculate scores
      const pillarScores: Record<string, number[]> = {};
      const dimensionScores: Record<string, number[]> = {};

      filteredPillars.forEach((p) => {
        pillarScores[p._id] = [];
      });

      filteredDimensions.forEach((d) => {
        dimensionScores[d._id] = [];
      });

      // Collect responses
      filteredQuestions.forEach((q) => {
        const score = responses[q._id] || 0;
        if (dimensionScores[q.dimensionId]) {
          dimensionScores[q.dimensionId].push(score);
        }
      });

      // Calculate averages
      const dimensionAverages: Record<string, number> = {};
      Object.entries(dimensionScores).forEach(([dimId, scores]) => {
        dimensionAverages[dimId] = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
      });

      const pillarAverages: Record<string, number> = {};
      filteredDimensions.forEach((d) => {
        if (!pillarAverages[d.pillarId]) {
          pillarAverages[d.pillarId] = [];
        }
      });

      filteredDimensions.forEach((d) => {
        if (!pillarAverages[d.pillarId]) {
          pillarAverages[d.pillarId] = [];
        }
        if (!Array.isArray(pillarAverages[d.pillarId])) {
          pillarAverages[d.pillarId] = [];
        }
        (pillarAverages[d.pillarId] as number[]).push(dimensionAverages[d._id] || 0);
      });

      const pillarFinalScores: Record<string, number> = {};
      Object.entries(pillarAverages).forEach(([pillarId, scores]: [string, any]) => {
        pillarFinalScores[pillarId] = Array.isArray(scores) && scores.length > 0 
          ? scores.reduce((a: number, b: number) => a + b) / scores.length 
          : 0;
      });

      // Get selected formula or first available formula for this version
      let activeFormula = null;
      if (selectedFormulaId) {
        activeFormula = formulas.find((f) => f._id.toString() === selectedFormulaId);
      } else if (filteredFormulas.length > 0) {
        activeFormula = filteredFormulas[0];
      }

      let overallScore = 0;
      if (activeFormula) {
        overallScore = evaluateFormula(activeFormula.formulaExpression, pillarFinalScores, dimensionAverages);
      } else {
        const allScores = Object.values(pillarFinalScores);
        overallScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b) / allScores.length : 0;
      }

      // Save to database
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/surveys/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          indexVersionId: selectedVersionId,
          responses,
          overallScore,
          questions: filteredQuestions,
          pillarScores: Object.entries(pillarFinalScores).map(([pillarId, score]) => ({
            pillarId,
            score,
          })),
          dimensionScores: Object.entries(dimensionAverages).map(([dimensionId, score]) => ({
            dimensionId,
            score,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save assessment');
      }

      const responseData = await res.json();
      const assessment = responseData.assessment;
      setAiFeedback(responseData.aiFeedback);

      setResults({
        assessmentId: assessment._id,
        versionName: versions.find((v) => v._id === selectedVersionId)?.name,
        overallScore: overallScore.toFixed(2),
        pillarScores: Object.entries(pillarFinalScores).map(([pillarId, score]) => ({
          name: filteredPillars.find((p) => p._id === pillarId)?.name,
          score: parseFloat(score.toFixed(2)),
        })),
        dimensionScores: Object.entries(dimensionAverages).map(([dimId, score]) => ({
          name: filteredDimensions.find((d) => d._id === dimId)?.name,
          score: parseFloat(score.toFixed(2)),
        })),
      });

      setSurveySubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetSurvey = () => {
    setSelectedVersionId('');
    setSelectedFormulaId('');
    setResponses({});
    setSurveySubmitted(false);
    setResults(null);
    setError('');
    setAiFeedback(null);
    setShowFeedback(false);
  };

  if (surveySubmitted && results) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Assessment Complete</h1>
          <p className="text-muted-foreground">Digital Maturity Assessment - {results.versionName}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Your Digital Maturity Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary mb-2">{results.overallScore}</div>
              <div className="text-lg text-muted-foreground">/5.0</div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">Pillar Scores</h3>
                <div className="space-y-3">
                  {results.pillarScores.map((pillar: any) => (
                    <div key={pillar.name} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">{pillar.name}</span>
                      <span className="text-lg font-bold text-primary">{pillar.score.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Dimension Scores</h3>
                <div className="space-y-3">
                  {results.dimensionScores.slice(0, 6).map((dim: any) => (
                    <div key={dim.name} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm">{dim.name}</span>
                      <span className="font-bold text-primary">{dim.score.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={resetSurvey} className="w-full">
              Take Another Assessment
            </Button>
          </CardContent>
        </Card>

        {aiFeedback && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 cursor-pointer" onClick={() => setShowFeedback(!showFeedback)}>
                <span>🤖</span> AI Analysis & Feedback {showFeedback ? '▼' : '▶'}
              </CardTitle>
            </CardHeader>
            {showFeedback && (
              <CardContent className="space-y-4">
                {aiFeedback.overallFeedback && (
                  <div>
                    <h4 className="font-semibold mb-2">Overview</h4>
                    <p className="text-muted-foreground">{aiFeedback.overallFeedback}</p>
                  </div>
                )}
                {aiFeedback.keyObservations && aiFeedback.keyObservations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Key Observations</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {aiFeedback.keyObservations.map((obs: string, idx: number) => (
                        <li key={idx} className="text-muted-foreground text-sm">{obs}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiFeedback.immediateActions && aiFeedback.immediateActions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Recommended Next Steps</h4>
                    <ol className="list-decimal list-inside space-y-1">
                      {aiFeedback.immediateActions.map((action: string, idx: number) => (
                        <li key={idx} className="text-muted-foreground text-sm">{action}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Export & Download</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => {
                const url = `/api/surveys/export-excel?assessmentId=${results.assessmentId}`;
                window.open(url, '_blank');
              }}
              variant="outline"
              className="w-full"
            >
              📊 Download CSV Report
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Download a detailed CSV file with all calculations, methodology, and scoring breakdown
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Digital Maturity Assessment</h1>
        <p className="text-muted-foreground">Evaluate your organization's digital transformation</p>
        <p className="text-sm text-muted-foreground mt-2">Company: <span className="font-medium">{user?.company?.name || 'N/A'}</span></p>
      </div>

      {error && (
        <div className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select Assessment Version</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedVersionId} onValueChange={handleVersionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an assessment version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v._id} value={v._id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedVersionId && filteredFormulas.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Scoring Formula</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedFormulaId} onValueChange={setSelectedFormulaId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a formula or use default" />
              </SelectTrigger>
              <SelectContent>
                {filteredFormulas.map((f) => (
                  <SelectItem key={f._id.toString()} value={f._id.toString()}>
                    {f.formulaName} {f.description ? `- ${f.description}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedVersionId && filteredQuestions.length > 0 && (
        <>
          {filteredPillars.map((pillar) => (
            <Card key={pillar._id}>
              <CardHeader>
                <CardTitle className="text-xl">{pillar.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {filteredDimensions
                  .filter((d) => d.pillarId === pillar._id)
                  .map((dimension) => (
                    <div key={dimension._id} className="space-y-4 pb-6 border-b last:border-b-0">
                      <h4 className="font-semibold text-base">{dimension.name}</h4>
                      {filteredQuestions
                        .filter((q) => q.dimensionId === dimension._id)
                        .map((question) => (
                          <div key={question._id} className="space-y-2 pl-4">
                            <p className="text-sm font-medium">{question.text}</p>
                            {question.helpText && (
                              <p className="text-xs text-muted-foreground italic">{question.helpText}</p>
                            )}
                            <div className="flex gap-2">
                              {[0, 1, 2, 3, 4, 5].map((score) => (
                                <Button
                                  key={score}
                                  onClick={() => handleResponseChange(question._id, score)}
                                  variant={responses[question._id] === score ? 'default' : 'outline'}
                                  className="w-10 h-10 p-0"
                                >
                                  {score}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}

          <Button onClick={handleSubmit} size="lg" className="w-full" disabled={submitLoading}>
            {submitLoading ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        </>
      )}
    </div>
  );
}
