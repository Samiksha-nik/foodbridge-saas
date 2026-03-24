import { useCallback, useEffect, useState } from "react";
import { createPageUrl } from "../utils";
import { getDashboardStats } from "@/api/providerDonationApi";

export function useProviderDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDashboardStats();
      setStats(res.data || null);
    } catch (err) {
      if (err?.status === 401) {
        window.location.href = createPageUrl("Login");
        return;
      }
      if (err?.status === 403) {
        setError("Access denied. Provider access required.");
        setStats(null);
        return;
      }
      setError(err?.message || "Failed to load dashboard stats.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

