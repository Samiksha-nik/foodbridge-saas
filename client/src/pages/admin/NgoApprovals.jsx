import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import * as adminNgoApi from "@/api/adminNgoApi";
import { createPageUrl } from "@/utils";

export default function NgoApprovals() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await adminNgoApi.getPendingNgos();
        const list = res.data || [];
        setNgos(list);
        console.log("[NgoApprovals] pending NGOs:", list.length);
      } catch (err) {
        if (err?.status === 401) {
          navigate(createPageUrl("Login"), { replace: true });
          return;
        }
        if (err?.status === 403) {
          setError("Access denied. Admin access only.");
          setNgos([]);
          return;
        }
        setError(err?.message || "Failed to load pending NGOs.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const removeNgoFromList = (id) => {
    const sid = String(id);
    setNgos((prev) => prev.filter((n) => String(n._id) !== sid));
  };

  const handleApprove = async (id) => {
    try {
      await adminNgoApi.approveNgo(id);
      removeNgoFromList(id);
      toast({
        title: "NGO approved",
        description: "The NGO has been approved successfully.",
      });
    } catch (err) {
      if (err?.status === 401) {
        navigate(createPageUrl("Login"), { replace: true });
        return;
      }
      if (err?.status === 403) {
        toast({
          title: "Access denied",
          description: "You are not allowed to approve NGOs.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description:
          err?.message || "Failed to approve NGO. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id) => {
    try {
      await adminNgoApi.rejectNgo(id);
      removeNgoFromList(id);
      toast({
        title: "NGO rejected",
        description: "The NGO has been rejected.",
      });
    } catch (err) {
      if (err?.status === 401) {
        navigate(createPageUrl("Login"), { replace: true });
        return;
      }
      if (err?.status === 403) {
        toast({
          title: "Access denied",
          description: "You are not allowed to reject NGOs.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description:
          err?.message || "Failed to reject NGO. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          NGO Approvals
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and approve pending NGO registrations
        </p>
      </div>

      <Card className="p-0 border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : ngos.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500">No pending NGO approvals</p>
          </div>
        ) : (
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>NGO Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Registration date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ngos.map((ngo) => (
                <TableRow key={ngo._id}>
                  <TableCell className="font-medium">
                    {ngo.ngoName || ngo.organizationName || "—"}
                  </TableCell>
                  <TableCell>{ngo.email}</TableCell>
                  <TableCell>{ngo.ngoPhone || ngo.phone || "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {ngo.ngoAddress || ngo.address || "—"}
                  </TableCell>
                  <TableCell>
                    {ngo.createdAt
                      ? new Date(ngo.createdAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => handleApprove(ngo._id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(ngo._id)}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

