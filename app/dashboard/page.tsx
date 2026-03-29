'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowRight, TrendingUp, Target, Zap, CheckCircle, Leaf } from 'lucide-react';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(r => {
  if (!r.ok) throw new Error('Failed to fetch');
  return r.json();
});

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId?: string;
  company?: {
    _id: string;
    name: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: assessmentsData } = useSWR(
    user && user.role !== 'admin' ? '/api/assessments/my-assessments' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [assessments, setAssessments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    latestScore: 0,
    improvementRate: 0,
    status: 'active',
  });

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/session', { 
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (!res.ok) {
          router.push('/auth/login?callbackUrl=/dashboard');
          return;
        }
        
        const data = await res.json();
        
        // If user is admin, redirect to admin dashboard
        if (data.user.role === 'admin') {
          router.replace('/admin');
          return;
        }
        
        setUser(data.user);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/auth/login?callbackUrl=/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (assessmentsData?.assessments) {
      setAssessments(assessmentsData.assessments);
      
      // Calculate improvement rate
      let improvement = 0;
      if (assessmentsData.assessments.length >= 2) {
        const latest = assessmentsData.assessments[0].overallScore;
        const previous = assessmentsData.assessments[1].overallScore;
        improvement = ((latest - previous) / previous) * 100;
      }
      
      setStats({
        totalAssessments: assessmentsData.assessments.length,
        latestScore: assessmentsData.assessments[0]?.overallScore || 0,
        improvementRate: improvement,
        status: 'active',
      });
    }
  }, [assessmentsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="space-y-4 text-center">
          <div className="h-12 w-12 rounded-full border-4 border-green-200 border-t-green-600 animate-spin mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Redirecting...</p>
      </div>
    );
  }

  const chartData = assessments
    .map((a, i) => ({
      name: `Assessment ${assessments.length - i}`,
      score: parseFloat(a.overallScore.toFixed(2)),
      date: new Date(a.completedAt).toLocaleDateString(),
    }))
    .reverse();

  const scorePercentage = (stats.latestScore / 5) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-100 dark:from-slate-950 dark:via-green-950/20 dark:to-slate-900 px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                Welcome, {user.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {user.company?.name || 'Your Organization'}
              </p>
            </div>
            <Button 
              onClick={() => router.push('/survey')} 
              className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Take Assessment
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4">
          {/* Total Assessments */}
          <Card className="border-0 bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Total Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalAssessments}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Digital maturity evaluations</p>
            </CardContent>
          </Card>

          {/* Latest Score */}
          <Card className="border-0 bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                Latest Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats.latestScore.toFixed(2)}
                  <span className="text-base font-normal text-slate-500 dark:text-slate-400">/5.0</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all"
                    style={{ width: `${scorePercentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Improvement Rate */}
          <Card className="border-0 bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.improvementRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats.improvementRate > 0 ? '+' : ''}{stats.improvementRate.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">vs. previous assessment</p>
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-600 dark:bg-green-400 animate-pulse"></div>
                <span className="font-semibold text-slate-900 dark:text-white capitalize">{stats.status}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Ready to assess</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        {assessments.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Trend Chart */}
            <Card className="border-0 bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Score Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(100,116,139,0.5)" />
                    <YAxis domain={[0, 5]} stroke="rgba(100,116,139,0.5)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card className="border-0 bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Assessment Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(100,116,139,0.5)" />
                    <YAxis domain={[0, 5]} stroke="rgba(100,116,139,0.5)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="score" fill="#16a34a" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* CTA Section */}
        {assessments.length === 0 ? (
          <Card className="border-0 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Leaf className="h-6 w-6" />
                Begin Your Digital Maturity Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-green-50">
                Take your first assessment to evaluate your organization's Sustainable Digital Maturity across ICT4S and Sustainable ICT dimensions. Our comprehensive framework aligns with Industry 5.0 and UN SDGs.
              </p>
              <Button 
                onClick={() => router.push('/survey')} 
                className="bg-white text-green-600 hover:bg-green-50 font-semibold"
              >
                Start Assessment
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 bg-gradient-to-r from-green-500 to-teal-500 dark:from-green-600 dark:to-teal-600 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Ready for Your Next Assessment?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-green-50">
                Track your progress over time and measure the impact of your digital maturity initiatives.
              </p>
              <Button 
                onClick={() => router.push('/survey')} 
                className="bg-white text-green-600 hover:bg-green-50 font-semibold"
              >
                Take New Assessment
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Assessments */}
        {assessments.length > 0 && (
          <Card className="border-0 bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Recent Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assessments.map((assessment, idx) => (
                  <div key={assessment._id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{assessment.versionName}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(assessment.completedAt).toLocaleDateString()} at {new Date(assessment.completedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {assessment.overallScore.toFixed(2)}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">/5.0</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
