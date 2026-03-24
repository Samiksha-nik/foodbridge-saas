// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Bell, X, AlertTriangle, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import * as notificationsApi from "@/api/notificationsApi";

const typeIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  info: Bell,
};

const typeClasses = {
  success: "bg-emerald-100 text-emerald-600",
  warning: "bg-amber-100 text-amber-600",
  info: "bg-blue-100 text-blue-600",
};

function getRelativeTimeLabel(dateValue) {
  const m = moment(dateValue);
  if (!m.isValid()) return "";
  const diffSec = Math.max(0, moment().diff(m, "seconds"));
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return `${mins} min ago`;
  }
  if (diffSec < 86400) {
    const hrs = Math.floor(diffSec / 3600);
    return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  }
  return m.fromNow();
}

export default function NotificationPanel({ userId }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await notificationsApi.getUserNotifications(userId, 20);
        if (!cancelled) setNotifications(res.data || []);
      } catch {
        if (!cancelled) setNotifications([]);
      }
    };

    load();
    const timer = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [userId]);

  const markRead = async (n) => {
    if (!n.isRead) {
      try {
        await notificationsApi.markNotificationRead(n._id);
      } catch {
        // non-fatal for UI
      }
      setNotifications((prev) =>
        prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x))
      );
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    for (const n of unread) {
      try {
        await notificationsApi.markNotificationRead(n._id);
      } catch {
        // continue best-effort
      }
    }
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
  };

  const todayStart = moment().startOf("day");
  const yesterdayStart = moment().subtract(1, "day").startOf("day");
  const grouped = notifications.reduce(
    (acc, n) => {
      const when = moment(n.createdAt);
      if (when.isSameOrAfter(todayStart)) acc.today.push(n);
      else if (when.isSameOrAfter(yesterdayStart)) acc.yesterday.push(n);
      else acc.earlier.push(n);
      return acc;
    },
    { today: [], yesterday: [], earlier: [] }
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-50">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-emerald-600 hover:underline">Mark all read</button>
                  )}
                  <button onClick={() => setOpen(false)}>
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <ScrollArea className="max-h-96">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">No notifications yet</div>
                ) : (
                  <>
                    {[
                      { key: "today", label: "Today", items: grouped.today },
                      { key: "yesterday", label: "Yesterday", items: grouped.yesterday },
                      { key: "earlier", label: "Earlier", items: grouped.earlier },
                    ].map((group) => (
                      <React.Fragment key={group.key}>
                        {group.items.length > 0 && (
                          <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                            {group.label}
                          </div>
                        )}
                        {group.items.map((n) => {
                          const Icon = typeIcons[n.type] || Bell;
                          const iconClass = typeClasses[n.type] || typeClasses.info;
                          return (
                            <div
                              key={n._id}
                              onClick={() => markRead(n)}
                              className={`flex gap-3 p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-emerald-50/30" : ""}`}
                            >
                              <div className={`p-2 rounded-lg shrink-0 ${iconClass}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-sm ${!n.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                                  {n.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {getRelativeTimeLabel(n.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </>
                )}
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}