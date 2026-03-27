import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "@/api/authApi";
import { useAuth } from "@/lib/AuthContext";
import { createPageUrl } from "../utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Leaf, Upload, MapPin } from "lucide-react";
import LocationPicker from "@/components/maps/LocationPicker";

export default function NGORegistration() {
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    organization_name: "",
    phone: "",
    address: "",
    bio: "",
    ngo_certificate_url: "",
    location_lat: null,
    location_lng: null,
  });
  const [certificateFile, setCertificateFile] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const u = await authApi.getMe({ timeoutMs: 15000 });
        if (u?.role !== "ngo") {
          navigate(createPageUrl("RoleSelection"), { replace: true });
          return;
        }
        if (u.registrationCompleted && u.isVerified) {
          navigate(
            u.isApproved
              ? createPageUrl("NGODashboard")
              : createPageUrl("PendingApproval"),
            { replace: true }
          );
          return;
        }
        setForm((prev) => ({
          ...prev,
          full_name: u.fullName || "",
          organization_name: u.ngoName || "",
          phone: u.ngoPhone || "",
          address: u.ngoAddress || "",
          bio: u.ngoDescription || "",
        }));
      } catch (err) {
        setError(err?.message || "Failed to load your account. Please try again.");
        return;
      } finally {
        setLoadingUser(false);
      }
    };
    load();
  }, [navigate]);

  const handleCertificateUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCertificateFile(file);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.organization_name || !form.phone || !form.address) {
      setError("Please fill required fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ngoName: form.organization_name,
        ngoPhone: form.phone,
        ngoAddress: form.address,
        ngoDescription: form.bio || "",
      };
      if (form.location_lat != null && form.location_lng != null) {
        payload.location = {
          type: "Point",
          coordinates: [form.location_lng, form.location_lat],
        };
      }
      await authApi.completeProfile(payload);
      await checkUserAuth();
      navigate(createPageUrl("PendingApproval"), { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <Card className="p-6 max-w-md w-full border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Taking longer than usual</h2>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
          <div className="flex gap-3 mt-5">
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(createPageUrl("RoleSelection"), { replace: true })}
            >
              Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-200">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">NGO Registration</h1>
          <p className="text-gray-500 mt-2 text-sm">Complete your profile to start collecting surplus food</p>
        </div>

        <Card className="p-6 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Contact Person Name *</Label>
              <Input
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> NGO/Organization Name *
              </Label>
              <Input
                value={form.organization_name}
                onChange={e => setForm({ ...form, organization_name: e.target.value })}
                placeholder="Registered NGO or charity name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Phone Number *</Label>
              <Input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 234 567 890"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Operating Address / Location *
              </Label>
              <Input
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Your NGO's main address (or pick on map below)"
                required
              />
              <LocationPicker
                initialAddress={form.address || undefined}
                initialCenter={
                  form.location_lat != null && form.location_lng != null
                    ? { lat: form.location_lat, lng: form.location_lng }
                    : undefined
                }
                onSelect={({ lat, lng, address: addr }) => {
                  setForm((prev) => ({
                    ...prev,
                    address: addr || prev.address,
                    location_lat: lat,
                    location_lng: lng,
                  }));
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" /> NGO Registration Certificate
              </Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleCertificateUpload}
                disabled={uploading}
              />
              {uploading && <p className="text-xs text-gray-500">Uploading...</p>}
              {form.ngo_certificate_url && <p className="text-xs text-emerald-600">✓ Certificate uploaded</p>}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="space-y-1.5">
              <Label>About Your NGO</Label>
              <Textarea
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder="Describe your mission and food distribution work"
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
              <strong>Note:</strong> Your registration will be reviewed by our admin team before you can access the platform.
            </div>

            <Button
              type="submit"
              disabled={submitting || uploading || !form.organization_name || !form.phone || !form.address}
              className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
            >
              {submitting ? "Submitting..." : "Continue to Verification"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}