import React from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";

export default function PendingApproval() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <Card className="p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Pending Approval</h1>
          <p className="text-gray-500 mb-6">
            Thank you for registering! Your NGO profile is currently under review by our admin team. 
            You'll receive an email notification once your account is approved.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-sm text-blue-700">
            <strong>What happens next?</strong>
            <ul className="list-disc list-inside mt-2 text-left space-y-1">
              <li>Our team verifies your NGO certificate</li>
              <li>Approval typically takes 24-48 hours</li>
              <li>You'll get email access once approved</li>
            </ul>
          </div>
          <Button
            onClick={() => base44.auth.logout()}
            variant="outline"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </Card>
      </div>
    </div>
  );
}