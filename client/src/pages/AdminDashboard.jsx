import React, { useState, useEffect } from "react";
import * as adminApi from "@/api/adminApi";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import StatsCard from "../components/shared/StatsCard";
import { Card } from "@/components/ui/card";
import { Package, Users, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const json = await adminApi.getAdminDashboard();
        const d = json?.data;
        if (d) {
          setStats(d);
          setAlerts(d.recentAlerts || []);
          setMonthlyData(d.monthlyDonationTrend || []);
          console.log("Admin dashboard stats:", d);
        }
      } catch (e) {
        console.error("Admin dashboard fetch failed", e);
        setStats(null);
        setAlerts([]);
        setMonthlyData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  const totalMeals = stats?.mealsSaved ?? 0;
  const activeUsers = stats?.activeUsers ?? 0;
  const totalDonations = stats?.totalDonations ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview and monitoring</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Food Saved" value={`${totalMeals} meals`} icon={Package} color="emerald" />
        <StatsCard title="Active Users" value={activeUsers} icon={Users} color="blue" />
        <StatsCard title="Total Donations" value={totalDonations} icon={TrendingUp} color="purple" />
        <StatsCard title="Open Alerts" value={stats?.openAlerts ?? alerts.length} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 border border-gray-100 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Donation Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip />
              <Bar dataKey="donations" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Alerts</h3>
            <Link to={createPageUrl("FraudAlerts")} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
              All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No open alerts</p>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.alert_type?.replace(/_/g, " ")}</p>
                    <p className="text-xs text-gray-500">{a.user_name || a.user_email}</p>
                  </div>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${a.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{a.severity}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
