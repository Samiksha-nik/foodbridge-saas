import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { StatusBadge, UrgencyBadge } from "../components/ui/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Package, Search, Plus, Eye, Trash2 } from "lucide-react";
import moment from "moment";
import * as providerDonationApi from "@/api/providerDonationApi";
import { useToast } from "@/components/ui/use-toast";

export default function MyDonations() {
  const { toast } = useToast();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await providerDonationApi.getProviderDonations({
          limit: 100,
        });
        setDonations(res.data || []);
      } catch (err) {
        if (err?.status === 401) {
          window.location.href = createPageUrl("Login");
          return;
        }
        if (err?.status === 403) {
          setError("Access denied. Provider access required.");
          setDonations([]);
          return;
        }
        setError(
          err?.message || "Failed to load donations. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = donations.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (
      search &&
      !d.foodName?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const handleDelete = async (donationId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this donation?"
    );
    if (!confirmed) return;

    try {
      await providerDonationApi.deleteDonation(donationId);
      setDonations((prev) => prev.filter((d) => d._id !== donationId));
      toast({
        title: "Donation deleted",
        description: "The donation has been removed from your list.",
      });
    } catch (err) {
      if (err?.status === 401) {
        window.location.href = createPageUrl("Login");
        return;
      }
      if (err?.status === 403) {
        toast({
          title: "Access denied",
          description: "You are not allowed to delete this donation.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description:
          err?.message || "Failed to delete donation. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Donations</h1>
          <p className="text-sm text-gray-500 mt-1">{donations.length} total donations</p>
        </div>
        <Link to={createPageUrl("AddDonation")}>
          <Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> New Donation</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search donations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="picked">Picked Up</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <Card className="p-12 text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            No donations yet. Create your first donation.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((d) => (
            <Card
              key={d._id}
              className="p-4 hover:shadow-md transition-all border border-gray-100 group"
            >
              <div className="flex items-center gap-4">
                {d.photoUrl ? (
                  <img
                    src={d.photoUrl}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {d.foodName}
                    </p>
                    <UrgencyBadge urgency={d.expiryRiskLevel} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>
                      {d.quantity} {d.quantityUnit}
                    </span>
                    {typeof d.mealsEquivalent === "number" && d.mealsEquivalent > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-600 font-medium">
                          ~{d.mealsEquivalent} meals
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span className="capitalize">
                      {d.category?.replace("_", "-")}
                    </span>
                    <span>·</span>
                    <span>{moment(d.createdAt).fromNow()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={d.status} />
                  <Link
                    to={createPageUrl(`DonationDetail?id=${d._id}`)}
                    className="text-gray-300 hover:text-emerald-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(d._id)}
                    className="text-gray-300 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}