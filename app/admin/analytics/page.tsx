'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AnalyticsPage() {
  const { data, isLoading } = useSWR('/api/admin/analytics', fetcher);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (data) setStats(data);
  }, [data]);

  const handleExportCSV = async () => {
    if (!stats?.responses) return;

    const csv = [
      ['Company', 'Pillar', 'Overall Score', 'Status', 'Assessment Date'],
      ...stats.responses.map((r: any) => [
        r.companyId || 'Unknown',
        r.pillarId || 'Unknown',
        (r.overallScore || 0).toFixed(2),
        r.status,
        new Date(r.completedAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) return <p>Loading analytics...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Overview of all assessments and responses</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalResponses || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.avgScore || 0).toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.companies || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.completionRate || 0).toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      {stats?.pillarAverages && stats.pillarAverages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pillar Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.pillarAverages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="pillar" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgScore" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {stats?.statusBreakdown && stats.statusBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie dataKey="value" data={stats.statusBreakdown} cx="50%" cy="50%" label>
                  <Cell fill="#3b82f6" />
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download all response data as CSV</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExportCSV}>Export as CSV</Button>
        </CardContent>
      </Card>
    </div>
  );
}
