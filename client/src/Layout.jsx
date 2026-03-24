import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { useAuth } from "@/lib/AuthContext";
import { useAuthGuard } from "@/lib/useAuthGuard";
import NotificationPanel from "./components/shared/NotificationPanel";
import {
  LayoutDashboard, Plus, Package, BarChart3, Star, User, LogOut,
  MapPin, Calendar, History, ShieldAlert, Users, Activity, Menu, X,
  ChevronRight, Leaf
} from "lucide-react";

const providerLinks = [
  { label: "Dashboard", page: "ProviderDashboard", icon: LayoutDashboard },
  { label: "Add Donation", page: "AddDonation", icon: Plus },
  { label: "My Donations", page: "MyDonations", icon: Package },
  { label: "Analytics", page: "ProviderAnalytics", icon: BarChart3 },
  { label: "Ratings", page: "ProviderRatings", icon: Star },
  { label: "Profile", page: "Profile", icon: User },
];

const ngoLinks = [
  { label: "Dashboard", page: "NGODashboard", icon: LayoutDashboard },
  { label: "Nearby Food", page: "NearbyFood", icon: MapPin },
  { label: "Pickup Schedule", page: "PickupSchedule", icon: Calendar },
  { label: "Delivery History", page: "DeliveryHistory", icon: History },
  { label: "Analytics", page: "NGOAnalytics", icon: BarChart3 },
  { label: "Ratings", page: "NGORatings", icon: Star },
  { label: "Profile", page: "Profile", icon: User },
];

const adminLinks = [
  { label: "Dashboard", page: "AdminDashboard", icon: LayoutDashboard },
  { label: "Users", page: "UserManagement", icon: Users },
  { label: "Donations", page: "DonationsMonitoring", icon: Package },
  { label: "NGO Approvals", page: "admin/ngos", icon: Users },
  { label: "Fraud Alerts", page: "FraudAlerts", icon: ShieldAlert },
  { label: "Analytics", page: "AdminAnalytics", icon: Activity },
];

const publicPages = ["Landing", "RoleSelection", "Register", "Login", "ProviderRegistration", "NGORegistration", "OTPVerification", "PendingApproval", "forgot-password", "reset-password/:token"];

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

export default function Layout({ children, currentPageName }) {
  const { user, isLoadingAuth, logout } = useAuth();
  const { canRender, redirecting } = useAuthGuard(currentPageName);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (publicPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  if (!canRender || redirecting || isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <p className="text-gray-600">Please log in to continue</p>
          <Link
            to={createPageUrl("Login")}
            className="inline-flex items-center justify-center px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const links = user.app_role === "admin" ? adminLinks : user.app_role === "ngo" ? ngoLinks : providerLinks;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="p-5 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl("Landing")} className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">FoodBridge</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {links.map(link => {
            const isActive = currentPageName === link.page;
            return (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <link.icon className={`w-[18px] h-[18px] ${isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                {link.label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-emerald-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-50">
          <button
            onClick={() => logout(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full capitalize">{user.app_role}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationPanel userId={user.id} />
            <div className="flex items-center gap-2.5 pl-2 border-l border-gray-100 ml-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                {user.full_name?.[0] || user.email?.[0] || "?"}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:block">{user.full_name || user.email}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}