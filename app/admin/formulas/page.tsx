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
import { AlertCircle, Edit2, Trash2, RefreshCw } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function FormulasPage() {
  const { data: formulaData, mutate: mutateFormulas } = useSWR('/api/admin/formulas', fetcher, { revalidateOnFocus: true });
  const { data: versionData } = useSWR('/api/admin/index-versions', fetcher);
  const { data: pillarData } = useSWR('/api/admin/pillars', fetcher);

  const [formulas, setFormulas] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [pillars, setPillars] = useState<any[]>([]);
  const [indexVersionId, setIndexVersionId] = useState('');
  const [formulaName, setFormulaName] = useState('');
  const [description, setDescription] = useState('');
  const [pillarWeights, setPillarWeights] = useState<Record<string, number>>({});
  const [customFormula, setCustomFormula] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [testScores, setTestScores] = useState<Record<string, number>>({});
  const [testResult, setTestResult] = useState<number | null>(null);

  useEffect(() => {
    if (formulaData?.formulas) setFormulas(formulaData.formulas);
    if (versionData?.versions) setVersions(versionData.versions);
    if (pillarData?.pillars) setPillars(pillarData.pillars);
  }, [formulaData, versionData, pillarData]);

  const filteredPillars = indexVersionId
    ? pillars.filter((p) => p.indexVersionId === indexVersionId)
    : [];

  const getTotalPillarWeight = () => {
    return filteredPillars.reduce((sum, p) => sum + (pillarWeights[p._id] || 0), 0);
  };

  const handlePillarWeightChange = (pillarId: string, weight: number) => {
    setPillarWeights({
      ...pillarWeights,
      [pillarId]: Math.max(0, Math.min(100, weight)),
    });
  };

  const autoGenerateFormula = () => {
    if (!indexVersionId || filteredPillars.length === 0) {
      setError('Please select an index version with pillars');
      return;
    }

    const totalWeight = getTotalPillarWeight();
    if (totalWeight === 0) {
      setError('Please set weights for at least one pillar');
      return;
    }

    // Generate formula string
    const formulaParts = filteredPillars
      .filter((p) => pillarWeights[p._id])
      .map((p) => {
        const weight = pillarWeights[p._id];
        const normalizedWeight = weight / totalWeight;
        return `(P_${p._id}*${normalizedWeight.toFixed(2)})`;
      });

    const formula = formulaParts.join('+');
    setCustomFormula(formula);
    setUseCustom(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!indexVersionId) {
      setError('Please select an index version');
      return;
    }

    if (!formulaName.trim()) {
      setError('Formula name is required');
      return;
    }

    const totalWeight = getTotalPillarWeight();
    if (!useCustom && totalWeight !== 100) {
      setError(`Weights must sum to 100%. Current sum: ${totalWeight.toFixed(2)}%`);
      return;
    }

    if (useCustom && !customFormula.trim()) {
      setError('Custom formula is required');
      return;
    }

    setLoading(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/admin/formulas?id=${editingId}` : '/api/admin/formulas';

      const payload = {
        indexVersionId,
        formulaName,
        description,
        formulaExpression: useCustom ? customFormula : generateWeightedAverageFormula(),
        pillarWeights: useCustom ? {} : pillarWeights,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save formula');
      }

      const result = await res.json();
      
      setIndexVersionId('');
      setFormulaName('');
      setDescription('');
      setPillarWeights({});
      setCustomFormula('');
      setUseCustom(false);
      setEditingId(null);
      setTestScores({});
      setTestResult(null);
      setSuccessMessage(editingId ? 'Formula updated successfully' : 'Formula created successfully');

      setTimeout(() => mutateFormulas(), 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateWeightedAverageFormula = () => {
    const totalWeight = getTotalPillarWeight();
    const formulaParts = filteredPillars
      .filter((p) => pillarWeights[p._id])
      .map((p) => {
        const weight = pillarWeights[p._id];
        const normalizedWeight = weight / totalWeight;
        return `(P_${p._id}*${normalizedWeight.toFixed(4)})`;
      });

    return formulaParts.join('+');
  };

  const handleTestFormula = () => {
    if (Object.keys(testScores).length === 0) {
      setError('Please enter at least one test score');
      return;
    }

    try {
      const formula = useCustom ? customFormula : generateWeightedAverageFormula();
      let result = formula;

      // Replace pillar placeholders with test values
      Object.entries(testScores).forEach(([pillarId, score]) => {
        result = result.replace(new RegExp(`P_${pillarId}`, 'g'), score.toString());
      });

      // Evaluate the formula
      const calculatedScore = eval(result);
      setTestResult(Math.max(0, Math.min(5, parseFloat(calculatedScore.toFixed(2)))));
      setError('');
    } catch (err: any) {
      setError('Invalid formula: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this formula?')) return;
    try {
      const res = await fetch(`/api/admin/formulas?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccessMessage('Formula deleted successfully');
      setTimeout(() => mutateFormulas(), 500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (formula: any) => {
    setIndexVersionId(formula.indexVersionId);
    setFormulaName(formula.formulaName);
    setDescription(formula.description);
    setCustomFormula(formula.formulaExpression);
    setPillarWeights(formula.pillarWeights || {});
    setEditingId(formula._id);
    setSuccessMessage('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Formulas</h1>
        <p className="text-muted-foreground">Define scoring formulas for assessment calculations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Formula' : 'Create New Formula'}</CardTitle>
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

            {/* Index Version */}
            <div>
              <label className="block text-sm font-medium mb-1">Index Version *</label>
              <Select value={indexVersionId} onValueChange={(val) => {
                setIndexVersionId(val);
                setPillarWeights({});
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

            {/* Formula Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Formula Name *</label>
              <Input
                value={formulaName}
                onChange={(e) => setFormulaName(e.target.value)}
                placeholder="e.g., Standard Weighted Average"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Formula description"
              />
            </div>

            {/* Pillar Weights */}
            {!useCustom && filteredPillars.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Pillar Weights *</label>
                  <span className={`text-sm font-semibold ${getTotalPillarWeight() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    Total: {getTotalPillarWeight().toFixed(2)}% / 100%
                  </span>
                </div>
                <div className="space-y-2">
                  {filteredPillars.map((p) => (
                    <div key={p._id} className="flex gap-2 items-center">
                      <label className="flex-1 text-sm">{p.name}</label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={pillarWeights[p._id] || 0}
                          onChange={(e) => handlePillarWeightChange(p._id, parseFloat(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-sm">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formula Type Toggle */}
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUseCustom(!useCustom)}
                className="w-full"
              >
                {useCustom ? 'Use Weighted Average' : 'Use Custom Formula'}
              </Button>
            </div>

            {/* Auto-Generate or Custom Formula */}
            {useCustom ? (
              <div>
                <label className="block text-sm font-medium mb-1">Custom Formula (Advanced)</label>
                <Input
                  value={customFormula}
                  onChange={(e) => setCustomFormula(e.target.value)}
                  placeholder="e.g., (P_1234 * 0.4 + P_5678 * 0.6)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use P_XXXX for pillars and D_XXXX for dimensions. Example: (P_1234 * 0.4) + (D_5678 * 0.6)
                </p>
              </div>
            ) : (
              <Button
                type="button"
                onClick={autoGenerateFormula}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Auto-Generate Formula
              </Button>
            )}

            {/* Submit */}
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
                    setIndexVersionId('');
                    setFormulaName('');
                    setDescription('');
                    setPillarWeights({});
                    setCustomFormula('');
                    setUseCustom(false);
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

      {/* Test Formula */}
      {(customFormula || getTotalPillarWeight() > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Test Formula</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter test scores to preview the calculated result</p>
            <div className="space-y-2">
              {filteredPillars.map((p) => (
                <div key={p._id} className="flex gap-2 items-center">
                  <label className="flex-1 text-sm">{p.name} Score (0-5)</label>
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={testScores[p._id] || 0}
                    onChange={(e) => setTestScores({
                      ...testScores,
                      [p._id]: parseFloat(e.target.value),
                    })}
                    className="w-20"
                  />
                </div>
              ))}
            </div>
            <Button onClick={handleTestFormula} className="w-full">
              Calculate Score
            </Button>
            {testResult !== null && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Calculated Score: {testResult}/5.0
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Formulas */}
      <Card>
        <CardHeader>
          <CardTitle>All Formulas ({formulas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {formulas.length === 0 ? (
            <p className="text-muted-foreground">No formulas yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Index Version</TableHead>
                  <TableHead>Formula</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formulas.map((f) => (
                  <TableRow key={f._id}>
                    <TableCell className="font-medium">{f.formulaName}</TableCell>
                    <TableCell>{versions.find((v) => v._id === f.indexVersionId)?.name || 'Unknown'}</TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-xs">{f.formulaExpression}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(f)} className="text-primary hover:underline">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(f._id)} className="text-destructive hover:underline">
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
