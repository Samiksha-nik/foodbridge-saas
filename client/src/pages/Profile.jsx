// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import * as authApi from "@/api/authApi";
import { createPageUrl } from "@/utils";
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
import { Switch } from "@/components/ui/switch";
import LocationPicker from "@/components/maps/LocationPicker";
import LocationMap from "@/components/maps/LocationMap";
import { TrustBadge } from "../components/ui/StatusBadge";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User,
  Save,
  Building2,
  Mail,
  Shield,
  Lock,
  Trash2,
  Camera,
  X,
  MapPin,
  Activity,
} from "lucide-react";

const ORG_TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "catering", label: "Catering Service" },
  { value: "individual", label: "Individual Donor" },
  { value: "corporate", label: "Corporate" },
];

const CONTACT_METHODS = [
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
];

const NGO_TYPES = [
  { value: "orphanage", label: "Orphanage" },
  { value: "old_age_home", label: "Old Age Home" },
  { value: "shelter", label: "Shelter" },
  { value: "community_kitchen", label: "Community Kitchen" },
  { value: "disaster_relief", label: "Disaster Relief" },
  { value: "other", label: "Other" },
];

const PROVIDER_COMPLETION_FIELDS = [
  "organizationName",
  "phone",
  "address",
  "bio",
  "organizationType",
  "profileImage",
  "pickupTimeRange",
];

const NGO_COMPLETION_FIELDS = [
  "registrationId",
  "ngoProfileImage",
  "mission",
  "dailyCapacity",
  "capacityUtilization",
  "pickupRadius",
  "storageAvailable",
  "ngoPickupTimeRange",
];

function toISOTime(date) {
  if (!date) return "";
  const d = new Date(date);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function fromTimeStr(str) {
  if (!str) return null;
  const [h, m] = str.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export default function Profile() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [providerForm, setProviderForm] = useState({
    organizationName: "",
    profileImage: "",
    organizationType: "",
    licenseNumber: "",
    phone: "",
    address: "",
    bio: "",
    pickupStartTime: "",
    pickupEndTime: "",
    preferredContactMethod: "phone",
  });
  const [ngoForm, setNgoForm] = useState({
    ngoName: "",
    ngoPhone: "",
    ngoAddress: "",
    ngoDescription: "",
    ngoProfileImage: "",
    registrationId: "",
    establishedYear: "",
    ngoType: "",
    mission: "",
    website: "",
    socialLinksText: "",
    dailyCapacity: "",
    capacityUtilization: "",
    storageAvailable: false,
    coldStorageAvailable: false,
    pickupRadius: "",
    pickupStartTime: "",
    pickupEndTime: "",
    emergencyAvailable: false,
    locationLat: null,
    locationLng: null,
  });
  const [ngoPerformance, setNgoPerformance] = useState(null);
  const [loadingNgoPerformance, setLoadingNgoPerformance] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authApi
      .getMe()
      .then((me) => {
        if (cancelled) return;
      setUser(me);
        setProviderForm({
          organizationName: me.organizationName || "",
          profileImage: me.profileImage || "",
          organizationType: me.organizationType || "",
          licenseNumber: me.licenseNumber || "",
        phone: me.phone || "",
        address: me.address || "",
        bio: me.bio || "",
          pickupStartTime: me.pickupStartTime ? toISOTime(me.pickupStartTime) : "",
          pickupEndTime: me.pickupEndTime ? toISOTime(me.pickupEndTime) : "",
          preferredContactMethod: me.preferredContactMethod || "phone",
        });
        const coords = me.location?.coordinates;
        const latFromGeoJson =
          Array.isArray(coords) && coords.length === 2 ? coords[1] : null;
        const lngFromGeoJson =
          Array.isArray(coords) && coords.length === 2 ? coords[0] : null;
        setNgoForm({
          ngoName: me.ngoName || "",
          ngoPhone: me.ngoPhone || "",
          ngoAddress: me.ngoAddress || "",
          ngoDescription: me.ngoDescription || "",
          ngoProfileImage: me.ngoProfileImage || "",
          registrationId: me.registrationId || "",
          establishedYear:
            typeof me.establishedYear === "number" ? String(me.establishedYear) : "",
          ngoType: me.ngoType || "",
          mission: me.mission || "",
          website: me.website || "",
          socialLinksText: Array.isArray(me.socialLinks) ? me.socialLinks.join("\n") : "",
          dailyCapacity:
            typeof me.dailyCapacity === "number" ? String(me.dailyCapacity) : "",
          capacityUtilization:
            typeof me.capacityUtilization === "number"
              ? String(me.capacityUtilization)
              : "",
          storageAvailable: !!me.storageAvailable,
          coldStorageAvailable: !!me.coldStorageAvailable,
          pickupRadius:
            typeof me.pickupRadius === "number" ? String(me.pickupRadius) : "",
          pickupStartTime: me.ngoPickupStartTime ? toISOTime(me.ngoPickupStartTime) : "",
          pickupEndTime: me.ngoPickupEndTime ? toISOTime(me.ngoPickupEndTime) : "",
          emergencyAvailable: !!me.emergencyAvailable,
          locationLat: latFromGeoJson,
          locationLng: lngFromGeoJson,
        });
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isProvider = user?.role === "provider";
  const isNgo = user?.role === "ngo";

  useEffect(() => {
    if (!isNgo) return;
    setLoadingNgoPerformance(true);
    authApi
      .getNgoPerformance()
      .then((res) => setNgoPerformance(res.data || null))
      .catch(() => setNgoPerformance(null))
      .finally(() => setLoadingNgoPerformance(false));
  }, [isNgo]);

  const providerCompletionPercent = useMemo(() => {
    let filled = 0;
    if (providerForm.organizationName?.trim()) filled++;
    if (providerForm.phone?.trim()) filled++;
    if (providerForm.address?.trim()) filled++;
    if (providerForm.bio?.trim()) filled++;
    if (providerForm.organizationType?.trim()) filled++;
    if (providerForm.profileImage?.trim()) filled++;
    if (providerForm.pickupStartTime?.trim() && providerForm.pickupEndTime?.trim())
      filled++;
    return Math.round((filled / PROVIDER_COMPLETION_FIELDS.length) * 100);
  }, [providerForm]);

  const ngoCompletionPercent = useMemo(() => {
    let filled = 0;
    if (ngoForm.registrationId?.trim()) filled++;
    if (ngoForm.ngoProfileImage?.trim()) filled++;
    if (ngoForm.mission?.trim()) filled++;
    if (String(ngoForm.dailyCapacity || "").trim()) filled++;
    if (String(ngoForm.capacityUtilization || "").trim()) filled++;
    if (String(ngoForm.pickupRadius || "").trim()) filled++;
    if (ngoForm.storageAvailable) filled++;
    if (ngoForm.pickupStartTime?.trim() && ngoForm.pickupEndTime?.trim())
      filled++;
    return Math.round((filled / NGO_COMPLETION_FIELDS.length) * 100);
  }, [ngoForm]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isProvider) {
        const payload = {
          organizationName: providerForm.organizationName.trim(),
          profileImage: providerForm.profileImage.trim() || undefined,
          organizationType: providerForm.organizationType || undefined,
          licenseNumber: providerForm.licenseNumber.trim() || undefined,
          phone: providerForm.phone.trim(),
          address: providerForm.address.trim(),
          bio: providerForm.bio.trim(),
          pickupStartTime: providerForm.pickupStartTime
            ? fromTimeStr(providerForm.pickupStartTime)
            : null,
          pickupEndTime: providerForm.pickupEndTime
            ? fromTimeStr(providerForm.pickupEndTime)
            : null,
          preferredContactMethod: providerForm.preferredContactMethod,
        };
        await authApi.updateProviderProfile(payload);
      } else if (isNgo) {
        if (!ngoForm.registrationId.trim()) {
          toast({
            title: "Registration ID required",
            description: "Please enter your NGO Registration ID to save.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
        const socialLinks = ngoForm.socialLinksText
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 6);
        const payload = {
          ngoName: ngoForm.ngoName.trim(),
          ngoPhone: ngoForm.ngoPhone.trim(),
          ngoAddress: ngoForm.ngoAddress.trim(),
          ngoDescription: ngoForm.ngoDescription.trim(),
          ngoProfileImage: ngoForm.ngoProfileImage.trim() || undefined,
          registrationId: ngoForm.registrationId.trim(),
          establishedYear: ngoForm.establishedYear ? Number(ngoForm.establishedYear) : undefined,
          ngoType: ngoForm.ngoType || undefined,
          mission: ngoForm.mission.trim(),
          website: ngoForm.website.trim(),
          socialLinks,
          dailyCapacity: ngoForm.dailyCapacity ? Number(ngoForm.dailyCapacity) : undefined,
          capacityUtilization: ngoForm.capacityUtilization ? Number(ngoForm.capacityUtilization) : undefined,
          storageAvailable: !!ngoForm.storageAvailable,
          coldStorageAvailable: !!ngoForm.coldStorageAvailable,
          pickupRadius: ngoForm.pickupRadius ? Number(ngoForm.pickupRadius) : undefined,
          ngoPickupStartTime: ngoForm.pickupStartTime ? fromTimeStr(ngoForm.pickupStartTime) : null,
          ngoPickupEndTime: ngoForm.pickupEndTime ? fromTimeStr(ngoForm.pickupEndTime) : null,
          emergencyAvailable: !!ngoForm.emergencyAvailable,
          location:
            ngoForm.locationLat != null && ngoForm.locationLng != null
              ? { type: "Point", coordinates: [ngoForm.locationLng, ngoForm.locationLat] }
              : undefined,
        };
        await authApi.updateNgoProfile(payload);
      }

      const me = await authApi.getMe();
      setUser(me);
      toast({
        title: "Profile saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message || "Failed to save profile.",
        variant: "destructive",
      });
    } finally {
    setSaving(false);
    }
  };

  const handleProviderImageFile = (e) => {
    const file = e.target?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProviderForm((prev) => ({ ...prev, profileImage: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleNgoImageFile = (e) => {
    const file = e.target?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNgoForm((prev) => ({ ...prev, ngoProfileImage: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProviderImage = () => {
    setProviderForm((prev) => ({ ...prev, profileImage: "" }));
  };

  const handleRemoveNgoImage = () => {
    setNgoForm((prev) => ({ ...prev, ngoProfileImage: "" }));
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) return;
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      setChangePasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message || "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      toast({
        title: "Account deleted",
        description: "Your account has been deleted.",
      });
      window.location.href = createPageUrl("Landing");
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete account.",
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-gray-500">Unable to load profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account settings
        </p>
      </div>

      <Card className="p-6 border border-gray-100">
        {/* Profile completion */}
        {(isProvider || isNgo) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Profile completion
              </span>
              <span className="text-sm font-semibold text-emerald-600">
                {isProvider ? providerCompletionPercent : ngoCompletionPercent}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{
                  width: `${isProvider ? providerCompletionPercent : ngoCompletionPercent}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* 1. Profile information */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> Profile information
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col items-start gap-2">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg border border-gray-100">
                {isProvider && providerForm.profileImage ? (
                  <img
                    src={providerForm.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : isNgo && ngoForm.ngoProfileImage ? (
                  <img
                    src={ngoForm.ngoProfileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (user.fullName || user.email || "?")[0]
                )}
              </div>
              {isProvider && (
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProviderImageFile}
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Camera className="w-3.5 h-3.5 mr-1" /> Upload image
                      </span>
                    </Button>
                  </label>
                  {providerForm.profileImage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveProviderImage}
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>
              )}
              {isNgo && (
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleNgoImageFile}
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Camera className="w-3.5 h-3.5 mr-1" /> Upload image
                      </span>
                    </Button>
                  </label>
                  {ngoForm.ngoProfileImage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveNgoImage}
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <div>
                <Label className="text-xs text-gray-500">Name</Label>
                <Input
                  value={
                    isProvider
                      ? user.fullName || ""
                      : user.ngoName || user.fullName || ""
                  }
                  readOnly
                  disabled
                  className="bg-gray-50"
                />
          </div>
          <div>
                <Label className="text-xs text-gray-500">Email</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={user.email || ""}
                    readOnly
                    disabled
                    className="bg-gray-50 flex-1"
                  />
                  {user.isVerified && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md shrink-0">
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full capitalize">
                  {user.role}
                </span>
                {(user.trust_score > 0 || user.trustScore > 0) && (
                  <TrustBadge score={user.trust_score ?? user.trustScore} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Organization details (provider) */}
        {isProvider && (
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Organization details
            </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
                <Label>Organization name</Label>
                <Input
                  value={providerForm.organizationName}
                  onChange={(e) =>
                    setProviderForm((prev) => ({
                      ...prev,
                      organizationName: e.target.value,
                    }))
                  }
                  placeholder="Your organization"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Organization type</Label>
                <Select
                  value={providerForm.organizationType || ""}
                  onValueChange={(v) =>
                    setProviderForm((prev) => ({ ...prev, organizationType: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_TYPES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>FSSAI / License number (optional)</Label>
                <Input
                  value={providerForm.licenseNumber}
                  onChange={(e) =>
                    setProviderForm((prev) => ({
                      ...prev,
                      licenseNumber: e.target.value,
                    }))
                  }
                  placeholder="e.g. 12345678901234"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Bio</Label>
                <Textarea
                  value={providerForm.bio}
                  onChange={(e) =>
                    setProviderForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Tell us about your organization"
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Organization details (NGO) */}
        {isNgo && (
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Organization details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>NGO Registration ID *</Label>
                  <Input
                    value={ngoForm.registrationId}
                    onChange={(e) =>
                      setNgoForm((p) => ({ ...p, registrationId: e.target.value }))
                    }
                    placeholder="e.g. NGO-REG-12345"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Year Established</Label>
                  <Input
                    type="number"
                    value={ngoForm.establishedYear}
                    onChange={(e) =>
                      setNgoForm((p) => ({ ...p, establishedYear: e.target.value }))
                    }
                    placeholder="e.g. 2015"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>NGO Type</Label>
                <Select
                  value={ngoForm.ngoType || ""}
                  onValueChange={(v) => setNgoForm((p) => ({ ...p, ngoType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select NGO type" />
                  </SelectTrigger>
                  <SelectContent>
                    {NGO_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Mission statement</Label>
                <Textarea
                  value={ngoForm.mission}
                  onChange={(e) => setNgoForm((p) => ({ ...p, mission: e.target.value }))}
                  placeholder="Describe your mission and who you serve"
                  className="min-h-[80px] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input
                    value={ngoForm.website}
                    onChange={(e) => setNgoForm((p) => ({ ...p, website: e.target.value }))}
                    placeholder="https://example.org"
                  />
          </div>
          <div className="space-y-1.5">
                  <Label>Social media links (optional)</Label>
                  <Textarea
                    value={ngoForm.socialLinksText}
                    onChange={(e) =>
                      setNgoForm((p) => ({ ...p, socialLinksText: e.target.value }))
                    }
                    placeholder={"One link per line\\nhttps://instagram.com/..."}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Contact & logistics (provider) */}
        {isProvider && (
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Contact & logistics
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={providerForm.phone}
                  onChange={(e) =>
                    setProviderForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+1 234 567 890"
                />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
                <Input
                  value={providerForm.address}
                  onChange={(e) =>
                    setProviderForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Your address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Default pickup time (from)</Label>
                  <Input
                    type="time"
                    value={providerForm.pickupStartTime}
                    onChange={(e) =>
                      setProviderForm((prev) => ({
                        ...prev,
                        pickupStartTime: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Default pickup time (to)</Label>
                  <Input
                    type="time"
                    value={providerForm.pickupEndTime}
                    onChange={(e) =>
                      setProviderForm((prev) => ({
                        ...prev,
                        pickupEndTime: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Preferred contact method</Label>
                <Select
                  value={providerForm.preferredContactMethod}
                  onValueChange={(v) =>
                    setProviderForm((prev) => ({
                      ...prev,
                      preferredContactMethod: v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_METHODS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* 3. Capacity & logistics (NGO) */}
        {isNgo && (
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Capacity & logistics
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Daily food capacity</Label>
                  <Input
                    type="number"
                    value={ngoForm.dailyCapacity}
                    onChange={(e) => setNgoForm((p) => ({ ...p, dailyCapacity: e.target.value }))}
                    placeholder="e.g. 200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Current capacity utilization (%)</Label>
                  <Input
                    type="number"
                    value={ngoForm.capacityUtilization}
                    onChange={(e) => setNgoForm((p) => ({ ...p, capacityUtilization: e.target.value }))}
                    placeholder="e.g. 60"
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3 bg-white">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Storage facility available</p>
                    <p className="text-xs text-gray-500">Helps handle larger donations</p>
                  </div>
                  <Switch
                    checked={ngoForm.storageAvailable}
                    onCheckedChange={(v) => setNgoForm((p) => ({ ...p, storageAvailable: v }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3 bg-white">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Cold storage available</p>
                    <p className="text-xs text-gray-500">Important for perishables</p>
                  </div>
                  <Switch
                    checked={ngoForm.coldStorageAvailable}
                    onCheckedChange={(v) => setNgoForm((p) => ({ ...p, coldStorageAvailable: v }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Pickup radius (km)</Label>
                  <Input
                    type="number"
                    value={ngoForm.pickupRadius}
                    onChange={(e) => setNgoForm((p) => ({ ...p, pickupRadius: e.target.value }))}
                    placeholder="e.g. 12"
                    min={0}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3 bg-white">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Emergency availability</p>
                    <p className="text-xs text-gray-500">Can respond to urgent pickups</p>
                  </div>
                  <Switch
                    checked={ngoForm.emergencyAvailable}
                    onCheckedChange={(v) => setNgoForm((p) => ({ ...p, emergencyAvailable: v }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Preferred pickup time (from)</Label>
                  <Input
                    type="time"
                    value={ngoForm.pickupStartTime}
                    onChange={(e) => setNgoForm((p) => ({ ...p, pickupStartTime: e.target.value }))}
                  />
          </div>
          <div className="space-y-1.5">
                  <Label>Preferred pickup time (to)</Label>
                  <Input
                    type="time"
                    value={ngoForm.pickupEndTime}
                    onChange={(e) => setNgoForm((p) => ({ ...p, pickupEndTime: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Location & contact (NGO) */}
        {isNgo && (
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Location & contact
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>NGO name</Label>
                  <Input
                    value={ngoForm.ngoName}
                    onChange={(e) => setNgoForm((p) => ({ ...p, ngoName: e.target.value }))}
                    placeholder="NGO name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    value={ngoForm.ngoPhone}
                    onChange={(e) => setNgoForm((p) => ({ ...p, ngoPhone: e.target.value }))}
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Address</Label>
                <p className="text-xs text-gray-500">
                  Search your address below (or click on map) to update location.
                </p>
        </div>

              <LocationPicker
                initialAddress={ngoForm.ngoAddress || undefined}
                initialCenter={
                  ngoForm.locationLat != null && ngoForm.locationLng != null
                    ? { lat: ngoForm.locationLat, lng: ngoForm.locationLng }
                    : undefined
                }
                onSelect={({ lat, lng, address }) => {
                  setNgoForm((p) => ({
                    ...p,
                    ngoAddress: address || p.ngoAddress,
                    locationLat: lat,
                    locationLng: lng,
                  }));
                }}
              />

              <div className="space-y-1.5">
                <Label>About / description</Label>
                <Textarea
                  value={ngoForm.ngoDescription}
                  onChange={(e) => setNgoForm((p) => ({ ...p, ngoDescription: e.target.value }))}
                  placeholder="Describe your food distribution work"
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. Performance metrics (NGO) */}
        {isNgo && (
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> NGO performance
            </h2>
            {loadingNgoPerformance ? (
              <p className="text-sm text-gray-500">Loading metrics...</p>
            ) : ngoPerformance ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-gray-100 bg-white p-3">
                  <p className="text-xs text-gray-500">Total received</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {ngoPerformance.totalDonationsReceived ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-3">
                  <p className="text-xs text-gray-500">Acceptance rate</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {ngoPerformance.acceptanceRate ?? 0}%
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-3">
                  <p className="text-xs text-gray-500">Avg pickup time</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {ngoPerformance.averagePickupTimeHours != null
                      ? `${ngoPerformance.averagePickupTimeHours}h`
                      : "N/A"}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-3">
                  <p className="text-xs text-gray-500">Avg rating</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {ngoPerformance.averageRating != null
                      ? ngoPerformance.averageRating
                      : "N/A"}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-3">
                  <p className="text-xs text-gray-500">AI trust score</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {ngoPerformance.aiTrustScore ?? 0}%
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Metrics not available yet.</p>
            )}
          </div>
        )}

        {/* Save */}
        {(isProvider || isNgo) && (
          <div className="flex justify-end mb-6">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
            <Save className="w-4 h-4 mr-2" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        )}

        {/* 4. Security */}
        <div className="pt-6 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Security settings
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => setChangePasswordOpen(true)}
              className="border-gray-200"
            >
              <Lock className="w-4 h-4 mr-2" />
              Change password
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteModalOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete account
          </Button>
          </div>
        </div>
      </Card>

      {/* Change password dialog */}
      <AlertDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change password</AlertDialogTitle>
              <AlertDialogDescription>
                Enter your current password and choose a new one (min 6 characters).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Current password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                />
              </div>
              <div className="space-y-2">
                <Label>New password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleChangePassword();
                }}
                disabled={changingPassword || !currentPassword || !newPassword}
              >
                {changingPassword ? "Updating..." : "Update password"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      {/* Delete account dialog */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Type <strong>DELETE</strong> below to
              confirm. {isNgo && "This will permanently remove NGO data and history."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="font-mono"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              disabled={deleteConfirmText !== "DELETE" || deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
