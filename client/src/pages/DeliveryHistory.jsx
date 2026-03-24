import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as authApi from "@/api/authApi";
import { createPageUrl } from "../utils";
import { StatusBadge } from "../components/ui/StatusBadge";
import RatingModal from "../components/shared/RatingModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star, Eye, Image, History } from "lucide-react";
import moment from "moment";
import * as ngoDonationApi from "@/api/ngoDonationApi";

export default function DeliveryHistory() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [ratingFor, setRatingFor] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await authApi.getMe();
        setUser(me);
      } catch (err) {
        console.error("Load NGO user failed", err);
      }
      try {
        const res = await ngoDonationApi.getMyDonations();
        const d = res.data || [];
        setDeliveries(
          d.filter(
            (x) => x.status === "delivered" || x.status === "cancelled"
          )
        );
      } catch (err) {
        console.error("Load delivery history failed", err);
        setDeliveries([]);
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

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Delivery History
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {deliveries.length} completed deliveries
        </p>
      </div>

      {deliveries.length === 0 ? (
        <Card className="p-12 text-center">
          <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No delivery history yet</p>
        </Card>
      ) : (
        <Card className="border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Food</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((d) => (
                  <TableRow key={d.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {d.food_name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {d.provider_name}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {moment(d.created_date).format("MMM D, YYYY")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    <TableCell>
                      {d.delivery_proof_urls?.length > 0 ? (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <Image className="w-3.5 h-3.5" />{" "}
                          {d.delivery_proof_urls.length} photo(s)
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link to={createPageUrl(`DonationDetail?id=${d.id}`)}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                          </Button>
                        </Link>
                        {d.status === "delivered" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-amber-600"
                            onClick={() => setRatingFor(d)}
                          >
                            <Star className="w-3.5 h-3.5 mr-1" /> Rate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {ratingFor && (
        <RatingModal
          open={!!ratingFor}
          onClose={() => setRatingFor(null)}
          donationId={ratingFor.id}
          ngoId={user?.id}
          providerId={ratingFor.provider_id}
          fromEmail={user?.email}
          fromName={user?.fullName}
          toEmail={ratingFor.provider_email}
          toName={ratingFor.provider_name}
          role="ngo"
        />
      )}
    </div>
  );
}

