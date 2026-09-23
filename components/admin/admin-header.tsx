import React from "react";
import { Film, Users, Calendar, BarChart3 } from "lucide-react";

export interface AdminHeaderProps {
  title?: string;
  activeTab?: string;
}

export function AdminHeader({ title = "Admin Dashboard" }: AdminHeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-xs text-zinc-400">Manage movies, theaters, screenings, and reservations</p>
        </div>
        <div className="flex items-center gap-2">
          <nav className="flex items-center space-x-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-800 text-white shadow-sm">
              <Film className="w-3.5 h-3.5 text-primary" />
              Movies
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200">
              <Calendar className="w-3.5 h-3.5" />
              Screenings
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200">
              <Users className="w-3.5 h-3.5" />
              Bookings
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200">
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
