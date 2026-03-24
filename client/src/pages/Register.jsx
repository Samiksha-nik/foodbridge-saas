import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import * as authApi from "@/api/authApi";
import { useAuth } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf } from "lucide-react";

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = location.state?.role;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { checkUserAuth } = useAuth();

  if (!role || !["provider", "ngo"].includes(role)) {
    navigate(createPageUrl("RoleSelection"), { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const trimmedEmail = email.trim().toLowerCase();
    try {
      // Check if user already exists
      const check = await authApi.checkUser(trimmedEmail);
      const exists = check?.data?.exists;
      const userInfo = check?.data;

      if (exists) {
        // Existing user path: treat as login
        try {
          const loginRes = await authApi.login(trimmedEmail, password);
          await checkUserAuth();
          const loginData = loginRes.data || {};
          const userRole = loginData.role || userInfo?.role;

          if (loginRes.message === "Please verify your email first" || loginData.isVerified === false || userInfo?.isVerified === false) {
            navigate(createPageUrl("OTPVerification"), { state: { email: trimmedEmail }, replace: true });
            return;
          }

          if (userRole === "provider") {
            navigate(createPageUrl("ProviderDashboard"), { replace: true });
          } else if (userRole === "ngo") {
            navigate(createPageUrl("NGODashboard"), { replace: true });
          } else if (userRole === "admin") {
            navigate(createPageUrl("AdminDashboard"), { replace: true });
          } else {
            navigate(createPageUrl("RoleSelection"), { replace: true });
          }
        } catch (loginErr) {
          setError(loginErr.message || "Login failed. Please check your password or try logging in.");
        } finally {
          setSubmitting(false);
        }
        return;
      }

      // New user path: register then OTP
      await authApi.register({ email: trimmedEmail, password, role });
      navigate(createPageUrl("OTPVerification"), { state: { email: trimmedEmail }, replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Create your account
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {role === "provider" ? "Food Provider" : "NGO / Charity"} — enter your email and password
          </p>
        </div>

        <Card className="p-6 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? "Creating account..." : "Create account"}
            </Button>

            <p className="text-xs text-gray-500 text-center pt-1">
              Already have an account?{" "}
              <Link
                to={createPageUrl("Login")}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Log in
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
