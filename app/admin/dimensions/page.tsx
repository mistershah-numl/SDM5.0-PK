'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Plus, Trash2, Edit2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DimensionsPage() {
  const { data: dimData, mutate: mutateDim } = useSWR('/api/admin/dimensions', fetcher, { revalidateOnFocus: true });
  const { data: pillarData } = useSWR('/api/admin/pillars', fetcher);
  const { data: versionData } = useSWR('/api/admin/index-versions', fetcher);
  const { data: questionData } = useSWR('/api/admin/questions', fetcher);

  const [dimensions, setDimensions] = useState<any[]>([]);
  const [pillars, setPillars] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [indexVersionId, setIndexVersionId] = useState('');
  const [pillarId, setPillarId] = useState('');
  const [weight, setWeight] = useState('1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteWarning, setDeleteWarning] = useState<{ dimensionId: string; questionCount: number } | null>(null);

  useEffect(() => {
    if (dimData?.dimensions) setDimensions(dimData.dimensions);
    if (pillarData?.pillars) setPillars(pillarData.pillars);
    if (versionData?.versions) setVersions(versionData.versions);
    if (questionData?.questions) setQuestions(questionData.questions);
  }, [dimData, pillarData, versionData, questionData]);

  const getQuestionCountForDimension = (dimensionId: string) => {
    return questions.filter((q) => q.dimensionId === dimensionId).length;
  };

  const filteredPillars = indexVersionId
    ? pillars.filter((p) => p.indexVersionId === indexVersionId)
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

    setLoading(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/admin/dimensions?id=${editingId}` : '/api/admin/dimensions';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          indexVersionId,
          pillarId,
          weight: parseFloat(weight),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save dimension');
      }

      setName('');
      setDescription('');
      setIndexVersionId('');
      setPillarId('');
      setWeight('1');
      setEditingId(null);
      setSuccessMessage(editingId ? 'Dimension updated successfully' : 'Dimension created successfully');
      
      setTimeout(() => mutateDim(), 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dimensionId: string, forceDelete: boolean = false) => {
    const questionCount = getQuestionCountForDimension(dimensionId);

    if (!forceDelete && questionCount > 0) {
      setDeleteWarning({ dimensionId, questionCount });
      return;
    }

    if (!forceDelete && !confirm('Delete this dimension?')) return;

    try {
      const res = await fetch(`/api/admin/dimensions?id=${dimensionId}${forceDelete ? '&force=true' : ''}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      
      setSuccessMessage(forceDelete ? 'Dimension and all associated questions deleted' : 'Dimension deleted successfully');
      setDeleteWarning(null);
      setTimeout(() => mutateDim(), 500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (dim: any) => {
    setName(dim.name);
    setDescription(dim.description);
    setIndexVersionId(dim.indexVersionId);
    setPillarId(dim.pillarId);
    setWeight(dim.weight.toString());
    setEditingId(dim._id);
    setSuccessMessage('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dimensions</h1>
        <p className="text-muted-foreground">Manage assessment dimensions (Technology, Strategy, etc.)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Dimension' : 'Add Dimension'}</CardTitle>
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
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Technology"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pillar *</label>
              <Select value={pillarId} onValueChange={setPillarId} disabled={!indexVersionId}>
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
              <label className="block text-sm font-medium mb-1">Weight (0-100) *</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
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
                    setName('');
                    setDescription('');
                    setIndexVersionId('');
                    setPillarId('');
                    setWeight('1');
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
          <CardTitle>All Dimensions ({dimensions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {!dimData ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : dimensions.length === 0 ? (
            <p className="text-muted-foreground">No dimensions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Index Version</TableHead>
                  <TableHead>Pillar</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dimensions.map((dim) => (
                  <TableRow key={dim._id}>
                    <TableCell className="font-medium">{dim.name}</TableCell>
                    <TableCell>{versions.find((v) => v._id === dim.indexVersionId)?.name || 'Unknown'}</TableCell>
                    <TableCell>{pillars.find((p) => p._id === dim.pillarId)?.name || 'Unknown'}</TableCell>
                    <TableCell>{dim.weight}</TableCell>
                    <TableCell>{getQuestionCountForDimension(dim._id)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(dim)} className="text-primary hover:underline">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(dim._id)} className="text-destructive hover:underline">
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

      {/* Delete Warning Dialog */}
      {deleteWarning && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Cannot Delete Dimension</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              This dimension has <span className="font-bold">{deleteWarning.questionCount} active question(s)</span>.
            </p>
            <p className="text-sm text-muted-foreground">
              Deleting this dimension will remove all associated questions.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => handleDelete(deleteWarning.dimensionId, true)}
                variant="destructive"
              >
                Force Delete Everything
              </Button>
              <Button
                onClick={() => setDeleteWarning(null)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
