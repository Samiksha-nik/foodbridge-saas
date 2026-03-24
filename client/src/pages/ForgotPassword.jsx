import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import * as authApi from "@/api/authApi";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSubmitted(true);
      toast({
        title: "Check your email",
        description: "If your email exists, a reset link has been sent.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message || "Something went wrong. Please try again.",
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
            Forgot Password
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <Card className="p-6 border border-gray-100">
          {submitted ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                If your email exists in our system, you will receive a password reset link shortly.
              </p>
              <Link to={createPageUrl("Login")}>
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
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
