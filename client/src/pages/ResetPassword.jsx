import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import * as authApi from "@/api/authApi";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf } from "lucide-react";

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      toast({
        title: "Invalid password",
        description: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (!token?.trim()) {
      toast({
        title: "Invalid link",
        description: "This reset link is invalid or expired.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword(token.trim(), password);
      toast({
        title: "Password reset",
        description: "Your password has been reset successfully.",
      });
      setTimeout(() => {
        navigate(createPageUrl("Login"), { replace: true });
      }, 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message || "Invalid or expired reset token. Please request a new link.",
        variant: "destructive",
      });
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
            Reset Password
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Enter your new password below
          </p>
        </div>

        <Card className="p-6 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </Card>

        <p className="text-center mt-4 text-sm text-gray-500">
          <Link to={createPageUrl("Login")} className="text-emerald-600 hover:text-emerald-700">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
