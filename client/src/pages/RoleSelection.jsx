import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useAuth } from "@/lib/AuthContext";
import { Building2, HandHeart, Leaf, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function RoleSelection() {
  const [saving, setSaving] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (isLoadingAuth) return;
    if (user?.app_role && user?.email_verified) {
      if (user.app_role === "provider") {
        window.location.href = createPageUrl("ProviderDashboard");
        return;
      }
      if (user.app_role === "ngo") {
        window.location.href = createPageUrl("NGODashboard");
        return;
      }
      if (user.app_role === "admin") {
        window.location.href = createPageUrl("AdminDashboard");
        return;
      }
    }
    setCheckingAuth(false);
  }, [user, isLoadingAuth]);

  const selectRole = (role) => {
    setSaving(true);
    navigate(createPageUrl("Register"), { state: { role } });
    setSaving(false);
  };

  // Show loader while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200">
            <Leaf className="w-7 h-7 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Welcome to FoodBridge
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Choose your role to get started
          </p>
        </div>

        {/* Role Buttons */}
        <div className="space-y-4">
          {/* Provider */}
          <button
            onClick={() => selectRole("provider")}
            disabled={saving}
            className="w-full group bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100 p-6 text-left transition-all duration-300 disabled:opacity-50"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                <Building2 className="w-6 h-6 text-emerald-600" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Food Provider
                  </h3>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </div>

                <p className="text-sm text-gray-500 mt-1">
                  Restaurants, caterers, and businesses with surplus food
                </p>
              </div>
            </div>
          </button>

          {/* NGO */}
          <button
            onClick={() => selectRole("ngo")}
            disabled={saving}
            className="w-full group bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100 p-6 text-left transition-all duration-300 disabled:opacity-50"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                <HandHeart className="w-6 h-6 text-blue-600" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    NGO / Charity
                  </h3>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>

                <p className="text-sm text-gray-500 mt-1">
                  Organizations that collect and distribute food to those in need
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Saving text */}
        {saving && (
          <p className="text-center text-sm text-gray-400 mt-6">
            Setting up your account...
          </p>
        )}
      </motion.div>
    </div>
  );
}
