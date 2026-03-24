import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import DeliveryTimeline from "../components/shared/DeliveryTimeline";
import { StatusBadge, UrgencyBadge, AIBadge } from "../components/ui/StatusBadge";
import RatingModal from "../components/shared/RatingModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, MapPin, Clock, Thermometer, Users, Star, Image } from "lucide-react";
import moment from "moment";
import * as providerDonationApi from "@/api/providerDonationApi";
import * as ngoDonationApi from "@/api/ngoDonationApi";
import * as authApi from "@/api/authApi";
import * as pickupRequestApi from "@/api/pickupRequestApi";
import { useToast } from "@/components/ui/use-toast";
import LocationMap from "@/components/maps/LocationMap";

export default function DonationDetail() {
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showRating, setShowRating] = useState(false);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [donationId, setDonationId] = useState(null);
  const lastStatusRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      if (!id) {
        setLoading(false);
        return;
      }
      setDonationId(id);
      try {
        let currentUser = null;
        try {
          currentUser = await authApi.getMe();
          setUser(currentUser);
        } catch {
          // ignore; fallback to existing redirect logic below
        }

        const res = await providerDonationApi.getSingleDonation(id);
        const donationData = res.data || null;
        setDonation(donationData);
        lastStatusRef.current = donationData?.status || null;

        if (currentUser?.role === "provider" && donationData?._id) {
          setLoadingRequests(true);
          try {
            const prRes = await pickupRequestApi.getProviderPickupRequests();
            const list = (prRes.data || []).filter((r) => {
              const dId = r.donationId?._id || r.donationId;
              return dId && String(dId) === String(donationData._id);
            });
            setPickupRequests(list);
          } catch {
            setPickupRequests([]);
          } finally {
            setLoadingRequests(false);
          }
        }

        setLoading(false);
      } catch (err) {
        if (err?.status === 401) {
          window.location.href = createPageUrl("Login");
          return;
        }
        if (err?.status === 403 || err?.status === 404) {
          try {
            const resNgo = await ngoDonationApi.getSingleDonation(id);
            setDonation(resNgo.data || null);
          } catch (innerErr) {
            if (innerErr?.status === 401) {
              window.location.href = createPageUrl("Login");
              return;
            }
            setDonation(null);
          } finally {
            setLoading(false);
          }
          return;
        }
        setDonation(null);
        setLoading(false);
      }
    };
    load();
  }, []);

  // Lightweight auto-refresh on window focus so provider sees latest status
  useEffect(() => {
    if (!donationId) return;

    const handleFocus = async () => {
      try {
        const me = await authApi.getMe();
        if (me.role !== "provider") return;

        const res = await providerDonationApi.getSingleDonation(donationId);
        const donationData = res.data || null;
        const prevStatus = lastStatusRef.current;
        setDonation(donationData);
        lastStatusRef.current = donationData?.status || null;

        if (donationData?._id) {
          setLoadingRequests(true);
          try {
            const prRes = await pickupRequestApi.getProviderPickupRequests();
            const list = (prRes.data || []).filter((r) => {
              const dId = r.donationId?._id || r.donationId;
              return dId && String(dId) === String(donationData._id);
            });
            setPickupRequests(list);
          } catch {
            setPickupRequests([]);
          } finally {
            setLoadingRequests(false);
          }
        }
        if (
          prevStatus &&
          prevStatus !== "accepted" &&
          donationData?.status === "accepted"
        ) {
          toast({
            title: "Donation accepted",
            description: "An NGO has accepted your donation.",
          });
        }
      } catch {
        // ignore focus refresh errors
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [donationId]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (!donation)
    return (
      <div className="text-center py-12 text-gray-500">Donation not found</div>
    );

  const backPage = "MyDonations";
  const isProvider = user?.role === "provider";
  const isCompleted =
    donation.status === "delivered" || donation.status === "completed";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={createPageUrl(backPage)}>
          <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {donation.foodName}
          </h1>
          <p className="text-sm text-gray-500">
            Listed {moment(donation.createdAt).fromNow()}
          </p>
        </div>
        <div className="flex gap-2">
          <UrgencyBadge urgency={donation.expiryRiskLevel} />
          <StatusBadge status={donation.status} />
        </div>
      </div>

      {isProvider && donation.status === "pending" && (
        <Card className="p-4 border border-amber-100 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">
            Waiting for NGO response...
          </p>
          {loadingRequests ? (
            <p className="text-xs text-amber-700 mt-1">
              Loading your pickup requests...
            </p>
          ) : pickupRequests.length > 0 ? (
            <div className="mt-2 space-y-1">
              {pickupRequests.map((r) => {
                const ngo = r.ngoId || {};
                return (
                  <p
                    key={r._id || r.id}
                    className="text-xs text-amber-800"
                  >
                    Request sent to{" "}
                    <strong>{ngo.ngoName || ngo.fullName || "NGO"}</strong> ·{" "}
                    <span className="uppercase text-[10px] font-semibold">
                      {r.status}
                    </span>
                  </p>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-amber-700 mt-1">
              No pickup requests have been sent yet for this donation.
            </p>
          )}
        </Card>
      )}

      {isProvider && donation.status === "accepted" && (
        <Card className="p-4 border border-emerald-100 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-800">
            Pickup Assigned
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            NGO:{" "}
            <strong>{donation.assignedNgoName || "NGO"}</strong>
            {donation.assignedNgoEmail && ` • ${donation.assignedNgoEmail}`}
            {donation.assignedNgoPhone && ` • ${donation.assignedNgoPhone}`}
          </p>
        </Card>
      )}

      {isProvider && isCompleted && (
        <Card className="p-4 border border-emerald-200 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-800">
            Donation Successfully Completed
          </p>
        </Card>
      )}

      {/* Timeline */}
      <Card className="p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Delivery Status</h3>
        <DeliveryTimeline status={donation.status} />
      </Card>

      {/* Details Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5 border border-gray-100 space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">Food Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Package className="w-4 h-4 text-gray-400" />
              <span>
                Category:{" "}
                <strong className="capitalize">
                  {donation.category?.replace("_", " ")}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="w-4 h-4 text-gray-400 text-center font-bold text-xs">
                Q
              </span>
              <span>
                Quantity:{" "}
                <strong>
                  {donation.quantity} {donation.quantityUnit}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Thermometer className="w-4 h-4 text-gray-400" />
              <span>
                Storage:{" "}
                <strong className="capitalize">
                  {donation.storageType?.replace("_", " ")}
                </strong>
              </span>
            </div>
            {donation.cookedTime && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>
                  Cooked:{" "}
                  <strong>
                    {moment(donation.cookedTime).format("MMM D, h:mm A")}
                  </strong>
                </span>
              </div>
            )}
            {donation.expiryTime && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>
                  Expiry:{" "}
                  <strong>
                    {moment(donation.expiryTime).format("MMM D, h:mm A")}
                  </strong>
                </span>
              </div>
            )}
          </div>
          {typeof donation.mealsEquivalent === "number" &&
            donation.mealsEquivalent > 0 && (
              <div className="pt-2 border-t border-gray-50 text-sm text-gray-600">
                Estimated impact:{" "}
                <strong>{donation.mealsEquivalent} meals</strong>
              </div>
            )}
        </Card>

        <Card className="p-5 border border-gray-100 space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">Logistics</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span>{donation.pickupLocation?.address || "Not specified"}</span>
            </div>
            {donation.pickupLat && donation.pickupLng ? (
              <LocationMap
                lat={donation.pickupLat}
                lng={donation.pickupLng}
                label={donation.pickupLocation?.address || "Pickup Location"}
              />
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-400 border rounded-lg">
                Location not available
              </div>
            )}
            {donation.pickupStartTime && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>
                  Pickup window:{" "}
                  <strong>
                    {moment(donation.pickupStartTime).format("MMM D, h:mm A")}{" "}
                    –{" "}
                    {moment(donation.pickupEndTime).format("MMM D, h:mm A")}
                  </strong>
                </span>
              </div>
            )}
            {donation.assignedNgoName && (
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4 text-gray-400" />
                <span>
                  NGO: <strong>{donation.assignedNgoName}</strong>
                </span>
              </div>
            )}
          </div>
          {donation.aiRecommendedNgo && (
            <div className="pt-2 border-t border-gray-50">
              <AIBadge label="AI Matched" />
            </div>
          )}
        </Card>
      </div>

      {/* Photo & Proof */}
      {(donation.photoUrl ||
        (donation.deliveryProofUrls &&
          donation.deliveryProofUrls.length > 0)) && (
        <Card className="p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2"><Image className="w-4 h-4" /> Images</h3>
          <div className="flex gap-3 flex-wrap">
            {donation.photoUrl && (
              <img
                src={donation.photoUrl}
                alt="Food"
                className="w-32 h-32 object-cover rounded-xl border"
              />
            )}
            {donation.deliveryProofUrls?.map((url, i) => (
              <img key={i} src={url} alt={`Proof ${i + 1}`} className="w-32 h-32 object-cover rounded-xl border" />
            ))}
          </div>
        </Card>
      )}

      {/* Rating */}
      {donation.status === "delivered" && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowRating(true)} className="border-amber-200 text-amber-700 hover:bg-amber-50">
            <Star className="w-4 h-4 mr-2" /> Rate This Delivery
          </Button>
        </div>
      )}

      <RatingModal
        open={showRating}
        onClose={() => setShowRating(false)}
        donationId={donation._id}
        fromEmail={user?.email}
        fromName={user?.fullName}
        toEmail={donation.assignedNgoEmail}
        toName={donation.assignedNgoName}
        role="provider"
      />
    </div>
  );
}