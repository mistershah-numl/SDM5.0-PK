'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Trash2, Edit2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function QuestionsPage() {
  const { data: qData, mutate: mutateQ } = useSWR('/api/admin/questions', fetcher, { revalidateOnFocus: true });
  const { data: dimData } = useSWR('/api/admin/dimensions', fetcher);
  const { data: pillarData } = useSWR('/api/admin/pillars', fetcher);
  const { data: versionData } = useSWR('/api/admin/index-versions', fetcher);

  const [questions, setQuestions] = useState<any[]>([]);
  const [dimensions, setDimensions] = useState<any[]>([]);
  const [pillars, setPillars] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [indexVersionId, setIndexVersionId] = useState('');
  const [pillarId, setPillarId] = useState('');
  const [dimensionId, setDimensionId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (qData?.questions) setQuestions(qData.questions);
    if (dimData?.dimensions) setDimensions(dimData.dimensions);
    if (pillarData?.pillars) setPillars(pillarData.pillars);
    if (versionData?.versions) setVersions(versionData.versions);
  }, [qData, dimData, pillarData, versionData]);

  // Filter pillars by index version
  const filteredPillars = indexVersionId
    ? pillars.filter((p) => p.indexVersionId === indexVersionId)
    : [];

  // Filter dimensions by pillar
  const filteredDimensions = pillarId
    ? dimensions.filter((d) => d.pillarId === pillarId)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!indexVersionId) {
      setError('Please select an index version');
      return;
    }
    if (!pillarId) {
      setError('Please select a pillar');
      return;
    }
    if (!dimensionId) {
      setError('Please select a dimension');
      return;
    }

    setLoading(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/admin/questions?id=${editingId}` : '/api/admin/questions';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          dimensionId,
          pillarId,
          indexVersionId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save question');
      }

      setText('');
      setIndexVersionId('');
      setPillarId('');
      setDimensionId('');
      setEditingId(null);
      setSuccessMessage(editingId ? 'Question updated successfully' : 'Question created successfully');
      
      // Refresh data
      setTimeout(() => mutateQ(), 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      const res = await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccessMessage('Question deleted successfully');
      setTimeout(() => mutateQ(), 500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (q: any) => {
    setText(q.text);
    setIndexVersionId(q.indexVersionId);
    setPillarId(q.pillarId);
    setDimensionId(q.dimensionId);
    setEditingId(q._id);
    setSuccessMessage('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Questions</h1>
        <p className="text-muted-foreground">Manage assessment questions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Question' : 'Add Question'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            {successMessage && (
              <div className="flex gap-2 rounded-lg bg-green-50 p-3 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{successMessage}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Index Version *</label>
              <Select value={indexVersionId} onValueChange={(val) => {
                setIndexVersionId(val);
                setPillarId('');
                setDimensionId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an index version" />
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
            <div>
              <label className="block text-sm font-medium mb-1">Pillar *</label>
              <Select value={pillarId} onValueChange={(val) => {
                setPillarId(val);
                setDimensionId('');
              }} disabled={!indexVersionId}>
                <SelectTrigger>
                  <SelectValue placeholder={indexVersionId ? "Select a pillar" : "Select index version first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredPillars.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dimension *</label>
              <Select value={dimensionId} onValueChange={setDimensionId} disabled={!pillarId}>
                <SelectTrigger>
                  <SelectValue placeholder={pillarId ? "Select a dimension" : "Select pillar first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredDimensions.map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Question Text *</label>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter question"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setText('');
                    setIndexVersionId('');
                    setPillarId('');
                    setDimensionId('');
                    setError('');
                    setSuccessMessage('');
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Questions ({questions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {!qData ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : questions.length === 0 ? (
            <p className="text-muted-foreground">No questions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Dimension</TableHead>
                  <TableHead>Pillar</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((q) => (
                  <TableRow key={q._id}>
                    <TableCell className="max-w-md">{q.text}</TableCell>
                    <TableCell>{dimensions.find((d) => d._id === q.dimensionId)?.name || 'Unknown'}</TableCell>
                    <TableCell>{pillars.find((p) => p._id === q.pillarId)?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(q)} className="text-primary hover:underline">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(q._id)} className="text-destructive hover:underline">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
