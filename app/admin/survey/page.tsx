'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface SurveyResponse {
  questionId: string;
  score: number;
}

export default function SurveyPage() {
  const { data: versionData } = useSWR('/api/admin/index-versions', fetcher);
  const { data: pillarData } = useSWR('/api/admin/pillars', fetcher);
  const { data: dimensionData } = useSWR('/api/admin/dimensions', fetcher);
  const { data: questionData } = useSWR('/api/admin/questions', fetcher);
  const { data: formulaData } = useSWR('/api/admin/formulas', fetcher);

  const [versions, setVersions] = useState<any[]>([]);
  const [pillars, setPillars] = useState<any[]>([]);
  const [dimensions, setDimensions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [formulas, setFormulas] = useState<any[]>([]);

  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (versionData?.versions) setVersions(versionData.versions);
    if (pillarData?.pillars) setPillars(pillarData.pillars);
    if (dimensionData?.dimensions) setDimensions(dimensionData.dimensions);
    if (questionData?.questions) setQuestions(questionData.questions);
    if (formulaData?.formulas) setFormulas(formulaData.formulas);
  }, [versionData, pillarData, dimensionData, questionData, formulaData]);

  const filteredQuestions = selectedVersionId
    ? questions.filter((q) => q.indexVersionId === selectedVersionId)
    : [];

  const filteredPillars = selectedVersionId
    ? pillars.filter((p) => p.indexVersionId === selectedVersionId)
    : [];

  const filteredDimensions = selectedVersionId
    ? dimensions.filter((d) => d.indexVersionId === selectedVersionId)
    : [];

  const handleResponseChange = (questionId: string, score: number) => {
    setResponses({
      ...responses,
      [questionId]: Math.max(0, Math.min(5, score)),
    });
  };

  const calculateScores = () => {
    try {
      if (!selectedVersionId || !companyName.trim()) {
        setError('Please select a version and enter company name');
        return;
      }

      if (filteredQuestions.length === 0) {
        setError('No questions available for this version');
        return;
      }

      // Calculate pillar scores (average of dimension scores)
      const pillarScores: Record<string, number[]> = {};
      const dimensionScores: Record<string, number[]> = {};

      filteredPillars.forEach((p) => {
        pillarScores[p._id] = [];
      });

      filteredDimensions.forEach((d) => {
        dimensionScores[d._id] = [];
      });

      // Collect responses for each dimension
      filteredQuestions.forEach((q) => {
        const score = responses[q._id] || 0;
        if (dimensionScores[q.dimensionId]) {
          dimensionScores[q.dimensionId].push(score);
        }
      });

      // Calculate dimension averages
      const dimensionAverages: Record<string, number> = {};
      Object.entries(dimensionScores).forEach(([dimId, scores]) => {
        dimensionAverages[dimId] = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
      });

      // Calculate pillar averages
      const pillarAverages: Record<string, number> = {};
      filteredDimensions.forEach((d) => {
        const dimScore = dimensionAverages[d._id] || 0;
        if (!pillarAverages[d.pillarId]) {
          pillarAverages[d.pillarId] = [];
        }
      });

      filteredDimensions.forEach((d) => {
        if (!pillarAverages[d.pillarId]) {
          pillarAverages[d.pillarId] = [];
        }
        pillarAverages[d.pillarId].push(dimensionAverages[d._id] || 0);
      });

      const pillarFinalScores: Record<string, number> = {};
      Object.entries(pillarAverages).forEach(([pillarId, scores]: [string, any]) => {
        pillarFinalScores[pillarId] = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
      });

      // Get active formula
      const activeFormula = formulas.find((f) => f.indexVersionId === selectedVersionId);

      let overallScore = 0;
      if (activeFormula) {
        overallScore = evaluateFormula(activeFormula.formulaExpression, pillarFinalScores, dimensionAverages);
      } else {
        // Default: average of all pillar scores
        const allScores = Object.values(pillarFinalScores);
        overallScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b) / allScores.length : 0;
      }

      setResults({
        companyName,
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
      setError('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetSurvey = () => {
    setSelectedVersionId('');
    setCompanyName('');
    setResponses({});
    setSurveySubmitted(false);
    setResults(null);
    setError('');
  };

  if (surveySubmitted && results) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Assessment Results</h1>
          <p className="text-muted-foreground">Digital Maturity Assessment for {results.companyName}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Overall Digital Maturity Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary mb-2">{results.overallScore}</div>
              <div className="text-lg text-muted-foreground">/5.0</div>
              <p className="text-sm text-muted-foreground mt-2">
                {results.versionName} Assessment
              </p>
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
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Digital Maturity Assessment</h1>
        <p className="text-muted-foreground">Evaluate your organization's digital transformation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Company Name *</label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter your company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assessment Version *</label>
            <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
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
          </div>
        </CardContent>
      </Card>

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

          <Button onClick={calculateScores} size="lg" className="w-full">
            Submit Assessment
          </Button>
        </>
      )}
    </div>
  );
}
