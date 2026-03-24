import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import { Link } from "react-router-dom";
import { StatusBadge, UrgencyBadge } from "../components/ui/StatusBadge";
import DeliveryTimeline from "../components/shared/DeliveryTimeline";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Truck, Calendar, Upload, CheckCircle2, Package } from "lucide-react";
import moment from "moment";
import { useToast } from "@/components/ui/use-toast";
import * as ngoDonationApi from "@/api/ngoDonationApi";

const safetyChecklist = [
  "Food is properly sealed/packaged",
  "Temperature maintained during transport",
  "No visible spoilage or damage",
  "Quantity matches listing",
  "Containers are clean and food-safe",
];

export default function PickupSchedule() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);
  const [pickupDate, setPickupDate] = useState("");
  const [driver, setDriver] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        const res = await ngoDonationApi.getMyDonations();
        const list = (res.data || []).filter((x) =>
          ["accepted", "picked_up"].includes(x.status)
        );
        setDonations(list);
      } catch (err) {
        console.error("Load pickup schedule failed", err);
        setDonations([]);
      } finally {
        setLoading(false);
      }
    };
    load();

    const handler = () => {
      setLoading(true);
      load();
    };
    window.addEventListener("ngo-donation-updated", handler);
    return () => window.removeEventListener("ngo-donation-updated", handler);
  }, []);

  const updateStatus = async (donation, newStatus) => {
    if (updating) return;
    setUpdating(true);
    try {
      const updates = {};
      if (pickupDate) updates.pickup_date = pickupDate;
      if (driver) updates.pickup_driver = driver;

      let proofUrls = donation.delivery_proof_urls || [];
      if (proofFile) {
        const res = await base44.integrations.Core.UploadFile({ file: proofFile });
        proofUrls = [...proofUrls, res.file_url];
        updates.delivery_proof_urls = proofUrls;
      }

      if (newStatus === "picked") {
        await ngoDonationApi.markPickedUp(donation.id);
        updates.status = "picked_up";
        updates.picked_at = new Date().toISOString();
      } else if (newStatus === "delivered") {
        await ngoDonationApi.markDelivered(donation.id, proofUrls);
        updates.status = "delivered";
        updates.delivered_at = new Date().toISOString();
      }

      setDonations((prev) =>
        prev
          .map((d) => (d.id === donation.id ? { ...d, ...updates } : d))
          .filter((d) => d.status !== "delivered")
      );

      if (newStatus === "delivered") {
        try {
          await base44.auth.updateMe({
            trust_score: (donation.trust_score || 0) + 0.5,
          });
        } catch (e) {
          // non-fatal
        }
        window.dispatchEvent(new CustomEvent("ngo-donation-updated"));
        toast({
          title: "Delivery confirmed",
          description: "Donation marked as delivered.",
        });
      } else if (newStatus === "picked") {
        window.dispatchEvent(new CustomEvent("ngo-donation-updated"));
        toast({
          title: "Pickup en route",
          description: "Donation marked as en route.",
        });
      }

      setSelected(null);
      setShowChecklist(false);
      setCheckedItems([]);
      setProofFile(null);
    } catch (err) {
      console.error("Update pickup status failed", err);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pickup Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">{donations.length} active pickups</p>
      </div>

      {donations.length === 0 ? (
        <Card className="p-12 text-center">
          <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No active pickups. Accept donations from Nearby Food to get started.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {donations.map(d => {
            const uiStatus = d.status === "picked_up" ? "picked" : d.status;
            return (
            <Card key={d.id} className="p-5 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{d.food_name}</h3>
                    <StatusBadge status={uiStatus} />
                    <UrgencyBadge urgency={d.urgency} />
                  </div>
                  <p className="text-xs text-gray-400">from {d.provider_name} · {d.quantity}</p>
                </div>
              </div>

              <DeliveryTimeline status={uiStatus} />

              <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-2">
                {uiStatus === "accepted" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => { setSelected(d); }} className="text-xs">
                      <Calendar className="w-3.5 h-3.5 mr-1" /> Schedule Pickup
                    </Button>
                    <Button size="sm" onClick={() => updateStatus(d, "picked")} disabled={updating} className="bg-blue-600 hover:bg-blue-700 text-xs">
                      <Truck className="w-3.5 h-3.5 mr-1" /> Mark En Route
                    </Button>
                  </>
                )}
                {uiStatus === "picked" && (
                  <Button size="sm" onClick={() => { setSelected(d); setShowChecklist(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Delivered
                  </Button>
                )}
              </div>
            </Card>
          )})}
        </div>
      )}

      {/* Schedule Dialog */}
      <Dialog open={!!selected && !showChecklist} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Pickup</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Pickup Date & Time</Label>
              <Input type="datetime-local" value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Driver / Volunteer Name</Label>
              <Input placeholder="Assigned driver" value={driver} onChange={e => setDriver(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={() => { if (selected) updateStatus(selected, selected.status); }} disabled={updating} className="bg-emerald-600 hover:bg-emerald-700">
              {updating ? "Saving..." : "Save Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Safety Checklist Dialog */}
      <Dialog open={showChecklist} onOpenChange={() => { setShowChecklist(false); setSelected(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Food Safety Checklist</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {safetyChecklist.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <Checkbox
                  checked={checkedItems.includes(i)}
                  onCheckedChange={(checked) => {
                    setCheckedItems(prev => checked ? [...prev, i] : prev.filter(x => x !== i));
                  }}
                />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
            <div className="space-y-1.5 pt-2">
              <Label className="flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> Proof of Delivery</Label>
              <Input type="file" accept="image/*" onChange={e => setProofFile(e.target.files[0])} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowChecklist(false); setSelected(null); }}>Cancel</Button>
            <Button
              onClick={() => { if (selected) updateStatus(selected, "delivered"); }}
              disabled={updating || checkedItems.length < safetyChecklist.length}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {updating ? "Updating..." : "Confirm Delivery"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}