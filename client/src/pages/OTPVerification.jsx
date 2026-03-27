import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as authApi from "@/api/authApi";
import { useAuth } from "@/lib/AuthContext";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle2 } from "lucide-react";

function getDashboardRoute(role, isApproved) {
  if (role === "admin") return createPageUrl("AdminDashboard");
  if (role === "provider") return createPageUrl("ProviderDashboard");
  if (role === "ngo" && !isApproved) return createPageUrl("PendingApproval");
  if (role === "ngo") return createPageUrl("NGODashboard");
  return null;
}

export default function OTPVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();

  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);

  const email = location.state?.email || authApi.getPendingVerifyEmail() || "";

  // Don't auto-call /me on this page; it causes 401 spam and can hang on cold starts.
  // We only refresh auth state after a successful OTP verification.

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) return;
    if (!email) {
      setError("Email missing. Please start from Register.");
      return;
    }

    setVerifying(true);
    setError("");
    try {
      const res = await authApi.verifyOtp(email, otp.trim());
      setVerified(true);
      await checkUserAuth();
      const data = res.data || {};
      const registrationCompleted = data.registrationCompleted;
      const role = data.role;

      if (!registrationCompleted && role) {
        const completeProfileRoute =
          role === "provider"
            ? createPageUrl("ProviderRegistration")
            : createPageUrl("NGORegistration");
        setTimeout(() => navigate(completeProfileRoute), 1500);
      } else {
        const route = getDashboardRoute(role, true);
        if (route) setTimeout(() => navigate(route), 1500);
      }
    } catch (err) {
      setError(err.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Email missing. Please start from Register.");
      return;
    }
    setResending(true);
    setError("");
    try {
      await authApi.sendOtp(email);
      alert("OTP resent to your email!");
    } catch (err) {
      setError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
          <p className="text-gray-500 text-sm">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Verify Your Email</h1>
          <p className="text-gray-500 mt-2 text-sm">
            We've sent a verification code to <strong>{email || "your email"}</strong>
          </p>
        </div>

        <Card className="p-6 border border-gray-100">
          <form onSubmit={handleVerify} className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <div className="space-y-1.5">
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="text-center text-2xl tracking-widest font-semibold"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={verifying || otp.length < 4}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {verifying ? "Verifying..." : "Verify Email"}
            </Button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-60"
            >
              {resending ? "Resending..." : "Didn't receive code? Resend"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
