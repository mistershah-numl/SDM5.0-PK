'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Edit2, Trash2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function IndexVersionsPage() {
  const { data, mutate, isLoading } = useSWR('/api/admin/index-versions', fetcher, { revalidateOnFocus: true });
  const { data: qData } = useSWR('/api/admin/questions', fetcher);
  const { data: pData } = useSWR('/api/admin/pillars', fetcher);
  
  const [versions, setVersions] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [pillars, setPillars] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<{ versionId: string; pillarCount: number } | null>(null);

  useEffect(() => {
    if (data?.versions) setVersions(data.versions);
    if (qData?.questions) setQuestions(qData.questions);
    if (pData?.pillars) setPillars(pData.pillars);
  }, [data, qData, pData]);

  const getQuestionCountForVersion = (versionId: string) => {
    return questions.filter((q) => q.indexVersionId === versionId).length;
  };

  const getPillarCountForVersion = (versionId: string) => {
    return pillars.filter((p) => p.indexVersionId === versionId).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `/api/admin/index-versions?id=${editingId}` 
        : '/api/admin/index-versions';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save version');
      }

      setName('');
      setDescription('');
      setEditingId(null);
      setSuccessMessage(editingId ? 'Version updated successfully' : 'Version created successfully');
      setTimeout(() => mutate(), 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (versionId: string, forceDelete: boolean = false) => {
    const pillarCount = getPillarCountForVersion(versionId);

    if (!forceDelete && pillarCount > 0) {
      setDeleteWarning({ versionId, pillarCount });
      return;
    }

    if (!forceDelete && !confirm('Delete this index version?')) return;

    try {
      const res = await fetch(`/api/admin/index-versions?id=${versionId}${forceDelete ? '&force=true' : ''}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      
      setSuccessMessage(forceDelete ? 'Version and all associated data deleted' : 'Version deleted successfully');
      setDeleteWarning(null);
      setTimeout(() => mutate(), 500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (version: any) => {
    setName(version.name);
    setDescription(version.description);
    setEditingId(version._id);
    setSuccessMessage('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Index Versions</h1>
        <p className="text-muted-foreground">Create snapshots of the framework configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Version' : 'Create New Version'}</CardTitle>
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
              <label className="block text-sm font-medium mb-1">Version Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., SDM 5.0 v1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description of this version"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Version' : 'Create Version'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setName('');
                    setDescription('');
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
          <CardTitle>All Versions ({versions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : versions.length === 0 ? (
            <p className="text-muted-foreground">No versions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Pillars</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((v) => (
                  <TableRow key={v._id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>{v.description}</TableCell>
                    <TableCell>{new Date(v.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{getPillarCountForVersion(v._id)}</TableCell>
                    <TableCell>{getQuestionCountForVersion(v._id)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(v)} 
                          className="text-primary hover:underline"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(v._id)} 
                          className="text-destructive hover:underline"
                        >
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
            <CardTitle className="text-destructive">Cannot Delete Version</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              This index version has <span className="font-bold">{deleteWarning.pillarCount} active pillar(s)</span> with associated dimensions and questions.
            </p>
            <p className="text-sm text-muted-foreground">
              Deleting this version will remove all associated pillars, dimensions, and questions.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => handleDelete(deleteWarning.versionId, true)}
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
