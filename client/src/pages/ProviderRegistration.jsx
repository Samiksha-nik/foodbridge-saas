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
import { Building2, Leaf } from "lucide-react";

export default function ProviderRegistration() {
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    organization_name: "",
    phone: "",
    address: "",
    bio: "",
  });

  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await authApi.getMe();
        if (u?.role !== "provider") {
          navigate(createPageUrl("RoleSelection"), { replace: true });
          return;
        }
        if (u.registrationCompleted && u.isVerified) {
          navigate(createPageUrl("ProviderDashboard"), { replace: true });
          return;
        }
        setForm((prev) => ({
          ...prev,
          full_name: u?.fullName || "",
          organization_name: u?.organizationName || "",
          phone: u?.phone || "",
          address: u?.address || "",
          bio: u?.bio || "",
        }));
      } catch (err) {
        navigate(createPageUrl("RoleSelection"), { replace: true });
        return;
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.organization_name || !form.phone || !form.address) {
      setError("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await authApi.completeProfile({
        fullName: form.full_name,
        organizationName: form.organization_name,
        phone: form.phone,
        address: form.address,
        bio: form.bio,
      });
      await checkUserAuth();
      navigate(createPageUrl("ProviderDashboard"), { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ⏳ Loading screen
  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 flex items-center justify-center px-6">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200">
            <Leaf className="w-7 h-7 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Provider Registration
          </h1>

          <p className="text-gray-500 mt-2 text-sm">
            Complete your profile to start donating surplus food
          </p>
        </div>

        {/* Form */}
        <Card className="p-6 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                placeholder="Your full name"
                required
              />
            </div>

            {/* Organization */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                Organization Name *
              </Label>
              <Input
                value={form.organization_name}
                onChange={(e) =>
                  setForm({ ...form, organization_name: e.target.value })
                }
                placeholder="Restaurant, Hotel, or Business name"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label>Phone Number *</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                placeholder="+91 98765 43210"
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label>Business Address *</Label>
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
                placeholder="Full pickup address"
                required
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label>About Your Organization</Label>
              <Textarea
                value={form.bio}
                onChange={(e) =>
                  setForm({ ...form, bio: e.target.value })
                }
                placeholder="Tell NGOs about your business and food donation practices"
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4"
            >
              {submitting ? "Submitting..." : "Continue to Verification"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
