'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Brain, Shield, TrendingUp, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        // Not authenticated
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user?.role === 'admin') {
    return router.push('/admin');
  }

  return (
    <div className="min-h-screen">
      {/* Header Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <BarChart3 className="h-6 w-6 text-primary" />
            SDM 5.0
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Button variant="outline" onClick={() => router.push('/admin')}>
                    Admin Panel
                  </Button>
                )}
                {user.role === 'company' && (
                  <Button variant="outline" onClick={() => router.push('/dashboard')}>
                    My Assessments
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/';
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push('/login')}>
                  Login
                </Button>
                <Button onClick={() => router.push('/register')}>Register</Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => router.push('/init')}>
              Initialize DB
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl font-bold text-balance">
            Measure Your Digital Sustainability Maturity
          </h1>
          <p className="text-xl text-muted-foreground text-balance">
            Using the Sustainable Development Model (SDM) 5.0 framework to assess your organization's ICT sustainability across 10 critical dimensions.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => router.push('/survey')}>
              Start Assessment <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/login')}>
              View Results
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Comprehensive Assessment</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Answer questions across 10 dimensions spanning Technology, Strategy, People, Culture, Organization, and Data/Cybersecurity.
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Real-Time Scoring</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Instantly see your maturity scores across pillars and dimensions with interactive visualizations and trend analysis.
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Get personalized recommendations powered by Grok AI to improve your digital sustainability maturity.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why SDM 5.0 */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Why SDM 5.0?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Research-Backed Framework</h3>
                  <p className="text-sm text-muted-foreground">Based on peer-reviewed academic research on digital sustainability and maturity models.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Two Critical Pillars</h3>
                  <p className="text-sm text-muted-foreground">Assess both ICT4S (sustainable use of ICT) and Sustainable ICT (green technology practices).</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Actionable Insights</h3>
                  <p className="text-sm text-muted-foreground">Identify gaps and get targeted recommendations for improvement at every dimension.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Dynamic Scoring</h3>
                  <p className="text-sm text-muted-foreground">Framework weights adjust automatically—changes to one assessment instantly update all scores.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Multi-Level Maturity</h3>
                  <p className="text-sm text-muted-foreground">0-5 scale from Traditional to Matured, clearly defining each stage of organizational readiness.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Benchmarking</h3>
                  <p className="text-sm text-muted-foreground">Compare your results against industry standards and peer organizations.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6 bg-primary/5 rounded-2xl p-12 border border-primary/20">
          <h2 className="text-3xl font-bold">Ready to Assess Your Digital Sustainability?</h2>
          <p className="text-lg text-muted-foreground">
            Join organizations transforming their digital practices to achieve sustainability goals.
          </p>
          <Button size="lg" onClick={() => router.push('/survey')}>
            Start Free Assessment <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>SDM 5.0 Assessment Platform • Built with research excellence in sustainability</p>
          <p className="mt-2">© 2024 SDM 5.0 Initiative. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
