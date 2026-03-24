import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import { UrgencyBadge, AIBadge, TrustBadge } from "../components/ui/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, MapPin, Clock, Check, X, Sparkles } from "lucide-react";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import * as ngoDonationApi from "@/api/ngoDonationApi";

export default function NearbyFood() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch (err) {
        console.error("Load NGO user failed", err);
      }
      try {
        const res = await ngoDonationApi.getAvailableDonations();
        setDonations(res.data || []);
      } catch (err) {
        console.error("Load available donations failed", err);
        setDonations([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAccept = async (donation) => {
    if (acceptingId) return;
    setAcceptingId(donation.id);
    try {
      await ngoDonationApi.acceptDonation(donation.id);
      setDonations((prev) => prev.filter((d) => d.id !== donation.id));
      window.dispatchEvent(new CustomEvent("ngo-donation-updated"));
      toast({
        title: "Pickup accepted",
        description: "Pickup accepted successfully.",
      });
    } catch (err) {
      console.error("Accept donation failed", err);
      toast({
        title: "Error",
        description: "Failed to accept donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAcceptingId(null);
    }
  };

  const filtered = donations.filter(d => {
    if (categoryFilter !== "all" && d.category !== categoryFilter) return false;
    if (urgencyFilter !== "all" && d.urgency !== urgencyFilter) return false;
    return true;
  });

  // Sort: high urgency first
  const sorted = [...filtered].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.urgency] || 1) - (order[b.urgency] || 1);
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nearby Food</h1>
        <p className="text-sm text-gray-500 mt-1">{donations.length} donations available</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="cooked">Cooked</SelectItem>
            <SelectItem value="raw">Raw</SelectItem>
            <SelectItem value="perishable">Perishable</SelectItem>
            <SelectItem value="non_perishable">Non-Perishable</SelectItem>
          </SelectContent>
        </Select>
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Urgency" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Urgency</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sorted.length === 0 ? (
        <Card className="p-12 text-center">
          <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No nearby donations match your filters</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {sorted.map(d => (
              <motion.div key={d.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Card className="border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  {d.photo_url && (
                    <img src={d.photo_url} alt="" className="w-full h-36 object-cover" />
                  )}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{d.food_name}</h3>
                        <p className="text-xs text-gray-400 capitalize">{d.category?.replace("_", " ")} · {d.quantity}</p>
                      </div>
                      <UrgencyBadge urgency={d.urgency} />
                    </div>

                    {d.ai_recommended_ngo && <AIBadge />}

                    <div className="space-y-1.5 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{d.pickup_location || "Location TBD"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{d.predicted_expiry ? `Expires in ~${d.predicted_expiry}` : `Listed ${moment(d.created_date).fromNow()}`}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <span className="text-xs text-gray-400">by {d.provider_name}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs">
                          <X className="w-3.5 h-3.5 mr-1" /> Skip
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(d)}
                          disabled={acceptingId === d.id}
                          className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />{" "}
                          {acceptingId === d.id ? "Accepting..." : "Accept"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}