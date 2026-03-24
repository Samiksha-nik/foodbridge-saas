// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import StatsCard from "../components/shared/StatsCard";
import { TrustBadge } from "../components/ui/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Truck, CheckCircle2, Shield, ArrowRight } from "lucide-react";
import * as ngoDonationApi from "@/api/ngoDonationApi";
import * as authApi from "@/api/authApi";
import * as pickupRequestApi from "@/api/pickupRequestApi";
import { useToast } from "@/components/ui/use-toast";

export default function NGODashboard() {
  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [allPending, setAllPending] = useState([]);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const me = await authApi.getMe();
        setUser(me);

        const [availableRes, myRes, reqRes] = await Promise.all([
          ngoDonationApi.getAvailableDonations().catch(() => ({ data: [] })),
          ngoDonationApi.getMyDonations().catch(() => ({ data: [] })),
          pickupRequestApi.getNgoPickupRequests().catch(() => ({ data: [] })),
        ]);

        setAllPending(availableRes.data || []);
        setDonations(myRes.data || []);
        setPickupRequests(reqRes.data || []);
      } catch (err) {
        console.error("Load NGO dashboard failed", err);
        setAllPending([]);
        setDonations([]);
        setPickupRequests([]);
      } finally {
        setLoading(false);
      }
    };
    load();

    const handler = () => {
      setLoading(true);
      load();
    };
    window.addEventListener("ngo-donation-updated", handler);
    return () => window.removeEventListener("ngo-donation-updated", handler);
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const nearby = allPending.length;
  const pendingPickups = donations.filter((d) =>
    ["accepted", "picked"].includes(d.status)
  ).length;
  const completed = donations.filter((d) => d.status === "delivered").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back{user?.full_name ? `, ${user.full_name}` : ""}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Your NGO overview</p>
        </div>
        <TrustBadge score={user?.trust_score || 0} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Nearby Donations"
          value={nearby}
          subtitle=""
          icon={MapPin}
          color="blue"
          trend={null}
        />
        <StatsCard
          title="Pending Pickups"
          value={pendingPickups}
          subtitle=""
          icon={Truck}
          color="amber"
          trend={null}
        />
        <StatsCard
          title="Completed"
          value={completed}
          subtitle=""
          icon={CheckCircle2}
          color="emerald"
          trend={null}
        />
        <StatsCard
          title="Trust Score"
          value={user?.trust_score?.toFixed(1) || "N/A"}
          subtitle=""
          icon={Shield}
          color="purple"
          trend={null}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Available Nearby</h3>
            <Link
              to={createPageUrl("NearbyFood")}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {allPending.slice(0, 3).map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
            >
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {d.food_name}
                </p>
                <p className="text-xs text-gray-400">
                  {d.quantity} · {d.pickup_location?.slice(0, 30)}
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  d.urgency === "high"
                    ? "bg-red-100 text-red-700"
                    : d.urgency === "medium"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {d.urgency}
              </span>
            </div>
          ))}
          {allPending.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No nearby donations right now
            </p>
          )}
        </Card>

        <Card className="p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Active Pickups</h3>
            <Link
              to={createPageUrl("PickupSchedule")}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {donations
            .filter((d) => ["accepted", "picked"].includes(d.status))
            .slice(0, 3)
            .map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {d.food_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    from {d.provider_name}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    d.status === "picked"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {d.status}
                </span>
              </div>
            ))}
          {donations.filter((d) =>
            ["accepted", "picked"].includes(d.status)
          ).length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No active pickups
            </p>
          )}
        </Card>
      </div>

      <Card className="p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Pickup Requests</h3>
        </div>
        {pickupRequests.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            No pickup requests at the moment.
          </p>
        )}
        {pickupRequests.length > 0 && (
          <div className="space-y-3">
            {pickupRequests.slice(0, 5).map((r) => {
              const d = r.donationId || {};
              const p = r.providerId || {};
              const scorePercent =
                typeof r.aiScore === "number"
                  ? Math.round(r.aiScore * 100)
                  : null;
              const status = r.status || "pending";
                const donationStatus = d.status || "";
                const isPending = status === "pending";
                const isAccepted = status === "accepted";
                const isRejected = status === "rejected";

                // Guard against stale PickupRequest rows: only allow accept/reject
                // when the underlying donation is still pending.
                const allowRespond = isPending && donationStatus === "pending";

                const statusLabel =
                  donationStatus === "delivered"
                    ? "Delivered"
                    : donationStatus === "picked_up"
                    ? "Picked Up"
                    : donationStatus === "accepted"
                    ? "Accepted"
                    : isAccepted
                    ? "Accepted"
                    : isRejected
                    ? "Rejected"
                    : "Pending";

                const statusClass =
                  donationStatus === "delivered"
                    ? "bg-emerald-100 text-emerald-700"
                    : donationStatus === "picked_up"
                    ? "bg-blue-100 text-blue-700"
                    : donationStatus === "accepted"
                    ? "bg-emerald-100 text-emerald-700"
                    : isAccepted
                    ? "bg-emerald-100 text-emerald-700"
                    : isRejected
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700";

                const disabled = !allowRespond || respondingId === (r._id || r.id);
              return (
                <div
                  key={r._id || r.id}
                  className="flex items-start justify-between border border-gray-100 rounded-lg px-3 py-2 bg-white"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      {d.foodName || "Donation"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {d.quantity} {d.quantityUnit} ·{" "}
                      {d.pickupLocation?.address || "Pickup address not set"}
                    </p>
                    <p className="text-xs text-gray-400">
                      From {p.organizationName || p.fullName || "Provider"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {r.distance != null ? `${r.distance} km` : "Distance N/A"}
                      {" • "}
                      {scorePercent != null
                        ? `AI match ${scorePercent}%`
                        : "AI score N/A"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-right ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                    <div className="flex gap-1 justify-end mt-1">
                      <Button
                        variant="outline"
                        size="xs"
                        className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-[11px] px-2 py-0.5"
                        disabled={disabled}
                        onClick={async () => {
                          const id = r._id || r.id;
                          if (!id) return;
                          setRespondingId(id);
                          try {
                            await pickupRequestApi.respondToPickupRequest(
                              id,
                              "accept"
                            );
                            const refreshed =
                              await pickupRequestApi.getNgoPickupRequests();
                            setPickupRequests(refreshed.data || []);
                            toast({
                              title: "Pickup request accepted",
                              description:
                                "The donation has been assigned to your NGO.",
                            });
                          } catch (err) {
                            console.error("Accept request failed", err);
                            toast({
                              title: "Error",
                              description:
                                err.message ||
                                "Failed to accept pickup request.",
                              variant: "destructive",
                            });
                          } finally {
                            setRespondingId(null);
                          }
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        className="text-red-600 border-red-200 hover:bg-red-50 text-[11px] px-2 py-0.5"
                        disabled={disabled}
                        onClick={async () => {
                          const id = r._id || r.id;
                          if (!id) return;
                          setRespondingId(id);
                          try {
                            await pickupRequestApi.respondToPickupRequest(
                              id,
                              "reject"
                            );
                            const refreshed =
                              await pickupRequestApi.getNgoPickupRequests();
                            setPickupRequests(refreshed.data || []);
                            toast({
                              title: "Pickup request rejected",
                              description: "The provider has been notified.",
                            });
                          } catch (err) {
                            console.error("Reject request failed", err);
                            toast({
                              title: "Error",
                              description:
                                err.message ||
                                "Failed to reject pickup request.",
                              variant: "destructive",
                            });
                          } finally {
                            setRespondingId(null);
                          }
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}