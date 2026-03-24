import React from "react";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
  accepted: { label: "Accepted", className: "bg-blue-100 text-blue-800 border-blue-200" },
  scheduled: { label: "Scheduled", className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  picked: { label: "Picked Up", className: "bg-purple-100 text-purple-800 border-purple-200" },
  delivered: { label: "Delivered", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-200" },
};

const urgencyConfig = {
  low: { label: "Low", className: "bg-green-100 text-green-800 border-green-200" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-800 border-amber-200" },
  high: { label: "High", className: "bg-red-100 text-red-800 border-red-200" },
};

export function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" };
  return <Badge variant="outline" className={`${config.className} border font-medium text-xs`}>{config.label}</Badge>;
}

export function UrgencyBadge({ urgency }) {
  const config = urgencyConfig[urgency] || { label: urgency, className: "bg-gray-100 text-gray-800" };
  return <Badge variant="outline" className={`${config.className} border font-medium text-xs`}>{config.label}</Badge>;
}

export function AIBadge({ label = "AI Recommended" }) {
  return (
    <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 text-xs font-medium">
      <span className="mr-1">✦</span> {label}
    </Badge>
  );
}

export function TrustBadge({ score }) {
  const color = score >= 4 ? "text-emerald-600 bg-emerald-50" : score >= 2.5 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      ★ {score?.toFixed(1) || "N/A"}
    </span>
  );
}