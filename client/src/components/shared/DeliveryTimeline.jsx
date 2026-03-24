import React from "react";
import { CheckCircle2, Circle, Package, Truck, HandHeart, XCircle } from "lucide-react";

const steps = [
  { key: "pending", label: "Listed", icon: Package },
  { key: "accepted", label: "Accepted", icon: CheckCircle2 },
  { key: "picked", label: "Picked Up", icon: Truck },
  { key: "delivered", label: "Delivered", icon: HandHeart },
];

export default function DeliveryTimeline({ status }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
        <XCircle className="w-5 h-5 text-red-500" />
        <span className="text-sm font-medium text-red-700">This donation was cancelled</span>
      </div>
    );
  }

  const currentIndex = steps.findIndex(s => s.key === status);

  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, i) => {
        const isCompleted = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                    : "bg-gray-100 text-gray-400"
                } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[11px] font-medium ${isCompleted ? "text-emerald-700" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mt-[-18px] rounded ${i < currentIndex ? "bg-emerald-500" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}