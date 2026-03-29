'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader } from 'lucide-react';

export default function InitPage() {
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSeed = async () => {
    setSeeding(true);
    setError('');
    setStatus('');

    try {
      setStatus('Seeding database with SDM 5.0 framework...');
      const res = await fetch('/api/seed', { method: 'POST' });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to seed database');
      }

      setStatus('✓ Database seeded successfully!');
      setSuccess(true);
      setTimeout(() => router.push('/admin'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-0 shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Initialize Database</CardTitle>
          <CardDescription>Set up the SDM 5.0 framework with seed data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm">
              This will create the initial framework structure including:
            </p>
            <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
              <li>2 Pillars (ICT4S, Sustainable ICT)</li>
              <li>10 Dimensions across all pillars</li>
              <li>~50 Assessment questions</li>
              <li>6 Maturity levels (0-5)</li>
              <li>Default scoring formulas</li>
            </ul>
          </div>

          {status && (
            <div className="flex gap-2 rounded-lg bg-blue-50 p-3 text-blue-900 text-sm">
              {seeding && <Loader className="h-4 w-4 animate-spin flex-shrink-0" />}
              {!seeding && success && <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />}
              <p>{status}</p>
            </div>
          )}

          {error && (
            <div className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Button
            onClick={handleSeed}
            disabled={seeding || success}
            className="w-full"
            size="lg"
          >
            {seeding ? 'Seeding...' : success ? 'Done! Redirecting...' : 'Initialize Database'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            You only need to do this once. Admin dashboard will open after completion.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
