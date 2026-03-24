// @ts-nocheck
import React, { useState } from "react";
import { createPageUrl } from "../utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Upload, Clock, MapPin, ArrowLeft } from "lucide-react";
import { AIBadge } from "../components/ui/StatusBadge";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import * as providerDonationApi from "@/api/providerDonationApi";
import * as aiApi from "@/api/aiApi";
import * as pickupRequestApi from "@/api/pickupRequestApi";
import LocationPicker from "@/components/maps/LocationPicker";

export default function AddDonation() {
  const { toast } = useToast();

  const [form, setForm] = useState({
    foodName: "",
    category: "cooked",
    quantity: "",
    quantityUnit: "kg",
    cookedTime: "",
    expiryTime: "",
    storageType: "room_temperature",
    foodType: "veg",
    allergens: "",
    spiceLevel: "medium",
    pickupWindowStart: "",
    pickupWindowEnd: "",
    pickupAddress: "",
    pickupLat: null,
    pickupLng: null,
    contactPhone: "",
    specialInstructions: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [expiryResult, setExpiryResult] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState("");
  const [recommendedNgos, setRecommendedNgos] = useState([]);
  const [loadingNgosAI, setLoadingNgosAI] = useState(false);
  const [createdDonation, setCreatedDonation] = useState(null);
  const [requestStatus, setRequestStatus] = useState({});

  const handleChange = (field, value) =>
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

  const toDatetimeLocalValue = (date) => {
    // datetime-local expects: YYYY-MM-DDTHH:mm (local time)
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";

    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const predictExpiry = async () => {
    if (!form.foodName || !form.category) return;

    const foodType = form.category; // backend expects: cooked/raw
    const storageType = form.storageType;

    if (!foodType || !storageType) {
      alert("Missing required fields for AI expiry prediction.");
      return;
    }

    const quantity = Number(form.quantity);
    const safeQuantity = Number.isFinite(quantity) ? quantity : 0;

    const payload = {
      foodType,
      quantity: safeQuantity,
      storageType,
      cookedAt: form.cookedTime,
    };

    setLoadingAI(true);
    setAiPrediction(null);
    setExpiryResult(null);

    try {
      const data = await aiApi.predictExpiry(payload);

      setExpiryResult(data);

      // Make prediction actionable: auto-fill the existing "Expiry Time" input.
      const expiresAt = data?.expiresAt ? new Date(data.expiresAt) : null;
      if (expiresAt && !Number.isNaN(expiresAt.getTime())) {
        setForm((prev) => ({
          ...prev,
          expiryTime: toDatetimeLocalValue(expiresAt),
        }));
      }

      const hours = data?.estimatedHours;
      const urgency =
        typeof hours === "number"
          ? hours <= 6
            ? "high"
            : hours <= 12
            ? "medium"
            : "low"
          : "medium";

      setAiPrediction({
        estimated_hours: hours,
        urgency,
        explanation:
          data?.message || "AI prediction successful",
      });
    } catch (error) {
      console.error(error);
      alert("Failed to predict expiry");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSubmit = async () => {
    setError("");

    if (!form.foodName.trim()) {
      setError("Food name is required.");
      return;
    }
    if (!form.quantity || Number.isNaN(Number(form.quantity))) {
      setError("Quantity is required and must be a number.");
      return;
    }
    if (!form.cookedTime) {
      setError("Cooked time is required.");
      return;
    }
    if (!form.pickupAddress.trim()) {
      setError("Pickup address is required.");
      return;
    }
    if (!form.contactPhone.trim()) {
      setError("Contact phone is required.");
      return;
    }

    if (!form.pickupWindowStart || !form.pickupWindowEnd) {
      setError("Pickup window start and end time are required.");
      return;
    }

    const pickupStart = new Date(form.pickupWindowStart);
    const pickupEnd = new Date(form.pickupWindowEnd);
    if (!(pickupEnd > pickupStart)) {
      setError("Pickup end time must be after start time.");
      return;
    }

    const cookedTime = new Date(form.cookedTime);
    const expiryTime = form.expiryTime ? new Date(form.expiryTime) : null;

    // Simple allergen parsing from comma-separated string
    const containsAllergens = form.allergens
      ? form.allergens
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean)
      : [];

    // Map UI foodType to backend isVeg enum
    let isVeg = "veg";
    if (form.foodType === "non_veg") isVeg = "non_veg";
    if (form.foodType === "jain") isVeg = "jain";

    let photoUrl = "";
    if (photoFile) {
      try {
        const uploadRes = await providerDonationApi.uploadDonationPhoto(photoFile);
        photoUrl = uploadRes?.data?.url || "";
      } catch (uploadErr) {
        setError(uploadErr?.message || "Image upload failed. Please try again.");
        return;
      }
    }

    const payload = {
      foodName: form.foodName.trim(),
      category: form.category,
      isVeg,
      containsAllergens,
      isSealedPack: false,
      quantity: Number(form.quantity),
      quantityUnit: form.quantityUnit,
      cookedTime,
      expiryTime,
      pickupStartTime: pickupStart,
      pickupEndTime: pickupEnd,
      storageType: form.storageType,
      pickupLocation: {
        address: form.pickupAddress.trim(),
        coordinates: [
          form.pickupLng != null ? form.pickupLng : 0,
          form.pickupLat != null ? form.pickupLat : 0,
        ],
      },
      contactPhone: form.contactPhone.trim(),
      specialInstructions: form.specialInstructions.trim(),
      photoUrl,
    };

    setSubmitting(true);
    try {
      const createRes = await providerDonationApi.createDonation(payload);
      const created = createRes?.data;
      toast({
        title: "Donation created",
        description: "Your food donation has been listed successfully.",
      });
      // Lock form after first successful submission
      setCreatedDonation(created || null);

      // Trigger AI recommendation engine for this donation
      if (created?._id) {
        setLoadingNgosAI(true);
        setRecommendedNgos([]);
        try {
          const aiRes = await aiApi.recommendNgos(created._id);
          setRecommendedNgos(aiRes.data || []);
        } catch (aiErr) {
          // Non-fatal: log to console and keep page usable
          console.error("AI recommendation failed:", aiErr);
        } finally {
          setLoadingNgosAI(false);
        }
      } else {
        setRecommendedNgos([]);
      }
    } catch (err) {
      if (err.status === 401) {
        window.location.href = createPageUrl("Login");
        return;
      }
      if (err.status === 403) {
        setError("Access denied. You are not allowed to create donations.");
        return;
      }
      const message =
        err?.message || "Failed to create donation. Please try again.";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendRequest = async (ngo) => {
    if (!createdDonation?._id || !ngo?.ngoId) return;
    const key = ngo.ngoId;
    if (requestStatus[key] === "pending" || requestStatus[key] === "sent") {
      return;
    }

    // Guard: only allow requests while donation is still pending
    try {
      const latest = await providerDonationApi.getSingleDonation(
        createdDonation._id
      );
      const latestDonation = latest.data;
      if (!latestDonation || latestDonation.status !== "pending") {
        toast({
          title: "Cannot send request",
          description: "This donation is already assigned.",
          variant: "destructive",
        });
        setCreatedDonation(latestDonation || createdDonation);
        return;
      }
    } catch {
      // if status check fails, fall back to letting backend enforce rules
    }

    setRequestStatus((prev) => ({ ...prev, [key]: "pending" }));
    try {
      await pickupRequestApi.createPickupRequest({
        donationId: createdDonation._id,
        ngoId: ngo.ngoId,
        aiScore: typeof ngo.score === "number" ? ngo.score : null,
        distance: typeof ngo.distance === "number" ? ngo.distance : null,
      });
      setRequestStatus((prev) => ({ ...prev, [key]: "sent" }));
    } catch (err) {
      console.error("Failed to create pickup request", err);
      setRequestStatus((prev) => ({ ...prev, [key]: "error" }));
      toast({
        title: "Request failed",
        description: err.message || "Could not send request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to={createPageUrl("ProviderDashboard")}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Add Food Donation
          </h1>
          <p className="text-sm text-gray-500">
            List surplus food for nearby NGOs to pick up
          </p>
        </div>
      </div>

      <Card className="p-6 space-y-5 border border-gray-100">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Food Name *</Label>
            <Input
              placeholder="e.g., Rice and curry"
              value={form.foodName}
              onChange={(e) => handleChange("foodName", e.target.value)}
              disabled={!!createdDonation}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select
              value={form.category}
              onValueChange={(v) => handleChange("category", v)}
              disabled={!!createdDonation}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cooked">Cooked</SelectItem>
                <SelectItem value="raw">Raw</SelectItem>
                <SelectItem value="perishable">Perishable</SelectItem>
                <SelectItem value="non_perishable">Non-Perishable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Quantity *</Label>
            <Input
              type="number"
              min="0"
              placeholder="e.g., 50"
              value={form.quantity}
              onChange={(e) => handleChange("quantity", e.target.value)}
              disabled={!!createdDonation}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Quantity Unit *</Label>
            <Select
              value={form.quantityUnit}
              onValueChange={(v) => handleChange("quantityUnit", v)}
              disabled={!!createdDonation}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilograms</SelectItem>
                <SelectItem value="grams">Grams</SelectItem>
                <SelectItem value="litres">Litres</SelectItem>
                <SelectItem value="packets">Packets</SelectItem>
                <SelectItem value="plates">Plates</SelectItem>
                <SelectItem value="boxes">Boxes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Cooked Time *
            </Label>
            <Input
              type="datetime-local"
              value={form.cookedTime}
              onChange={(e) => handleChange("cookedTime", e.target.value)}
              disabled={!!createdDonation}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Expiry Time (optional)</Label>
            <Input
              type="datetime-local"
              value={form.expiryTime}
              onChange={(e) => handleChange("expiryTime", e.target.value)}
              disabled={!!createdDonation}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Storage Type</Label>
            <Select
              value={form.storageType}
              onValueChange={(v) => handleChange("storageType", v)}
              disabled={!!createdDonation}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="room_temperature">
                  Room Temperature
                </SelectItem>
                <SelectItem value="refrigerated">Refrigerated</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Food Type</Label>
            <Select
              value={form.foodType}
              onValueChange={(v) => handleChange("foodType", v)}
              disabled={!!createdDonation}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="veg">Veg</SelectItem>
                <SelectItem value="non_veg">Non-Veg</SelectItem>
                <SelectItem value="jain">Jain</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Allergens (comma separated)</Label>
            <Input
              placeholder="e.g., nuts, dairy, gluten"
              value={form.allergens}
              onChange={(e) => handleChange("allergens", e.target.value)}
              disabled={!!createdDonation}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Spice Level</Label>
            <Select
              value={form.spiceLevel}
              onValueChange={(v) => handleChange("spiceLevel", v)}
              disabled={!!createdDonation}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Pickup Window Start *</Label>
            <Input
              type="datetime-local"
              value={form.pickupWindowStart}
              onChange={(e) =>
                handleChange("pickupWindowStart", e.target.value)
              }
              disabled={!!createdDonation}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Pickup Window End *</Label>
            <Input
              type="datetime-local"
              value={form.pickupWindowEnd}
              onChange={(e) =>
                handleChange("pickupWindowEnd", e.target.value)
              }
              disabled={!!createdDonation}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Pickup Location *
          </Label>
          <Input
            placeholder="Full address for pickup (or pick on map below)"
            value={form.pickupAddress}
            onChange={(e) => handleChange("pickupAddress", e.target.value)}
            disabled={!!createdDonation}
          />
          {!createdDonation && (
            <LocationPicker
              initialAddress={form.pickupAddress || undefined}
              initialCenter={
                form.pickupLat != null && form.pickupLng != null
                  ? { lat: form.pickupLat, lng: form.pickupLng }
                  : undefined
              }
              onSelect={({ lat, lng, address: addr }) => {
                setForm((prev) => ({
                  ...prev,
                  pickupAddress: addr || prev.pickupAddress,
                  pickupLat: lat,
                  pickupLng: lng,
                }));
              }}
            />
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Contact Phone *</Label>
          <Input
            placeholder="Contact number for pickup coordination"
            value={form.contactPhone}
            onChange={(e) => handleChange("contactPhone", e.target.value)}
            disabled={!!createdDonation}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Special Instructions</Label>
          <Textarea
            placeholder="Any handling, packaging, or pickup instructions"
            value={form.specialInstructions}
            onChange={(e) =>
              handleChange("specialInstructions", e.target.value)
            }
            disabled={!!createdDonation}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" /> Photo
          </Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPhotoFile(file || null);
              if (file) {
                const previewUrl = URL.createObjectURL(file);
                setPhotoPreview(previewUrl);
              } else {
                setPhotoPreview(null);
              }
            }}
            className="cursor-pointer"
            disabled={!!createdDonation}
          />
          {photoPreview && (
            <div className="mt-2">
              <img
                src={photoPreview}
                alt="Donation preview"
                className="h-32 w-full object-cover rounded-lg border border-gray-100"
              />
            </div>
          )}
        </div>
      </Card>

      {/* AI Prediction Card */}
      <Card className="p-5 border border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 text-sm">
                  AI Expiry Prediction
                </h3>
                <AIBadge label="AI Powered" />
              </div>
              {aiPrediction ? (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    Estimated shelf life:{" "}
                    <strong>{aiPrediction.estimated_hours}h</strong>
                  </p>
                  <p>
                    Suggested urgency:{" "}
                    <strong className="capitalize">
                      {aiPrediction.urgency}
                    </strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    {aiPrediction.explanation}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Fill in food details and click predict to get AI-powered
                  expiry estimation
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={predictExpiry}
            disabled={loadingAI || !form.foodName || !!createdDonation}
            className="shrink-0 border-purple-200 text-purple-700 hover:bg-purple-100"
          >
            {loadingAI ? "Predicting..." : "Predict"}
          </Button>
        </div>
      </Card>

      {/* AI Recommended NGOs */}
      {(loadingNgosAI || recommendedNgos.length > 0) && (
        <Card className="p-5 border border-emerald-100">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                🎯 AI Recommended NGOs
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Based on location, ratings, speed, trust, and urgency.
              </p>
            </div>
          </div>
          {loadingNgosAI && (
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <span role="img" aria-label="robot">
                🤖
              </span>
              Finding best NGOs...
            </p>
          )}
          {!loadingNgosAI && recommendedNgos.length === 0 && (
            <p className="text-sm text-gray-500">
              No suitable NGOs found nearby.
            </p>
          )}
          {!loadingNgosAI && recommendedNgos.length > 0 && (
            <div className="mt-3 space-y-2">
              {recommendedNgos.map((ngo, index) => {
                const scorePercent = Math.round(
                  (ngo.score != null ? ngo.score : 0) * 100
                );
                const key = ngo.ngoId || index;
                const status = requestStatus[key] || "idle";
                const disabled = status === "pending" || status === "sent";
                const buttonLabel =
                  status === "pending"
                    ? "Sending..."
                    : status === "sent"
                    ? "Request Sent"
                    : "Send Request";
                return (
                  <div
                    key={ngo.ngoId || index}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-400">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {ngo.ngoName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ngo.distance != null
                            ? `${ngo.distance} km away`
                            : "Distance unknown"}
                          {" • "}
                          {ngo.averageRating != null
                            ? `Rating ${ngo.averageRating.toFixed(1)}/5`
                            : "No ratings yet"}
                          {" • "}
                          AI match {scorePercent}%
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => handleSendRequest(ngo)}
                      disabled={disabled || !createdDonation}
                    >
                      {buttonLabel}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Link to={createPageUrl("ProviderDashboard")}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={
            submitting ||
            !!createdDonation ||
            !form.foodName ||
            !form.quantity ||
            !form.pickupAddress
          }
          className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
        >
          {createdDonation
            ? "Donation Submitted"
            : submitting
            ? "Submitting..."
            : "Submit Donation"}
        </Button>
      </div>
    </div>
  );
}

