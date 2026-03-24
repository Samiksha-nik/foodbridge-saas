import React, { useState, useEffect } from "react";
import * as adminApi from "@/api/adminApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ShieldAlert, CheckCircle2, XCircle, Eye } from "lucide-react";
import moment from "moment";
import { AIBadge } from "../components/ui/StatusBadge";

const severityColors = {
  low: "bg-blue-100 text-blue-700 border-blue-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-red-100 text-red-700 border-red-200",
};

const statusColors = {
  open: "bg-red-100 text-red-700",
  investigating: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
  dismissed: "bg-gray-100 text-gray-700",
};

export default function FraudAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const json = await adminApi.getAdminFraudAlerts({ status: "all", limit: 300 });
        const list = json.data || [];
        setAlerts(list);
        console.log("[FraudAlerts] loaded:", list.length);
      } catch (e) {
        console.error("[FraudAlerts] fetch failed", e);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateStatus = async (alert, newStatus) => {
    try {
      const json = await adminApi.patchAdminFraudAlert(alert.id, { status: newStatus });
      const row = json?.data;
      if (row) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alert.id ? { ...a, ...row } : a))
        );
      } else {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alert.id ? { ...a, status: newStatus } : a))
        );
      }
    } catch (e) {
      console.error("[FraudAlerts] update status failed", e);
    }
  };

  const filtered =
    statusFilter === "all"
      ? alerts
      : alerts.filter((a) => a.status === statusFilter);

  const openCount = alerts.filter(
    (a) => a.status === "open" || a.status === "investigating"
  ).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fraud Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">{openCount} open alerts</p>
        </div>
        <AIBadge label="AI Monitored" />
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="investigating">Investigating</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="dismissed">Dismissed</SelectItem>
        </SelectContent>
      </Select>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <ShieldAlert className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No fraud alerts</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(a => (
            <Card key={a.id} className={`p-5 border ${a.severity === "high" ? "border-red-200 bg-red-50/30" : "border-gray-100"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${a.severity === "high" ? "bg-red-100" : "bg-amber-100"}`}>
                    <AlertTriangle className={`w-5 h-5 ${a.severity === "high" ? "text-red-600" : "text-amber-600"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900 capitalize">{a.alert_type?.replace(/_/g, " ")}</h3>
                      <Badge variant="outline" className={`${severityColors[a.severity]} border text-xs`}>{a.severity}</Badge>
                      <Badge className={`${statusColors[a.status]} text-xs border-0`}>{a.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{a.description}</p>
                    <p className="text-xs text-gray-400">User: {a.user_name || a.user_email} ({a.user_role}) · {moment(a.created_date).fromNow()}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {a.status === "open" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(a, "investigating")} className="h-7 text-xs">
                        <Eye className="w-3.5 h-3.5 mr-1" /> Investigate
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(a, "dismissed")} className="h-7 text-xs text-gray-500">
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Dismiss
                      </Button>
                    </>
                  )}
                  {a.status === "investigating" && (
                    <Button size="sm" onClick={() => updateStatus(a, "resolved")} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolve
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
