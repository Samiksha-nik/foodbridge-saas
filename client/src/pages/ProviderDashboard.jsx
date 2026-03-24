import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import StatsCard from "../components/shared/StatsCard";
import { StatusBadge, UrgencyBadge, AIBadge } from "../components/ui/StatusBadge";
import { Package, Truck, CheckCircle2, Heart, Plus, ArrowRight, Sparkles, User, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import moment from "moment";
import { useProviderDashboard } from "@/hooks/useProviderDashboard";
import * as providerDonationApi from "@/api/providerDonationApi";

export default function ProviderDashboard() {
  const [donations, setDonations] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [recentError, setRecentError] = useState("");
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [aiDonationId, setAiDonationId] = useState(null);
  const [loadingAI, setLoadingAI] = useState(true);
  const { stats, loading: loadingStats, error: statsError } =
    useProviderDashboard();

  useEffect(() => {
    const loadRecent = async () => {
      setLoadingRecent(true);
      setRecentError("");
      try {
        const res = await providerDonationApi.getProviderDonations({
          limit: 50,
        });
        setDonations(res.data || []);
      } catch (err) {
        if (err?.status === 401) {
          window.location.href = createPageUrl("Login");
          return;
        }
        if (err?.status === 403) {
          setRecentError("Access denied. Provider access required.");
          setDonations([]);
          return;
        }
        setRecentError(
          err?.message || "Failed to load recent donations. Please try again."
        );
      } finally {
        setLoadingRecent(false);
      }
    };

    loadRecent();
  }, []);

  useEffect(() => {
    const loadAiRecommendation = async () => {
      setLoadingAI(true);
      try {
        const res = await providerDonationApi.getProviderAiRecommendation();
        setAiRecommendation(res.recommendation || null);
        setAiDonationId(res.donationId || null);
      } catch (err) {
        if (err?.status !== 401 && err?.status !== 403) {
          setAiRecommendation(null);
          setAiDonationId(null);
        }
      } finally {
        setLoadingAI(false);
      }
    };

    loadAiRecommendation();
  }, []);

  const total = stats?.totalDonations ?? donations.length;
  const active = stats?.activeDonations ?? 0;
  const delivered = stats?.deliveredCount ?? 0;
  const meals = stats?.totalMealsEquivalent ?? 0;
  const recent = donations.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Provider Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's your donation overview</p>
        </div>
        <Link to={createPageUrl("AddDonation")}>
          <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">
            <Plus className="w-4 h-4 mr-2" /> Add Donation
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Donations"
          value={loadingStats ? "…" : total}
          subtitle=""
          icon={Package}
          color="blue"
          trend={null}
        />
        <StatsCard
          title="Active Pickups"
          value={loadingStats ? "…" : active}
          subtitle=""
          icon={Truck}
          color="amber"
          trend={null}
        />
        <StatsCard
          title="Delivered"
          value={loadingStats ? "…" : delivered}
          subtitle=""
          icon={CheckCircle2}
          color="emerald"
          trend={null}
        />
        <StatsCard
          title="Meals Saved"
          value={loadingStats ? "…" : meals || 0}
          icon={Heart}
          color="purple"
          subtitle="estimated impact"
          trend={null}
        />
      </div>

      {statsError && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {statsError}
        </p>
      )}

      {/* AI Recommended NGO Card */}
      <Card className="p-5 border border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">AI Recommended Partner</h3>
              <AIBadge />
            </div>
            {loadingAI ? (
              <p className="text-sm text-gray-500">Loading AI recommendations...</p>
            ) : aiRecommendation ? (
              <>
                <p className="text-sm text-gray-700 font-medium mb-2">{aiRecommendation.name}</p>
                <p className="text-sm text-gray-500 mb-3">{aiRecommendation.reason}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-xs font-medium">
                    AI {aiRecommendation.aiScore}%
                  </span>
                  {aiRecommendation.distance != null && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs">
                      <MapPin className="w-3 h-3" />
                      {aiRecommendation.distance} km
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    Trust {aiRecommendation.trustScore}% · Acceptance {aiRecommendation.acceptanceRate}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiDonationId && (
                    <Link to={createPageUrl(`DonationDetail?id=${aiDonationId}`)}>
                      <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                        View Donation
                      </Button>
                    </Link>
                  )}
                  {aiRecommendation?.ngoId && (
                    <Link to={createPageUrl(`NgoProfile?id=${aiRecommendation.ngoId}`)}>
                      <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                        <User className="w-3.5 h-3.5 mr-1" /> View NGO Profile
                      </Button>
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-3">Add a donation to see AI-powered NGO recommendations.</p>
                <Link to={createPageUrl("AddDonation")}>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Donation
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Recent Donations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Donations</h2>
          <Link to={createPageUrl("MyDonations")} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loadingRecent ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 text-sm">Loading recent donations...</p>
          </Card>
        ) : recentError ? (
          <Card className="p-8 text-center">
            <p className="text-red-600 text-sm">{recentError}</p>
          </Card>
        ) : recent.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No donations yet. Start by adding your first donation!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recent.map((d) => (
              <Link
                key={d._id}
                to={createPageUrl(`DonationDetail?id=${d._id}`)}
              >
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {d.photoUrl ? (
                        <img
                          src={d.photoUrl}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {d.foodName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {moment(d.createdAt).fromNow()} · {d.quantity}{" "}
                          {d.quantityUnit}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <UrgencyBadge urgency={d.expiryRiskLevel} />
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}