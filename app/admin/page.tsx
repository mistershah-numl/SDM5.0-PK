"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, FileText, TrendingUp, Users, Loader2, Database, BarChart3, PieChart } from "lucide-react";
import { toast } from "sonner";

interface Analytics {
  totalCompanies: number;
  totalAssessments: number;
  avgScore: number;
  leadersAvg: number;
  laggardsAvg: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session", { 
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (!res.ok) {
          router.push("/auth/login?callbackUrl=/admin");
          return;
        }
        
        const data = await res.json();
        
        // If not admin, redirect to dashboard
        if (data.user.role !== 'admin') {
          router.replace("/dashboard");
          return;
        }
        
        fetchAnalytics();
      } catch (error) {
        console.error('Auth error:', error);
        router.push("/auth/login?callbackUrl=/admin");
      }
    };

    checkAuth();
  }, [router]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics", {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {
      // Analytics may fail if no data yet
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Database seeded successfully");
        fetchAnalytics();
      } else {
        toast.info(data.message || data.error);
      }
    } catch {
      toast.error("Failed to seed database");
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="space-y-4 text-center">
          <div className="h-12 w-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-900 px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                SDM 5.0 Assessment Platform Overview
              </p>
            </div>
            <Button 
              onClick={handleSeed} 
              disabled={seeding} 
              variant="outline"
              className="gap-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
            >
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              {seeding ? "Seeding..." : "Seed Database"}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Companies */}
          <Card className="border-0 bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Total Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900 dark:text-white">{analytics?.totalCompanies ?? 0}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Organizations registered</p>
            </CardContent>
          </Card>

          {/* Total Assessments */}
          <Card className="border-0 bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Total Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900 dark:text-white">{analytics?.totalAssessments ?? 0}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Completed evaluations</p>
            </CardContent>
          </Card>

          {/* Average Score */}
          <Card className="border-0 bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-teal-600" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900 dark:text-white">
                {analytics?.avgScore?.toFixed(2) ?? "—"}
                <span className="text-base font-normal text-slate-500 dark:text-slate-400">/5.0</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Platform average</p>
            </CardContent>
          </Card>

          {/* Leaders vs Laggards */}
          <Card className="border-0 bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-violet-600" />
                Leaders Gap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{analytics?.leadersAvg?.toFixed(2) ?? "—"}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">vs</span>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">{analytics?.laggardsAvg?.toFixed(2) ?? "—"}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Top 20% vs Bottom 20%</p>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card className="border-0 bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-emerald-50">
                Click <span className="font-semibold bg-white/20 px-2 py-1 rounded">Seed Database</span> to populate SDM 5.0 framework with defaults
              </li>
              <li className="text-emerald-50">
                Navigate to <span className="font-semibold">Index Versions</span> to manage assessment framework versions
              </li>
              <li className="text-emerald-50">
                Use <span className="font-semibold">Pillars</span>, <span className="font-semibold">Dimensions</span>, and <span className="font-semibold">Questions</span> pages to customize
              </li>
              <li className="text-emerald-50">
                Configure <span className="font-semibold">Maturity Levels</span> and <span className="font-semibold">Formulas</span> for scoring
              </li>
              <li className="text-emerald-50">
                View <span className="font-semibold">Analytics</span> as companies complete assessments
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-0 bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all cursor-pointer hover:translate-y-[-2px]">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Manage Versions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Create and manage assessment framework snapshots</p>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Go to Versions</Button>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all cursor-pointer hover:translate-y-[-2px]">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Configure Framework</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Set up pillars, dimensions, and questions</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Configure</Button>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all cursor-pointer hover:translate-y-[-2px]">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">View Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Analyze assessment results and trends</p>
              <Button className="w-full bg-teal-600 hover:bg-teal-700">Analytics</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
