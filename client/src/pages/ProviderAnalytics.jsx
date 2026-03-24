// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import StatsCard from "../components/shared/StatsCard";
import { Card } from "@/components/ui/card";
import { Package, CheckCircle2, Heart, TrendingUp, Sparkles } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import moment from "moment";
import * as providerDonationApi from "@/api/providerDonationApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProviderAnalytics() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await providerDonationApi.getMyDonations();
        setDonations(res.data || []);
      } catch (err) {
        setDonations([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredDonations = useMemo(() => {
    if (timeRange === "all") return donations;

    const now = new Date();
    const from = new Date(now);
    if (timeRange === "7d") from.setDate(from.getDate() - 7);
    if (timeRange === "30d") from.setDate(from.getDate() - 30);
    if (timeRange === "3m") from.setMonth(from.getMonth() - 3);

    return donations.filter((d) => {
      const created =
        d.created_date || d.createdAt || d.created_at || d.updatedAt;
      if (!created) return false;
      const t = new Date(created).getTime();
      return Number.isFinite(t) && t >= from.getTime();
    });
  }, [donations, timeRange]);

  const totalDonations = filteredDonations.length;
  const deliveredCount = filteredDonations.filter((d) => d.status === "delivered").length;
  const expiredCount = filteredDonations.filter((d) => d.status === "expired").length;
  const pendingCount = Math.max(0, totalDonations - deliveredCount - expiredCount);
  const mealsSaved = filteredDonations.reduce((sum, d) => sum + (d.mealsEquivalent || 0), 0);

  const successRate = totalDonations > 0 ? (deliveredCount / totalDonations) * 100 : 0;
  const successRateRounded = Math.round(successRate);

  const chartBuckets = useMemo(() => {
    const bucketMap = new Map();

    const bucketKey = (createdAt) => {
      const m = moment(createdAt);
      if (timeRange === "7d") return { key: m.format("YYYY-MM-DD"), label: m.format("MMM D") };
      if (timeRange === "30d") {
        const start = m.clone().startOf("week");
        return { key: start.format("YYYY-MM-DD"), label: start.format("MMM D") };
      }
      // 3m + all time: month buckets
      const start = m.clone().startOf("month");
      return { key: start.format("YYYY-MM"), label: start.format("MMM YYYY") };
    };

    filteredDonations.forEach((d) => {
      const created = d.created_date || d.createdAt || d.created_at || d.updatedAt;
      if (!created) return;

      const { key, label } = bucketKey(created);
      const cur = bucketMap.get(key) || { key, label, donations: 0, meals: 0 };
      cur.donations += 1;
      cur.meals += d.mealsEquivalent || 0;
      bucketMap.set(key, cur);
    });

    return Array.from(bucketMap.values()).sort((a, b) => {
      if (timeRange === "7d") return new Date(a.key).getTime() - new Date(b.key).getTime();
      if (timeRange === "30d") return new Date(a.key).getTime() - new Date(b.key).getTime();
      return moment(a.key, "YYYY-MM").valueOf() - moment(b.key, "YYYY-MM").valueOf();
    });
  }, [filteredDonations, timeRange]);

  const hasData = totalDonations > 0;
  const safeChartBuckets = chartBuckets?.length ? chartBuckets : [{ key: "empty", label: "No data", donations: 0, meals: 0 }];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your donation impact
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Time range</span>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard title="Total Donations" value={totalDonations} icon={Package} color="blue" />
        <StatsCard title="Delivered" value={deliveredCount} icon={CheckCircle2} color="emerald" />
        <StatsCard title="Meals Saved" value={mealsSaved} icon={Heart} color="purple" />
        <StatsCard title="Success Rate" value={`${successRateRounded}%`} icon={TrendingUp} color="amber" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">
            Donations Over Time
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={safeChartBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="donations"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Meals Saved Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={safeChartBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="meals"
                fill="#ede9fe"
                stroke="#8b5cf6"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card className="p-5 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Status Breakdown</h3>
        <ResponsiveContainer width="100%" height={260}>
          {hasData ? (
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie
                data={[
                  { name: "Delivered", value: deliveredCount },
                  { name: "Pending", value: pendingCount },
                  { name: "Expired", value: expiredCount },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) => {
                  const p = Number.isFinite(percent) ? (percent * 100).toFixed(0) : "0";
                  return `${name} ${p}%`;
                }}
              >
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
                <Cell fill="#ef4444" />
              </Pie>
            </PieChart>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-sm text-gray-500">
              No donations in this range.
            </div>
          )}
        </ResponsiveContainer>
      </Card>

      {/* Insights */}
      <Card className="p-5 border border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h3 className="font-semibold text-gray-900">Insights</h3>
        </div>
        <div className="space-y-1 text-sm text-gray-700">
          <p>You have saved {mealsSaved} meals.</p>
          <p>Your success rate is {successRateRounded}%.</p>
          {expiredCount > 0 && (
            <p>
              Some donations expired. Try reducing delay between cooking
              and donation.
            </p>
          )}
        </div>
      </Card>

      {/* Frequent NGO Partner (best-effort from existing donation fields) */}
      {(() => {
        const counts = new Map();
        filteredDonations.forEach((d) => {
          if (d.status !== "delivered") return;
          if (!d.assignedNgoId) return;
          const id =
            typeof d.assignedNgoId === "string"
              ? d.assignedNgoId
              : d.assignedNgoId?._id
              ? d.assignedNgoId._id.toString()
              : d.assignedNgoId?.toString?.();
          if (!id) return;
          counts.set(id, (counts.get(id) || 0) + 1);
        });

        const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
        if (!top) return null;

        const partnerId = top[0];
        const display =
          typeof partnerId === "string" && partnerId.length >= 6
            ? `${partnerId.slice(0, 6)}...`
            : String(partnerId);

        return (
          <p className="text-sm text-gray-600">
            Most frequent pickup partner: {display}
          </p>
        );
      })()}
    </div>
  );
}