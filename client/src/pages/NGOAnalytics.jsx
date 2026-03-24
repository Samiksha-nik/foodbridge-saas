// @ts-nocheck
import React, { useEffect, useState } from "react";
import StatsCard from "../components/shared/StatsCard";
import { Card } from "@/components/ui/card";
import { Truck, CheckCircle2, TrendingUp, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import moment from "moment";
import * as ngoDonationApi from "@/api/ngoDonationApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

function Loader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function MetricsSection({ metrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatsCard
        title="Acceptance Rate"
        value={metrics?.acceptanceRate != null ? `${metrics.acceptanceRate}%` : "N/A"}
        subtitle=""
        icon={CheckCircle2}
        color="blue"
        trend={null}
      />
      <StatsCard
        title="Completion Rate"
        value={metrics?.completionRate != null ? `${metrics.completionRate}%` : "N/A"}
        subtitle=""
        icon={TrendingUp}
        color="emerald"
        trend={null}
      />
      <StatsCard
        title="Avg Pickup Time"
        value={metrics?.avgPickupTime != null ? `${metrics.avgPickupTime}h` : "N/A"}
        subtitle=""
        icon={Truck}
        color="purple"
        trend={null}
      />
    </div>
  );
}

function ChartsSection({ analytics, days, onDaysChange }) {
  const pickupsTrend = analytics?.pickupsTrend || [];
  const categoryDistribution = analytics?.categoryDistribution || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Time range</span>
          <Select value={String(days)} onValueChange={(v) => onDaysChange(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">
            Pickups Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={pickupsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip />
              <Bar dataKey="pickups" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">
            Category Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {categoryDistribution.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function ImpactSection({ impactStats }) {
  const meals = impactStats?.mealsSaved ?? 0;
  const waste = impactStats?.foodWasteReduced ?? 0;
  const people = impactStats?.peopleServed ?? 0;

  return (
    <Card className="p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Impact</h3>
        <Badge variant="outline" className="border-purple-200 text-purple-700">
          data-driven
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500">Meals Saved</p>
          <p className="text-2xl font-semibold text-gray-900">{meals}</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500">Food Waste Reduced</p>
          <p className="text-2xl font-semibold text-gray-900">{waste}</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500">People Served</p>
          <p className="text-2xl font-semibold text-gray-900">{people}</p>
        </div>
      </div>
    </Card>
  );
}

function ActivityTimeline({ items }) {
  return (
    <Card className="p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        <Activity className="w-4 h-4 text-gray-400" />
      </div>

      {(!items || items.length === 0) ? (
        <p className="text-sm text-gray-500">No recent activity in this range.</p>
      ) : (
        <div className="space-y-3">
          {items.map((a, idx) => (
            <div key={`${a.timestamp || idx}-${idx}`} className="flex items-start gap-3">
              <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {a.actionType?.replace("_", " ")}:{" "}
                  <span className="text-gray-600 font-normal">{a.text}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {a.timestamp ? moment(a.timestamp).fromNow() : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function InsightCard({ metrics }) {
  const trust = metrics?.aiTrustScore ?? null;
  const message =
    trust == null
      ? "Your performance is being monitored to improve match quality over time."
      : trust >= 80
      ? "High trust signals help you get prioritized in AI recommendations."
      : trust >= 50
      ? "Steady trust signals — keep completing pickups for better matching."
      : "Improve operational reliability to strengthen trust and boost match quality.";

  return (
    <Card className="p-5 border border-gray-100">
      <h3 className="font-semibold text-gray-900 mb-2">AI Insight</h3>
      <p className="text-sm text-gray-600">{message}</p>
    </Card>
  );
}

export default function NGOAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        setAnalytics(null);
        const res = await ngoDonationApi.getNgoAnalytics(days);
        if (cancelled) return;
        setAnalytics(res || null);
      } catch (err) {
        if (cancelled) return;
        setAnalytics(null);
        setError(err?.message || "Failed to load analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [days]);

  if (loading && !analytics) return <Loader />;

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            NGO Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Your collection and delivery metrics
          </p>
        </div>
        <Card className="p-8 text-center border border-gray-100">
          <p className="text-sm text-gray-500">
            {error || "Analytics not available yet."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          NGO Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Data-driven performance monitoring for your pickups and deliveries
        </p>
      </div>

      {/* Performance Metrics (Top Row) */}
      <MetricsSection metrics={analytics.metrics} />

      {/* Charts + filter */}
      <ChartsSection
        analytics={analytics}
        days={days}
        onDaysChange={(n) => setDays(n)}
      />

      {/* Impact */}
      <ImpactSection impactStats={analytics.impactStats} />

      {/* Recent Activity */}
      <ActivityTimeline items={analytics.recentActivity} />

      {/* AI Insight */}
      <InsightCard metrics={analytics.metrics} />
    </div>
  );
}