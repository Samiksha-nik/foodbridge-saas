import React, { useState, useEffect } from "react";
import * as adminApi from "@/api/adminApi";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { StatusBadge, UrgencyBadge } from "../components/ui/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, Package } from "lucide-react";
import moment from "moment";

export default function DonationsMonitoring() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const json = await adminApi.getAdminDonations();
        const list = json?.data?.donations || [];
        setDonations(list);
        console.log("Donations:", list.length);
      } catch (e) {
        console.error("Admin donations fetch failed", e);
        setDonations([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = donations.filter(d => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search && !d.food_name?.toLowerCase().includes(search.toLowerCase()) && !d.provider_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Donations Monitoring</h1>
        <p className="text-sm text-gray-500 mt-1">{donations.length} total donations on platform</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search food or provider..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="picked">Picked</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Food</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>NGO</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No donations found
                  </TableCell>
                </TableRow>
              ) : filtered.map(d => (
                <TableRow key={d.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{d.food_name}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{d.provider_name || "—"}</TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {d.quantity_kg != null ? `${d.quantity_kg}kg` : d.quantity_unit ? `${d.quantity} ${d.quantity_unit}` : d.quantity}
                    {d.meals_equivalent ? <span className="text-xs text-emerald-600 ml-1">(~{d.meals_equivalent} meals)</span> : null}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">{d.assigned_ngo_name || "Unassigned"}</TableCell>
                  <TableCell><UrgencyBadge urgency={d.urgency} /></TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                  <TableCell className="text-gray-500 text-sm">{moment(d.created_date).format("MMM D")}</TableCell>
                  <TableCell>
                    <Link to={createPageUrl(`DonationDetail?id=${d.id}`)}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs"><Eye className="w-3.5 h-3.5" /></Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}