import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Mail, Phone, MapPin, FileText } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const getBaseUrl = () =>
  import.meta.env.VITE_API_URL || "http://localhost:5000";

async function fetchNgoProfile(ngoId) {
  const res = await fetch(`${getBaseUrl()}/api/users/ngo/${encodeURIComponent(ngoId)}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed to load NGO profile");
  return data?.data;
}

export default function NgoProfile() {
  const [searchParams] = useSearchParams();
  const ngoId = searchParams.get("id");
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (!ngoId?.trim()) {
      setLoading(false);
      setError("Invalid NGO");
      return;
    }
    setLoading(true);
    setError("");
    fetchNgoProfile(ngoId)
      .then(setNgo)
      .catch((err) => setError(err?.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [ngoId]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (error || !ngo)
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link to={user?.app_role === "provider" ? createPageUrl("ProviderDashboard") : createPageUrl("Landing")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <Card className="p-8 text-center">
          <p className="text-red-600">{error || "NGO not found"}</p>
        </Card>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={user?.app_role === "provider" ? createPageUrl("ProviderDashboard") : createPageUrl("Landing")}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">NGO Profile</h1>
      </div>

      <Card className="p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 mb-6 pb-6 border-b border-gray-50">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {ngo.name?.[0] || "N"}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 text-lg">{ngo.name}</h2>
            {ngo.email && (
              <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5" />
                {ngo.email}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {ngo.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{ngo.phone}</span>
            </div>
          )}
          {ngo.address && (
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span>{ngo.address}</span>
            </div>
          )}
          {ngo.description && (
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="whitespace-pre-wrap">{ngo.description}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
