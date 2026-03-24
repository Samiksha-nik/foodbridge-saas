import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import * as ratingApi from "@/api/ratingApi";

export default function RatingModal({ open, onClose, donationId, ngoId, providerId, fromEmail, fromName, toEmail, toName, role }) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (stars === 0) return;
    if (!donationId || !ngoId || !providerId) {
      onClose(false);
      return;
    }
    setSubmitting(true);
    try {
      await ratingApi.createRating({
        donationId,
        ngoId,
        providerId,
        rating: stars,
        feedback: feedback.trim() || undefined,
      });
      setStars(0);
      setFeedback("");
      onClose(true);
      window.dispatchEvent(new CustomEvent("ngo-rating-updated"));
    } catch (_) {
      setSubmitting(false);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setStars(i)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    i <= (hovered || stars)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300"
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500">
            {stars === 0 ? "Tap to rate" : `${stars} star${stars > 1 ? "s" : ""}`}
          </p>
          <Textarea
            placeholder="Share your feedback (optional)..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={stars === 0 || submitting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}