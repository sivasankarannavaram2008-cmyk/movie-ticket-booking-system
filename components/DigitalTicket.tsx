"use client";

import React from "react";
import { Ticket } from "lucide-react";
import { MoviePoster } from "@/components/MoviePoster";
import { InMemTicket } from "@/types/ticket";

export interface DigitalTicketProps {
  ticket: InMemTicket;
  qrCodeUrl?: string;
  onPrint?: () => void;
}

export function DigitalTicket({ ticket, qrCodeUrl, onPrint }: DigitalTicketProps) {
  return (
    <div className="max-w-xl mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative print:border-black print:text-black">
      {/* TOP SECTION: Movie & Screening Info */}
      <div className="relative p-6 sm:p-8 space-y-5 overflow-hidden">
        {/* Subtle dark cinema ambient backdrop aura */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-tr from-rose-950/40 via-zinc-900 to-amber-950/30" />
        </div>

        {/* Ticket Header Brand Bar */}
        <div className="relative z-10 flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-primary/30">
              <Ticket className="w-3.5 h-3.5" />
            </div>
            <span className="font-black text-sm text-white tracking-wide">
              My <span className="text-primary">Movie</span> Booking
            </span>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Digital Admission Pass
          </span>
        </div>

        <div className="relative z-10 flex gap-5 items-start">
          {/* Dark Cinema Emblem / Card Thumbnail (No hardcoded external person image) */}
          <div className="w-20 sm:w-24 shrink-0 shadow-lg">
            <MoviePoster
              title={ticket.movieTitle}
              poster_url={null}
              size="sm"
              className="w-20 sm:w-24 rounded-xl"
              showBottomDetails={false}
              showOverlayBadges={false}
            />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
              {ticket.screenName?.includes("IMAX") ? "IMAX 3D Laser" : "Dolby Atmos 7.1"}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {ticket.movieTitle}
            </h2>
            <p className="text-xs font-medium text-zinc-400">
              {ticket.cinemaName}
            </p>
            <p className="text-[11px] text-zinc-500">
              {ticket.screenName}
            </p>
          </div>
        </div>

        {/* Schedule & Seats Matrix Strip */}
        <div className="relative z-10 grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-850 text-center">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Date
            </span>
            <div className="text-xs sm:text-sm font-black text-white">{ticket.date}</div>
          </div>

          <div className="space-y-0.5 border-x border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Time
            </span>
            <div className="text-xs sm:text-sm font-black text-emerald-400">{ticket.time}</div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Seats
            </span>
            <div className="text-xs sm:text-sm font-black text-primary truncate px-1">
              {ticket.seatLabels.join(", ")}
            </div>
          </div>
        </div>
      </div>

      {/* TICKET PERFORATION DIVIDER */}
      <div className="relative flex items-center justify-between px-2 bg-zinc-950">
        <div className="w-6 h-12 bg-background rounded-r-full -ml-3 border-y border-r border-zinc-800" />
        <div className="flex-1 border-b-2 border-dashed border-zinc-800 mx-4" />
        <div className="w-6 h-12 bg-background rounded-l-full -mr-3 border-y border-l border-zinc-800" />
      </div>

      {/* BOTTOM SECTION: QR Code & Verification Stub */}
      <div className="p-6 sm:p-8 bg-zinc-950/90 space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Scannable QR Code */}
          <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0">
            {qrCodeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrCodeUrl}
                alt="Entry QR Code"
                className="w-32 h-32 object-contain"
              />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center text-black text-xs font-bold">
                Generating QR...
              </div>
            )}
          </div>

          {/* Verification Metadata */}
          <div className="space-y-2 text-center sm:text-left text-xs text-zinc-400">
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">
                Booked For
              </span>
              <strong className="text-white text-sm">{ticket.userName}</strong>
            </div>

            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">
                Payment Status
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs">
                Paid (₹{ticket.totalAmount})
              </span>
            </div>

            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold block">
                Booking Reference
              </span>
              <span className="font-mono text-zinc-300 font-semibold">{ticket.referenceHash}</span>
            </div>
          </div>
        </div>

        {/* Print / Save Actions */}
        {onPrint && (
          <div className="pt-2 flex justify-end print:hidden">
            <button
              onClick={onPrint}
              className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Print Admission Pass
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Re-export TicketPass as alias
export const TicketPass = DigitalTicket;
export default DigitalTicket;
