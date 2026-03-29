'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { AlertCircle, Download, Zap } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AssessmentPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useSWR(`/api/assessments/${params.id}`, fetcher);
  const { data: aiData } = useSWR(`/api/assessments/${params.id}` ? `/api/ai/recommend?assessmentId=${params.id}` : null, fetcher);

  const [assessment, setAssessment] = useState<any>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    if (data?.assessment) setAssessment(data.assessment);
  }, [data]);

  useEffect(() => {
    if (aiData?.report) setAiReport(aiData.report);
  }, [aiData]);

  const handleGenerateAI = async () => {
    if (!assessment) return;
    setLoadingAI(true);
    try {
      const res = await fetch(`/api/ai/recommend?assessmentId=${assessment._id}`);
      if (res.ok) {
        const data = await res.json();
        setAiReport(data.report);
      }
    } finally {
      setLoadingAI(false);
    }
  };

  const handleExportPDF = () => {
    alert('PDF export coming soon!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading assessment results...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Assessment Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This assessment could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pillarScores = Object.entries(assessment.scores || {}).map(([key, value]: [string, any]) => ({
    pillar: key,
    score: typeof value === 'object' ? (value as any).overallScore : value,
  }));

  const dimensionScores = Object.entries(assessment.scores || {}).flatMap(([pillar, dims]: [string, any]) => {
    if (!dims.dimensions) return [];
    return Object.entries(dims.dimensions).map(([dim, score]: [string, any]) => ({
      dimension: dim,
      score: score,
    }));
  });

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">{assessment.companyName}</h1>
          <p className="text-lg text-muted-foreground">
            {assessment.sector} • Assessment from {new Date(assessment.completedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{(assessment.overallScore || 0).toFixed(1)}/5</div>
              <p className="text-xs text-muted-foreground mt-1">out of 5</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold capitalize">{assessment.status}</div>
              <p className="text-xs text-muted-foreground mt-1">Assessment status</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Questions Answered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(assessment.responses || {}).length}</div>
              <p className="text-xs text-muted-foreground mt-1">of {Object.keys(assessment.responses || {}).length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">100%</div>
              <p className="text-xs text-muted-foreground mt-1">Survey completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Radar Chart */}
        {pillarScores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pillar Maturity Radar</CardTitle>
              <CardDescription>Overall maturity scores by pillar</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={pillarScores}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="pillar" />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} />
                  <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Dimension Scores */}
        {dimensionScores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Dimension Scores</CardTitle>
              <CardDescription>Detailed breakdown by dimension</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dimensionScores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dimension" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Raw Responses */}
        <Card>
          <CardHeader>
            <CardTitle>Response Details</CardTitle>
            <CardDescription>Your answers to all survey questions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Your Answer</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(assessment.responses || {}).map(([qId, value]: [string, any]) => (
                  <TableRow key={qId}>
                    <TableCell>{qId}</TableCell>
                    <TableCell>
                      {['Not Implemented', 'Initial', 'Repeatable', 'Defined', 'Managed', 'Matured'][
                        value
                      ] || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{value}/5</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  AI-Generated Insights & Recommendations
                </CardTitle>
                <CardDescription>Powered by Grok AI</CardDescription>
              </div>
              <Button onClick={handleGenerateAI} disabled={loadingAI} variant="outline" size="sm">
                {loadingAI ? 'Generating...' : 'Regenerate'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiReport ? (
              <div className="space-y-4 text-sm leading-relaxed whitespace-pre-wrap">
                <div>
                  <h4 className="font-semibold mb-2">Summary:</h4>
                  <p>{aiReport.summary}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Key Strengths:</h4>
                  <p>{aiReport.strengths}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Areas for Improvement:</h4>
                  <p>{aiReport.improvements}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Recommendations:</h4>
                  <p>{aiReport.recommendations}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Click "Regenerate" to get AI insights for your assessment.</p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2 justify-center pb-8">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" /> Export PDF
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            Print Report
          </Button>
        </div>
      </div>
    </div>
  );
}
