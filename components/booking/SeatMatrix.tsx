"use client";

import React from "react";
import { Check, Armchair, AlertCircle, Lock, Hourglass } from "lucide-react";

export interface SeatData {
  id: string;
  rowLabel: string;
  seatNumber: number;
  label: string; // e.g. "A10"
  seatType: "CLASSIC" | "PRIME" | "RECLINER";
  price: number;
  isOccupied: boolean;
  isBlocked?: boolean;
}

interface SeatMatrixProps {
  seats: SeatData[];
  selectedSeatIds: string[];
  lockedByOthersSeatIds?: string[];
  blockedSeatIds?: string[];
  onToggleSeat: (seat: SeatData) => void;
  maxSeats?: number;
  errorNotice?: string | null;
  countdownTimer?: string | null; // e.g. "04:59"
}

export function SeatMatrix({
  seats,
  selectedSeatIds,
  lockedByOthersSeatIds = [],
  blockedSeatIds = [],
  onToggleSeat,
  maxSeats = 10,
  errorNotice,
  countdownTimer,
}: SeatMatrixProps) {
  // Display Order: Recliner (Back) -> Prime (Middle) -> Classic (Front closest to screen)
  const tiersOrder: Array<"RECLINER" | "PRIME" | "CLASSIC"> = ["RECLINER", "PRIME", "CLASSIC"];

  const tierMeta = {
    RECLINER: { label: "RECLINER", subtitle: "Luxury VIP Reclining Seats" },
    PRIME: { label: "PRIME", subtitle: "Premium Central Viewing" },
    CLASSIC: { label: "CLASSIC", subtitle: "Standard Cinema View" },
  };

  return (
    <div className="w-full flex flex-col items-center space-y-8 select-none">
      {/* Top Banner: Active 5-Minute Reservation Countdown Timer */}
      {countdownTimer && (
        <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-sm shadow-lg shadow-amber-500/15 animate-pulse">
          <Hourglass className="w-4 h-4 text-amber-400" />
          <span>Seats held for <strong className="text-white font-black tracking-wider">{countdownTimer}</strong></span>
        </div>
      )}

      {/* Legend with Concurrency Lock Indicator */}
      <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-7 py-3 px-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t-md rounded-b-sm border border-zinc-600 bg-zinc-900/60 flex items-center justify-center text-[10px] text-zinc-400">
            1
          </div>
          <span>Available</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t-md rounded-b-sm bg-emerald-500 border border-emerald-400 flex items-center justify-center text-[10px] text-white font-bold shadow-sm shadow-emerald-500/50">
            <Check className="w-3 h-3" />
          </div>
          <span className="text-emerald-400 font-medium">Selected</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t-md rounded-b-sm bg-amber-500/20 border border-amber-500/60 text-amber-400 flex items-center justify-center text-[10px]">
            <Lock className="w-3 h-3" />
          </div>
          <span className="text-amber-400 font-medium">Locked by Others</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-t-md rounded-b-sm bg-zinc-800/80 border border-zinc-800 text-zinc-600 flex items-center justify-center text-[10px] cursor-not-allowed">
            ✕
          </div>
          <span className="text-zinc-500">Sold / Occupied</span>
        </div>
      </div>

      {/* Warning Notice for Collisions or Exceeded Limit */}
      {errorNotice && (
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs sm:text-sm text-amber-300 font-medium animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Scrollable / Pannable Seat Grid Area */}
      <div className="w-full overflow-x-auto pb-8 pt-2 no-scrollbar">
        <div className="min-w-[680px] max-w-4xl mx-auto px-4 space-y-8 flex flex-col items-center">
          {tiersOrder.map((tierKey) => {
            const tierSeats = seats.filter((s) => s.seatType === tierKey);
            if (tierSeats.length === 0) return null;

            // Group by row label
            const rowMap = new Map<string, SeatData[]>();
            for (const s of tierSeats) {
              if (!rowMap.has(s.rowLabel)) rowMap.set(s.rowLabel, []);
              rowMap.get(s.rowLabel)!.push(s);
            }

            // Sort rows descending (O down to M, L down to F, E down to A)
            // so Row A is nearest to the screen at the bottom
            const sortedRowLabels = Array.from(rowMap.keys()).sort((a, b) => b.localeCompare(a));

            const samplePrice = tierSeats[0]?.price || 0;

            return (
              <div key={tierKey} className="w-full space-y-3">
                {/* Tier Separator Header */}
                <div className="flex items-center justify-between border-b border-zinc-800/85 pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-200 tracking-wider">
                      {tierMeta[tierKey].label}
                    </span>
                    <span className="text-zinc-500 text-[11px] hidden sm:inline">
                      • {tierMeta[tierKey].subtitle}
                    </span>
                  </div>
                  <span className="font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                    ₹{samplePrice}
                  </span>
                </div>

                {/* Rows Grid */}
                <div className="space-y-2.5">
                  {sortedRowLabels.map((rowLabel) => {
                    const rSeats = (rowMap.get(rowLabel) || []).sort((a, b) => a.seatNumber - b.seatNumber);

                    return (
                      <div key={rowLabel} className="flex items-center justify-center gap-2 sm:gap-3">
                        {/* Left Row Indicator */}
                        <span className="w-6 text-center text-xs font-bold text-zinc-500">
                          {rowLabel}
                        </span>

                        {/* Seats Array with center aisle partition between column 6 and 7 */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {rSeats.map((seat) => {
                            const isSelected = selectedSeatIds.includes(seat.id);
                            const isOccupied = seat.isOccupied;
                            const isLockedByOthers = lockedByOthersSeatIds.includes(seat.id);
                            const isBlocked = Boolean(seat.isBlocked || (blockedSeatIds && blockedSeatIds.includes(seat.id)));
                            const isDisabled = isOccupied || isLockedByOthers || isBlocked;

                            // Exact aisle corridor gap between seat column 6 and column 7
                            const isAisleBreak = seat.seatNumber === 7;

                            return (
                              <React.Fragment key={seat.id}>
                                {isAisleBreak && (
                                  <div className="w-5 sm:w-9" aria-hidden="true" />
                                )}
                              <button
                                type="button"
                                disabled={isDisabled}
                                onClick={() => onToggleSeat(seat)}
                                title={
                                  isBlocked
                                    ? `Seat ${seat.label} is currently unavailable (Maintenance)`
                                    : isOccupied
                                    ? `Seat ${seat.label} is already booked`
                                    : isLockedByOthers
                                    ? `Seat ${seat.label} is currently locked by another customer`
                                    : `Seat ${seat.label} - ₹${seat.price}`
                                }
                                className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-t-lg rounded-b-sm text-[11px] font-semibold transition-all duration-150 flex items-center justify-center ${
                                  isBlocked
                                    ? "bg-zinc-900/60 border border-zinc-800/80 text-zinc-600 cursor-not-allowed"
                                    : isOccupied
                                    ? "bg-zinc-800/40 border border-zinc-800/60 text-zinc-500 font-medium cursor-not-allowed"
                                    : isLockedByOthers
                                    ? "bg-amber-500/20 border border-amber-500/60 text-amber-400 cursor-not-allowed shadow-sm"
                                    : isSelected
                                    ? "bg-emerald-500 text-white font-bold border border-emerald-400 shadow-md shadow-emerald-500/40 scale-105"
                                    : "bg-zinc-900 border border-zinc-700/80 text-zinc-200 hover:border-primary hover:text-white hover:bg-zinc-800/80 hover:scale-105 active:scale-95"
                                }`}
                              >
                                {isSelected ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : isLockedByOthers ? (
                                  <Lock className="w-3 h-3" />
                                ) : isBlocked ? (
                                  <span className="text-[9px] text-zinc-600 font-bold">✕</span>
                                ) : (
                                  seat.seatNumber
                                )}
                              </button>
                            </React.Fragment>
                            );
                          })}
                        </div>

                      {/* Right Row Indicator */}
                      <span className="w-6 text-center text-xs font-bold text-zinc-500">
                        {rowLabel}
                      </span>
                    </div>
                  );
                })}
                </div>
              </div>
            );
          })}

          {/* Curved Cinema Screen Bar */}
          <div className="w-full pt-10 pb-4 flex flex-col items-center space-y-3">
            <div className="w-3/4 max-w-lg h-2 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent rounded-full blur-sm" />
            <div className="relative w-full max-w-md h-6">
              <svg
                viewBox="0 0 400 30"
                className="w-full h-full text-zinc-600 overflow-visible"
                preserveAspectRatio="none"
              >
                <path
                  d="M 10,25 Q 200,5 390,25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="drop-shadow-[0_4px_12px_rgba(56,189,248,0.35)]"
                />
              </svg>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-zinc-400">
              <Armchair className="w-4 h-4 text-cyan-400/80" />
              <span>All Eyes This Way Please</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
