'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Edit2, Trash2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface ExpandedState {
  [versionId: string]: boolean;
}

export default function AdminDashboard() {
  const { data: versionData, mutate: mutateVersions } = useSWR('/api/admin/index-versions', fetcher, { revalidateOnFocus: true });
  const { data: pillarData } = useSWR('/api/admin/pillars', fetcher);
  const { data: dimensionData } = useSWR('/api/admin/dimensions', fetcher);
  const { data: questionData } = useSWR('/api/admin/questions', fetcher);

  const [versions, setVersions] = useState<any[]>([]);
  const [pillars, setPillars] = useState<any[]>([]);
  const [dimensions, setDimensions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [expandedStates, setExpandedStates] = useState<ExpandedState>({});
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState<string | null>(null);

  useEffect(() => {
    if (versionData?.versions) setVersions(versionData.versions);
    if (pillarData?.pillars) setPillars(pillarData.pillars);
    if (dimensionData?.dimensions) setDimensions(dimensionData.dimensions);
    if (questionData?.questions) setQuestions(questionData.questions);
  }, [versionData, pillarData, dimensionData, questionData]);

  const toggleExpanded = (versionId: string) => {
    setExpandedStates((prev) => ({
      ...prev,
      [versionId]: !prev[versionId],
    }));
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('Delete this index version and all associated data?')) return;

    try {
      const res = await fetch(`/api/admin/index-versions?id=${versionId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccessMessage('Index version deleted successfully');
      setDialogOpen(null);
      setTimeout(() => mutateVersions(), 500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getVersionPillars = (versionId: string) => pillars.filter((p) => p.indexVersionId === versionId);
  const getPillarDimensions = (pillarId: string) => dimensions.filter((d) => d.pillarId === pillarId);
  const getDimensionQuestions = (dimensionId: string) => questions.filter((q) => q.dimensionId === dimensionId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage all assessment configurations</p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-destructive">
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg bg-green-50 p-3 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <p>{successMessage}</p>
        </div>
      )}

      {versions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No index versions yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {versions.map((version) => {
            const versionPillars = getVersionPillars(version._id);
            const isExpanded = expandedStates[version._id];

            return (
              <Dialog key={version._id} open={dialogOpen === version._id} onOpenChange={(open) => {
                setDialogOpen(open ? version._id : null);
              }}>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl">{version.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{version.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {versionPillars.length} Pillars • {dimensions.filter(d => versionPillars.some(p => p._id === d.pillarId)).length} Dimensions
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/admin/index-versions?edit=${version._id}`}>
                          <Button variant="outline" size="sm">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          onClick={() => handleDeleteVersion(version._id)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => toggleExpanded(version._id)}
                          variant="outline"
                          size="sm"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-4 border-t pt-4">
                      {versionPillars.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No pillars in this version</p>
                      ) : (
                        versionPillars.map((pillar) => {
                          const pillarDims = getPillarDimensions(pillar._id);
                          return (
                            <div key={pillar._id} className="space-y-3 p-4 bg-muted rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold">{pillar.name}</h4>
                                  <p className="text-xs text-muted-foreground">{pillar.description}</p>
                                  <p className="text-xs font-medium mt-1">Weight: {pillar.weight}%</p>
                                </div>
                                <Link href={`/admin/pillars?edit=${pillar._id}`}>
                                  <Button variant="ghost" size="sm">
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>

                              {pillarDims.length === 0 ? (
                                <p className="text-xs text-muted-foreground pl-4">No dimensions</p>
                              ) : (
                                <div className="space-y-2 pl-4">
                                  {pillarDims.map((dimension) => {
                                    const dimQuestions = getDimensionQuestions(dimension._id);
                                    return (
                                      <div key={dimension._id} className="p-3 bg-background rounded border">
                                        <div className="flex items-center justify-between mb-2">
                                          <div>
                                            <p className="text-sm font-medium">{dimension.name}</p>
                                            <p className="text-xs text-muted-foreground">Weight: {dimension.weight}%</p>
                                          </div>
                                          <Link href={`/admin/dimensions?edit=${dimension._id}`}>
                                            <Button variant="ghost" size="sm">
                                              <Edit2 className="h-4 w-4" />
                                            </Button>
                                          </Link>
                                        </div>

                                        {dimQuestions.length === 0 ? (
                                          <p className="text-xs text-muted-foreground">No questions</p>
                                        ) : (
                                          <div className="space-y-2 mt-2">
                                            {dimQuestions.map((question) => (
                                              <div
                                                key={question._id}
                                                className="flex items-start justify-between text-xs p-2 bg-muted rounded gap-2"
                                              >
                                                <span className="flex-1">{question.text}</span>
                                                <Link href={`/admin/questions?edit=${question._id}`}>
                                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                    <Edit2 className="h-3 w-3" />
                                                  </Button>
                                                </Link>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  )}
                </Card>
              </Dialog>
            );
          })}
        </div>
      )}
    </div>
  );
}
