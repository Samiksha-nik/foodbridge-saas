import React, { useState, useEffect } from "react";
import * as adminApi from "@/api/adminApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Ban, CheckCircle2, XCircle } from "lucide-react";
import moment from "moment";

export default function UserManagement() {
  const [providers, setProviders] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const json = await adminApi.getAdminUsers();
        const p = json?.data?.providers || [];
        const n = json?.data?.ngos || [];
        setProviders(p);
        setNgos(n);
        console.log("Users:", p.length + n.length);
      } catch (e) {
        console.error("Admin users fetch failed", e);
        setProviders([]);
        setNgos([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const mergeUser = (updated) => {
    if (!updated) return;
    setProviders((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setNgos((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const toggleBlock = async (user) => {
    try {
      const updated = !user.is_blocked;
      const json = await adminApi.patchAdminUser(user.id, { is_blocked: updated });
      mergeUser(json?.data);
    } catch (e) {
      console.error("Block user failed", e);
    }
  };

  const toggleApproval = async (user) => {
    try {
      const updated = !user.is_approved;
      const json = await adminApi.patchAdminUser(user.id, { is_approved: updated });
      mergeUser(json?.data);
    } catch (e) {
      console.error("Approve user failed", e);
    }
  };

  const UserTable = ({ data, showApproval = false }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-400 py-8">No users found</TableCell>
            </TableRow>
          ) : data.map(u => (
            <TableRow key={u.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
              <TableCell className="text-gray-500 text-sm">{u.email}</TableCell>
              <TableCell className="text-gray-500 text-sm">{u.organization_name || "—"}</TableCell>
              <TableCell className="text-gray-500 text-sm">{moment(u.created_date).format("MMM D, YYYY")}</TableCell>
              <TableCell>
                <div className="flex gap-1.5">
                  {u.is_blocked ? (
                    <Badge className="bg-red-100 text-red-700 border-red-200 border text-xs">Blocked</Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-xs">Active</Badge>
                  )}
                  {showApproval && (
                    u.is_approved ? (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 border text-xs">Approved</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 border text-xs">Pending</Badge>
                    )
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {showApproval && !u.is_approved && (
                    <Button size="sm" variant="outline" onClick={() => toggleApproval(u)} className="h-7 text-xs text-emerald-600 border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleBlock(u)}
                    className={`h-7 text-xs ${u.is_blocked ? "text-emerald-600 border-emerald-200" : "text-red-600 border-red-200"}`}
                  >
                    {u.is_blocked ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Unblock</> : <><Ban className="w-3.5 h-3.5 mr-1" /> Block</>}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">{providers.length + ngos.length} registered users</p>
      </div>

      <Card className="border border-gray-100 overflow-hidden">
        <Tabs defaultValue="providers">
          <div className="border-b border-gray-100 px-4 pt-3">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="providers">Providers ({providers.length})</TabsTrigger>
              <TabsTrigger value="ngos">NGOs ({ngos.length})</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="providers" className="mt-0">
            <UserTable data={providers} />
          </TabsContent>
          <TabsContent value="ngos" className="mt-0">
            <UserTable data={ngos} showApproval />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}