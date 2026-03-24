import React, { useState, useEffect } from "react";
import * as adminApi from "@/api/adminApi";
import StatsCard from "../components/shared/StatsCard";
import { Card } from "@/components/ui/card";
import { Users, Package, CheckCircle2, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminAnalytics() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const json = await adminApi.getAdminAnalytics();
        setPayload(json?.data || null);
        const s = json?.data?.summary;
        if (s) console.log("Admin analytics summary:", s);
      } catch (e) {
        console.error("Admin analytics fetch failed", e);
        setPayload(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  const summary = payload?.summary;
  const insights = payload?.insights;
  const monthlyData = (payload?.monthlyDonationsVsDeliveries || []).slice(-8);
  const statusRaw = payload?.statusDistributionAll || [];
  const statusTotal = statusRaw.reduce((s, x) => s + (x.value || 0), 0);
  const statusData = statusRaw.filter((x) => x.value > 0);

  const barTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs shadow-sm">
        <p className="font-medium text-gray-700 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} className="text-gray-600">
            {p.dataKey === "total" ? "Total donations" : "Delivered"}: {p.value}
          </p>
        ))}
      </div>
    );
  };

  const pieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    const value = p.value;
    const name = p.name;
    const pct = statusTotal > 0 ? ((value / statusTotal) * 100).toFixed(1) : "0";
    return (
      <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs shadow-sm">
        <p className="font-medium text-gray-800 capitalize">{name}</p>
        <p className="text-gray-600">Count: {value}</p>
        <p className="text-gray-500">Share: {pct}%</p>
      </div>
    );
  };
  const growthData = payload?.userGrowthByMonth || [];
  const hasEnoughUserGrowthData = payload?.hasEnoughUserGrowthData === true;

  const delivered = summary?.deliveredDonations ?? 0;
  const totalMeals = summary?.mealsSaved ?? 0;
  const providers = summary?.providers ?? 0;
  const ngos = summary?.ngos ?? 0;
  const totalUsers = summary?.totalUsers ?? 0;
  const totalDonations = summary?.totalDonations ?? 0;
  const efficiency = summary?.platformEfficiencyPercent ?? 0;
  const successRate = summary?.successRatePercent ?? efficiency;

  const topNgo = insights?.topNgo;
  const expiryInsight = insights?.expiryInsight;
  const fraudInsight = insights?.fraudInsight;

  const xKey = monthlyData[0]?.monthLabel ? "monthLabel" : "month";
  const growthXKey = growthData[0]?.monthLabel ? "monthLabel" : "month";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Platform-wide metrics and insights</p>
        {insights && (
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-medium text-gray-700">Top NGO:</span>{" "}
            {topNgo
              ? `${topNgo.name} (${topNgo.deliveredCount} delivered)`
              : "No delivered donations assigned to NGOs yet"}
            <span className="hidden sm:inline"> · </span>
            <span className="block sm:inline mt-1 sm:mt-0">
              <span className="font-medium text-gray-700">Fraud alerts:</span>{" "}
              {fraudInsight?.open ?? 0} open, {fraudInsight?.resolved ?? 0} resolved
            </span>
            {expiryInsight?.showWarning && (
              <span className="block mt-1 text-amber-700 font-medium">
                Warning: Over 30% of donations are expired — review pickup and matching workflows.
              </span>
            )}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={totalUsers} icon={Users} color="blue" subtitle={`${providers} providers · ${ngos} NGOs`} />
        <StatsCard title="Total Donations" value={totalDonations} icon={Package} color="purple" subtitle={`Success rate ${successRate}%`} />
        <StatsCard title="Delivered" value={delivered} icon={CheckCircle2} color="emerald" subtitle={`Platform efficiency ${efficiency}%`} />
        <StatsCard title="Meals Saved" value={totalMeals} icon={AlertTriangle} color="amber" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Donations vs Deliveries</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip content={barTooltip} />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total donations" />
              <Bar dataKey="delivered" fill="#10b981" radius={[4, 4, 0, 0]} name="Delivered" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Status Distribution</h3>
          {statusData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">No donation status data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={pieTooltip} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-gray-500 mt-3 leading-relaxed">
            Includes pending, accepted, picked (picked up), delivered, expired
            {statusTotal > 0
              ? ` · Expired ${expiryInsight?.expiredPercent ?? 0}% of all donations`
              : ""}
          </p>
        </Card>
      </div>

      <Card className="p-5 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">User Growth</h3>
        {!hasEnoughUserGrowthData ? (
          <p className="text-sm text-gray-400 text-center py-16">Not enough data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey={growthXKey} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} allowDecimals={false} />
              <Tooltip
                formatter={(value) => [value, "New users"]}
                labelFormatter={(label) => label}
              />
              <Line type="monotone" dataKey="users" name="Users" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
