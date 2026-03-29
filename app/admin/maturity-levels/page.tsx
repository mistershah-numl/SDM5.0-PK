'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Edit2, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function MaturityLevelsPage() {
  const { data, mutate, isLoading } = useSWR('/api/admin/maturity-levels', fetcher, { revalidateOnFocus: true });
  const { data: versionData } = useSWR('/api/admin/index-versions', fetcher);
  
  const [levels, setLevels] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [indexVersionId, setIndexVersionId] = useState('');
  const [level, setLevel] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [color, setColor] = useState('#6b7280');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (data?.levels) setLevels(data.levels);
  }, [data]);

  useEffect(() => {
    if (versionData?.versions) setVersions(versionData.versions);
  }, [versionData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (!indexVersionId) {
        setError('Please select an index version');
        setLoading(false);
        return;
      }

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/admin/maturity-levels?id=${editingId}` : '/api/admin/maturity-levels';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indexVersionId,
          level: parseInt(level),
          name,
          description,
          minScore: minScore ? parseInt(minScore) : 0,
          maxScore: maxScore ? parseInt(maxScore) : 5,
          color,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save level');
      }

      setLevel('');
      setName('');
      setDescription('');
      setIndexVersionId('');
      setMinScore('');
      setMaxScore('');
      setColor('#6b7280');
      setEditingId(null);
      setSuccessMessage(editingId ? 'Maturity level updated successfully' : 'Maturity level created successfully');
      setTimeout(() => mutate(), 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this maturity level?')) return;
    try {
      const res = await fetch(`/api/admin/maturity-levels?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccessMessage('Maturity level deleted successfully');
      setTimeout(() => mutate(), 500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (ml: any) => {
    setLevel(ml.level.toString());
    setName(ml.name);
    setDescription(ml.description);
    setIndexVersionId(ml.indexVersionId);
    setMinScore(ml.minScore?.toString() || '');
    setMaxScore(ml.maxScore?.toString() || '');
    setColor(ml.color || '#6b7280');
    setEditingId(ml._id);
    setSuccessMessage('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Maturity Levels</h1>
        <p className="text-muted-foreground">Define maturity level descriptions (0-5: Traditional to Matured)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Level' : 'Add Maturity Level'}</CardTitle>
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
              <Select value={indexVersionId} onValueChange={setIndexVersionId}>
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
              <label className="block text-sm font-medium mb-1">Level (0-5) *</label>
              <Input
                type="number"
                min="0"
                max="5"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Traditional"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description of this maturity level"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Min Score</label>
                <Input
                  type="number"
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Score</label>
                <Input
                  type="number"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  placeholder="5"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#6b7280"
                />
              </div>
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
                    setLevel('');
                    setName('');
                    setDescription('');
                    setIndexVersionId('');
                    setMinScore('');
                    setMaxScore('');
                    setColor('#6b7280');
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
          <CardTitle>All Maturity Levels ({levels.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : levels.length === 0 ? (
            <p className="text-muted-foreground">No levels yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Score Range</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {levels.map((ml) => (
                  <TableRow key={ml._id}>
                    <TableCell className="font-bold">{ml.level}</TableCell>
                    <TableCell className="font-medium">{ml.name}</TableCell>
                    <TableCell>{ml.description}</TableCell>
                    <TableCell>{ml.minScore || 0} - {ml.maxScore || 5}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(ml)} className="text-primary hover:underline">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(ml._id)} className="text-destructive hover:underline">
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
