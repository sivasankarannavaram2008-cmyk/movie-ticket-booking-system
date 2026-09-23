"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Film, MapPin, Armchair, TrendingUp, PieChart as PieIcon } from "lucide-react";

export interface CityChartData {
  cityId: string;
  cityName: string;
  state: string;
  revenue: number;
  seatsSold: number;
  bookingsCount: number;
  revenueShare: number;
}

export interface MovieChartData {
  movieId: string;
  title: string;
  revenue: number;
  seatsSold: number;
  bookingsCount: number;
}

export interface TierChartData {
  tier: "CLASSIC" | "PRIME" | "RECLINER";
  label: string;
  count: number;
  revenue: number;
  percentage: number;
  color: string;
}

export interface AdminChartsProps {
  cityData?: CityChartData[];
  movieData?: MovieChartData[];
  tierData?: TierChartData[];
  metrics?: {
    grossRevenue: number;
    totalBookings: number;
    seatsSold: number;
    systemOccupancy: number;
  };
}

const PIE_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export function AdminCharts({
  cityData = [],
  movieData = [],
  tierData = [],
  metrics,
}: AdminChartsProps) {
  const hasData = cityData.length > 0 || movieData.length > 0;

  if (!hasData) {
    return (
      <div className="h-64 flex flex-col items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-950/40 text-zinc-500 text-xs">
        <TrendingUp className="w-8 h-8 mb-2 text-zinc-600" />
        <p>No confirmed booking charts data available in database yet.</p>
      </div>
    );
  }

  // Format data for Movie Chart
  const movieChartData = movieData.map((m) => ({
    name: m.title.length > 18 ? `${m.title.slice(0, 16)}...` : m.title,
    fullName: m.title,
    revenue: m.revenue,
    tickets: m.seatsSold,
  }));

  // Format data for City Chart
  const cityChartData = cityData.map((c) => ({
    name: c.cityName,
    revenue: c.revenue,
    tickets: c.seatsSold,
    share: c.revenueShare,
  }));

  // Format data for Tier Chart
  const tierPieData = tierData.map((t) => ({
    name: t.label,
    value: t.count,
    revenue: t.revenue,
    color: t.color,
  }));

  return (
    <div className="space-y-6">
      {/* ── Top Row: Revenue by Movie & Regional City Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Revenue by Movie Chart */}
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-zinc-200">Revenue by Movie Title</h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">Box Office Gross</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={movieChartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#3f3f46" }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#3f3f46" }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{d.fullName}</p>
                          <p className="text-emerald-400 font-mono">
                            Revenue: ₹{Number(d.revenue).toLocaleString("en-IN")}
                          </p>
                          <p className="text-blue-400 font-mono">
                            Tickets: {Number(d.tickets).toLocaleString("en-IN")}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. City Distribution Chart */}
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-zinc-200">City Revenue Distribution</h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">All Metros</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cityChartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#3f3f46" }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#3f3f46" }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{label}</p>
                          <p className="text-emerald-400 font-mono">
                            Revenue: ₹{Number(d.revenue).toLocaleString("en-IN")} ({d.share}%)
                          </p>
                          <p className="text-blue-400 font-mono">
                            Tickets: {Number(d.tickets).toLocaleString("en-IN")}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Tier Breakdown (Classic, Prime, Recliner) ── */}
      {tierData.length > 0 && (
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Armchair className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-zinc-200">
                Auditorium Seat Tier Breakdown (Classic • Prime • Recliner)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">Sold Seats Categorization</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {tierData.map((t) => (
              <div
                key={t.tier}
                className="p-4 rounded-xl border border-zinc-800/90 bg-zinc-900/50 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-xs font-semibold text-zinc-300">{t.label}</span>
                  </div>
                  <h4 className="text-xl font-bold text-white font-mono mt-1.5">
                    {t.count} <span className="text-xs font-normal text-zinc-400">seats</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                    ₹{t.revenue.toLocaleString("en-IN")} gross
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-zinc-200 font-mono">
                    {t.percentage}%
                  </span>
                  <p className="text-[10px] text-zinc-500 uppercase">Share</p>
                </div>
              </div>
            ))}
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={4}
                >
                  {tierPieData.map((entry, index) => (
                    <Cell key={`tier-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 shadow-xl text-xs space-y-0.5">
                          <p className="font-bold text-white">{d.name}</p>
                          <p className="text-zinc-300 font-mono">
                            {d.value} seats booked • ₹{Number(d.revenue).toLocaleString("en-IN")}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  formatter={(val) => <span className="text-xs text-zinc-300">{val}</span>}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCharts;
