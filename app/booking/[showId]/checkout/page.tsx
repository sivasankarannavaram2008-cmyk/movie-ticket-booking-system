"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Utensils,
  Plus,
  Check,
  ShieldCheck,
  CreditCard,
  Popcorn,
  Coffee,
  Pizza,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MockPaymentModal } from "@/components/booking/MockPaymentModal";
import { MOCK_MOVIES, CITIES, getDefaultCinemaForCity } from "@/lib/mock-data";
import { useCity } from "@/context/CityContext";

interface FnBItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
}

const FNB_ITEMS: FnBItem[] = [
  {
    id: "fnb-1",
    name: "Caramel Popcorn (Tub 150g)",
    description: "Freshly popped gourmet corn with sweet golden glaze",
    price: 290,
    icon: "🍿",
  },
  {
    id: "fnb-2",
    name: "Cheesy Nachos & Salsa",
    description: "Crispy Mexican tortilla chips with warm spiced cheese sauce",
    price: 260,
    icon: "🧀",
  },
  {
    id: "fnb-3",
    name: "Classic Coke Float (500ml)",
    description: "Ice-cold Coca-Cola crowned with creamy vanilla scoop",
    price: 180,
    icon: "🥤",
  },
  {
    id: "fnb-4",
    name: "Paneer Tikka Roll",
    description: "Tandoor grilled cottage cheese wrapped in flaked flatbread",
    price: 240,
    icon: "🌯",
  },
  {
    id: "fnb-5",
    name: "Cinema Combo Saver",
    description: "Large Popcorn + 2 Pepsi (400ml) + Sweet Dip",
    price: 499,
    icon: "🎬",
  },
];

function CheckoutContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selectedCity, setCity } = useCity();

  const showId = (params.showId as string) || "show-1";
  const paramCity = searchParams.get("city") || searchParams.get("citySlug");
  const citySlug = paramCity || selectedCity.slug || "hyderabad";
  const movieId = searchParams.get("movieId") || "m-1";
  const rawSeats = searchParams.get("seats") || "A1,A2";
  const rawSeatIds = searchParams.get("seatIds");
  const userId = searchParams.get("userId") || "user_guest";

  const currentCity = CITIES.find((c) => c.slug.toLowerCase() === citySlug.toLowerCase()) || selectedCity;
  const cinemaInfo = getDefaultCinemaForCity(citySlug, showId);

  // Sync if URL has explicit city param that differs from context
  useEffect(() => {
    if (paramCity && paramCity.toLowerCase() !== selectedCity.slug.toLowerCase()) {
      setCity(paramCity);
    }
  }, [paramCity, selectedCity.slug, setCity]);

  const selectedSeatLabels = useMemo(() => {
    return rawSeats.split(",").map((s) => s.trim()).filter(Boolean);
  }, [rawSeats]);

  const selectedSeatIds = useMemo(() => {
    if (rawSeatIds) {
      return rawSeatIds.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return selectedSeatLabels.map((s) => `seat-${s}`);
  }, [rawSeatIds, selectedSeatLabels]);

  const movie = MOCK_MOVIES.find((m) => m.id === movieId) || MOCK_MOVIES[0];

  // Contact Information State
  const [userName, setUserName] = useState("Aditya Sharma");
  const [userEmail, setUserEmail] = useState("aditya.sharma@example.com");
  const [userPhone, setUserPhone] = useState("+91 98765 43210");

  // Selected F&B items state (Map: itemId -> quantity)
  const [selectedFnB, setSelectedFnB] = useState<Record<string, number>>({});

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Pricing calculations
  // Estimate ~₹250 average per seat if not specified
  const baseSeatPrice = useMemo(() => {
    return selectedSeatLabels.reduce((acc, seatLabel) => {
      const row = seatLabel.charAt(0).toUpperCase();
      if (row >= "G") return acc + 480; // Recliner
      if (row >= "D") return acc + 280; // Prime
      return acc + 180; // Classic
    }, 0);
  }, [selectedSeatLabels]);

  const fnbTotal = useMemo(() => {
    return Object.entries(selectedFnB).reduce((acc, [itemId, qty]) => {
      const item = FNB_ITEMS.find((f) => f.id === itemId);
      return acc + (item ? item.price * qty : 0);
    }, 0);
  }, [selectedFnB]);

  // Convenience fees: ₹30 per seat
  const convenienceFeeBase = selectedSeatLabels.length * 30;
  // 18% Integrated GST on convenience fees
  const gstAmount = Math.round(convenienceFeeBase * 0.18);
  const totalConvenienceFee = convenienceFeeBase + gstAmount;

  const grandTotal = baseSeatPrice + fnbTotal + totalConvenienceFee;

  // Toggle F&B item quantity
  const handleToggleFnB = (itemId: string) => {
    setSelectedFnB((prev) => {
      const current = prev[itemId] || 0;
      if (current > 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: 1 };
    });
  };

  const handleUpdateFnBQty = (itemId: string, delta: number) => {
    setSelectedFnB((prev) => {
      const nextQty = (prev[itemId] || 0) + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: nextQty };
    });
  };

  const bookingPayload = {
    showId,
    seatIds: selectedSeatIds,
    seatLabels: selectedSeatLabels,
    userId,
    userName,
    userEmail,
    userPhone,
    totalAmount: grandTotal,
    movieTitle: movie.title,
    cinemaName: cinemaInfo.cinemaName,
    screenName: cinemaInfo.screenName,
    date: new Date().toISOString().split("T")[0],
    time: "07:30 PM",
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Top Header */}
      <header className="sticky top-16 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href={`/booking/${showId}?city=${encodeURIComponent(citySlug)}&movieId=${movie.id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Seat Layout
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
            100% Safe & Secure Checkout
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Show Info, Contact Details, F&B Add-ons */}
          <div className="lg:col-span-7 space-y-6">
            {/* Movie & Show Info Card */}
            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/60 p-5 backdrop-blur-sm space-y-4">
              <div className="flex gap-4 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-16 h-24 rounded-xl object-cover border border-zinc-800 shrink-0"
                />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                    {cinemaInfo.screenTier || "IMAX 3D Laser"}
                  </span>
                  <h2 className="text-lg font-black text-white">{movie.title}</h2>
                  <p className="text-xs text-zinc-400">
                    {cinemaInfo.cinemaName} • {cinemaInfo.screenName} ({currentCity.name})
                  </p>
                  <div className="flex items-center gap-2 text-xs text-zinc-300 pt-0.5">
                    <span className="font-semibold text-white">Seats:</span>
                    <span className="text-primary font-bold">
                      {selectedSeatLabels.join(", ")}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span>Today, 07:30 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details Form */}
            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/60 p-5 backdrop-blur-sm space-y-3.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Share Ticket To
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-400">Full Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-400">Email Address</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-400">Mobile Number</label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* F&B Add-ons */}
            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/60 p-5 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Grab a Bite! (Food & Beverages)
                  </h3>
                </div>
                <span className="text-[11px] text-zinc-500">Delivered directly to seat</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FNB_ITEMS.map((item) => {
                  const qty = selectedFnB[item.id] || 0;
                  const isSelected = qty > 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                          : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0">{item.icon}</span>
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-xs font-bold text-white leading-tight">
                            {item.name}
                          </h4>
                          <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-850">
                        <span className="text-xs font-black text-white">₹{item.price}</span>

                        {isSelected ? (
                          <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleUpdateFnBQty(item.id, -1)}
                              className="px-2.5 py-1 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-bold text-white">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateFnBQty(item.id, 1)}
                              className="px-2.5 py-1 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleFnB(item.id)}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-primary text-white transition-colors"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Price Breakdown Order Summary */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-primary" />
                  Order Summary
                </h3>
                <span className="text-xs font-semibold text-zinc-400">
                  {selectedSeatLabels.length} {selectedSeatLabels.length === 1 ? "Ticket" : "Tickets"}
                </span>
              </div>

              {/* Price Details */}
              <div className="space-y-3 text-xs text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-400">
                    Ticket Fare ({selectedSeatLabels.join(", ")})
                  </span>
                  <span className="font-semibold text-white">₹{baseSeatPrice.toFixed(2)}</span>
                </div>

                {fnbTotal > 0 && (
                  <div className="flex justify-between text-amber-300">
                    <span>Food & Beverages Add-ons</span>
                    <span className="font-semibold">₹{fnbTotal.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-zinc-400">
                    Convenience Fee ({selectedSeatLabels.length} × ₹30)
                  </span>
                  <span className="text-zinc-300">₹{convenienceFeeBase.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-400">Integrated GST (18%)</span>
                  <span className="text-zinc-300">₹{gstAmount.toFixed(2)}</span>
                </div>

                <div className="border-t border-zinc-800 pt-4 flex justify-between items-baseline">
                  <div>
                    <div className="text-sm font-black text-white">Grand Total</div>
                    <div className="text-[10px] text-zinc-500">Includes all taxes & fees</div>
                  </div>
                  <div className="text-2xl font-black text-primary">
                    ₹{grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Checkout Trigger */}
              <Button
                size="lg"
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full font-bold gap-2 py-4 text-base bg-primary hover:bg-primary-hover shadow-xl shadow-primary/30"
              >
                <CreditCard className="w-5 h-5" />
                Pay ₹{grandTotal.toFixed(2)}
              </Button>

              <div className="text-center text-[11px] text-zinc-500">
                By clicking proceed, you agree to My Movie Booking cancellation & booking terms.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simulated Payment Gateway Modal */}
      <MockPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        bookingPayload={bookingPayload}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
          <div className="h-48 bg-zinc-900 rounded-2xl animate-pulse" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
