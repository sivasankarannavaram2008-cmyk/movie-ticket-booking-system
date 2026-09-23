"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Radio,
  Ticket,
  ShieldCheck,
  Film,
  RefreshCw,
  IndianRupee,
  ClipboardList,
} from "lucide-react";
import dynamic from "next/dynamic";

const AdminOverview = dynamic(() => import("@/components/admin/AdminOverview"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex flex-col items-center justify-center text-zinc-500 gap-2">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-xs font-medium text-zinc-400">Loading overview & analytics...</p>
    </div>
  ),
});

const AdminBookings = dynamic(() => import("@/components/admin/AdminBookings"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex flex-col items-center justify-center text-zinc-500 gap-2">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-xs font-medium text-zinc-400">Loading bookings console...</p>
    </div>
  ),
});

const AdminScheduler = dynamic(() => import("@/components/admin/AdminScheduler"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex flex-col items-center justify-center text-zinc-500 gap-2">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-xs font-medium text-zinc-400">Loading showtime scheduler...</p>
    </div>
  ),
});

const AdminTelemetry = dynamic(() => import("@/components/admin/AdminTelemetry"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex flex-col items-center justify-center text-zinc-500 gap-2">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-xs font-medium text-zinc-400">Loading screen telemetry...</p>
    </div>
  ),
});

type AdminTab = "overview" | "bookings" | "scheduler" | "telemetry";

export function AdminClient() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live database calculations at the page level
  const [dbSummary, setDbSummary] = useState({
    grossRevenue: 0,
    totalBookings: 0,
    totalSeatsSold: 0,
  });

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error("Failed to fetch summary");
      const data = await res.json();
      if (data.summary) {
        setDbSummary({
          grossRevenue: data.summary.grossRevenue || 0,
          totalBookings: data.summary.totalBookings || 0,
          totalSeatsSold: data.summary.totalSeatsSold || 0,
        });
      }
    } catch (err) {
      console.error("Failed to calculate live summary:", err);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, refreshTrigger]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    fetchSummary();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const tabs: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: "Overview & Analytics", icon: BarChart3 },
    { id: "bookings", label: "Live Bookings", icon: Ticket },
    { id: "scheduler", label: "Showtimes Scheduler", icon: Calendar },
    { id: "telemetry", label: "Screen Telemetry", icon: Radio },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-foreground flex flex-col">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand & Title */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 bg-zinc-900 border border-zinc-700/80 hover:bg-zinc-800 hover:text-white transition group"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-zinc-400 group-hover:-translate-x-0.5 transition-transform" />
                Storefront
              </Link>
              <div className="h-5 w-px bg-zinc-800" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Film className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-white tracking-tight leading-none">
                    My <span className="text-primary">Movie</span> Booking
                  </h1>
                  <p className="text-[11px] text-zinc-400 font-medium">Admin Control Center</p>
                </div>
              </div>
            </div>

            {/* Live Metrics Pill Strip (Desktop) */}
            <div className="hidden lg:flex items-center gap-4 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
              <div className="flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-zinc-400">Revenue:</span>
                <span className="font-bold text-white font-mono">₹{dbSummary.grossRevenue.toLocaleString("en-IN")}</span>
              </div>
              <div className="h-3 w-px bg-zinc-800" />
              <div className="flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-zinc-400">Bookings:</span>
                <span className="font-bold text-white font-mono">{dbSummary.totalBookings}</span>
              </div>
              <div className="h-3 w-px bg-zinc-800" />
              <div className="flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-zinc-400">Seats Sold:</span>
                <span className="font-bold text-white font-mono">{dbSummary.totalSeatsSold}</span>
              </div>
            </div>

            {/* Actions & Status Badges */}
            <div className="flex items-center gap-3">
              {/* Manual Refresh Data Button */}
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-200 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:text-white transition active:scale-95 disabled:opacity-50"
                title="Re-run database queries and fetch fresh data"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-primary ${isRefreshing ? "animate-spin" : ""}`} />
                <span>Refresh Data</span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Engine Active
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span className="hidden md:inline">Role:</span> Super Admin
              </div>
            </div>
          </div>

          {/* ── Sub-header Navigation Tabs ── */}
          <div className="flex items-center space-x-1 border-t border-zinc-800/80 py-2.5 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-zinc-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Tab Content Body ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && <AdminOverview refreshTrigger={refreshTrigger} />}
        {activeTab === "bookings" && <AdminBookings refreshTrigger={refreshTrigger} />}
        {activeTab === "scheduler" && <AdminScheduler refreshTrigger={refreshTrigger} />}
        {activeTab === "telemetry" && <AdminTelemetry refreshTrigger={refreshTrigger} />}
      </main>
    </div>
  );
}
export default AdminClient;
