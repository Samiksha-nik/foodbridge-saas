import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import * as authApi from "@/api/authApi";
import { useAuth } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setSubmitting(true);
    const trimmedEmail = email.trim().toLowerCase();

    try {
      const res = await authApi.login(trimmedEmail, password);
      await checkUserAuth();

      // Use fresh user data to determine role and approval
      const me = await authApi.getMe();
      const role = me.role;
      const isApproved = me.isApproved;

      if (role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }
      if (role === "provider") {
        navigate("/provider", { replace: true });
        return;
      }
      if (role === "ngo") {
        if (isApproved) {
          navigate("/ngo", { replace: true });
        } else {
          setError("NGO approval pending from admin");
        }
        return;
      }

      navigate(createPageUrl("Landing"), { replace: true });
    } catch (err) {
      if (
        err?.status === 403 &&
        (err?.data?.code === "EMAIL_NOT_VERIFIED" ||
          /verify your email/i.test(err.message || ""))
      ) {
        navigate(createPageUrl("OTPVerification"), {
          state: { email: trimmedEmail },
          replace: true,
        });
        return;
      }
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
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
            Log in to FoodBridge
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Enter your email and password to continue
          </p>
        </div>

        <Card className="p-6 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Forgot Password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? "Logging in..." : "Log in"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
