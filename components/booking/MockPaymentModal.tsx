"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  CreditCard,
  QrCode,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Smartphone,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MockPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingPayload: {
    showId: string;
    seatIds: string[];
    seatLabels: string[];
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    totalAmount: number;
    movieTitle: string;
    cinemaName: string;
    screenName: string;
    date: string;
    time: string;
  };
}

export function MockPaymentModal({
  isOpen,
  onClose,
  bookingPayload,
}: MockPaymentModalProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"upi" | "card" | "netbanking">("upi");

  // Payment Form Fields
  const [upiVpa, setUpiVpa] = useState("aditya@okaxis");
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("789");
  const [cardHolder, setCardHolder] = useState(bookingPayload.userName || "Aditya Sharma");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  // Simulation Controls
  const [simulateSuccess, setSimulateSuccess] = useState(true);

  // Flow State
  // 1. 'form' -> 2. 'processing' -> 3. 'otp' -> 4. 'declined' | 'success'
  const [flowState, setFlowState] = useState<"form" | "processing" | "otp" | "declined" | "success">("form");
  const [otpValue, setOtpValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmedBookingId, setConfirmedBookingId] = useState("");

  if (!isOpen) return null;

  // Trigger simulated payment processing
  const handleInitiatePayment = () => {
    setErrorMessage("");
    setFlowState("processing");

    // 2-second simulated gateway handshake
    setTimeout(() => {
      setFlowState("otp");
    }, 2000);
  };

  // Execute booking confirmation request to /api/bookings/confirm
  const executePaymentConfirmation = async () => {
    setFlowState("processing");

    if (!simulateSuccess) {
      setTimeout(() => {
        setFlowState("declined");
        setErrorMessage("Transaction was declined by the issuing bank (Sandbox Simulation Mode).");
      }, 1000);
      return;
    }

    try {
      const generatedRef =
        "BMS-2026-" + Math.random().toString(36).substring(2, 8).toUpperCase();

      const payload = {
        showId: bookingPayload.showId,
        seatIds: bookingPayload.seatIds,
        userName: bookingPayload.userName,
        userEmail: bookingPayload.userEmail,
        userPhone: bookingPayload.userPhone,
        totalAmount: bookingPayload.totalAmount,
        bookingRef: generatedRef,
        seatLabels: bookingPayload.seatLabels,
        userId: bookingPayload.userId,
        movieTitle: bookingPayload.movieTitle,
        cinemaName: bookingPayload.cinemaName,
        screenName: bookingPayload.screenName,
        date: bookingPayload.date,
        time: bookingPayload.time,
      };

      const res = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || (!data.bookingId && !data.id)) {
        setFlowState("declined");
        setErrorMessage(data.error || "Failed to confirm booking record in Supabase.");
        return;
      }

      const confirmedId = data.bookingId || data.id;
      setConfirmedBookingId(confirmedId);
      setFlowState("success");

      // Route to /ticket/[bookingId] after celebration
      setTimeout(() => {
        onClose();
        router.push(`/ticket/${confirmedId}`);
      }, 1200);
    } catch (err) {
      console.error("Payment finalization failed:", err);
      setFlowState("declined");
      setErrorMessage("A network error occurred while confirming your reservation.");
    }
  };

  // Verify Mock OTP
  const handleVerifyOtp = async () => {
    if (otpValue.trim() !== "1234") {
      setErrorMessage("Invalid OTP. For test sandbox, please enter: 1234");
      return;
    }

    setErrorMessage("");
    await executePaymentConfirmation();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Secure Payment Gateway
              </h3>
              <p className="text-[11px] text-zinc-400">Sandbox Test Simulator • 256-Bit SSL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Toggle: Test Success vs Declined */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
          <span className="text-zinc-400 font-medium">Test Outcome Simulation:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSimulateSuccess(true)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                simulateSuccess
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Simulate Success
            </button>
            <button
              type="button"
              onClick={() => setSimulateSuccess(false)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                !simulateSuccess
                  ? "bg-rose-500 text-white shadow-sm"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              Simulate Decline
            </button>
          </div>
        </div>

        {/* Amount Pill */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-850 text-xs">
          <span className="text-zinc-400">Total Payable:</span>
          <span className="text-base font-black text-primary">
            ₹{bookingPayload.totalAmount.toFixed(2)}
          </span>
        </div>

        {/* FLOW STATES */}
        {flowState === "processing" && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center animate-in fade-in">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Contacting payment gateway...</h4>
              <p className="text-xs text-zinc-400">
                Please do not refresh or press the back button.
              </p>
            </div>
          </div>
        )}

        {flowState === "declined" && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Payment Declined</h4>
              <p className="text-xs text-rose-300 max-w-sm mx-auto">{errorMessage}</p>
            </div>
            <div className="pt-2 flex gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFlowState("form")}
              >
                Try Again
              </Button>
              <Button
                size="sm"
                className="bg-zinc-800 text-white hover:bg-zinc-700"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {flowState === "success" && (
          <div className="py-10 flex flex-col items-center justify-center space-y-4 text-center animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-white">Payment Successful!</h4>
              <p className="text-xs text-zinc-400">
                Generating your digital movie ticket pass...
              </p>
            </div>
          </div>
        )}

        {flowState === "otp" && (
          <div className="py-4 space-y-4 animate-in fade-in">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Bank OTP Verification</h4>
              <p className="text-xs text-zinc-400">
                An OTP has been sent to your registered mobile number.
              </p>
              <div className="inline-block mt-1 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
                💡 Sandbox Test OTP: <strong className="text-white">1234</strong>
              </div>
            </div>

            <div className="max-w-xs mx-auto space-y-2">
              <input
                type="text"
                maxLength={4}
                autoFocus
                placeholder="Enter 1234"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                className="w-full text-center text-xl font-bold tracking-widest h-12 rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errorMessage && (
                <p className="text-center text-xs text-rose-400">{errorMessage}</p>
              )}
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={otpValue.length !== 4}
              className="w-full font-bold py-3 bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25"
            >
              Verify & Authorize ₹{bookingPayload.totalAmount.toFixed(2)}
            </Button>
          </div>
        )}

        {flowState === "form" && (
          <>
            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab("upi")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "upi"
                    ? "bg-primary text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                UPI
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("card")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "card"
                    ? "bg-primary text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Card
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("netbanking")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "netbanking"
                    ? "bg-primary text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                Net Banking
              </button>
            </div>

            {/* TAB 1: UPI */}
            {activeTab === "upi" && (
              <div className="space-y-3.5 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Virtual Payment Address (UPI ID)
                  </label>
                  <input
                    type="text"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    placeholder="e.g. mobile@upi or name@okaxis"
                    className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-center p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 gap-4">
                  <div className="w-16 h-16 bg-white p-1 rounded-lg flex items-center justify-center shrink-0">
                    <QrCode className="w-full h-full text-black" />
                  </div>
                  <div className="text-left space-y-0.5">
                    <div className="text-xs font-bold text-white">Instant QR Code</div>
                    <div className="text-[11px] text-zinc-400">
                      Scan with Google Pay, PhonePe, or Paytm
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Cards */}
            {activeTab === "card" && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Valid Thru</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">CVV</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="***"
                      className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: Net Banking */}
            {activeTab === "netbanking" && (
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-zinc-300">Select Bank</label>
                <div className="grid grid-cols-2 gap-2">
                  {["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank"].map(
                    (bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          selectedBank === bank
                            ? "bg-primary/10 border-primary text-white font-bold"
                            : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <Building className="w-3.5 h-3.5 text-primary" />
                        <span>{bank}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Pay Button */}
            <Button
              onClick={handleInitiatePayment}
              className="w-full font-bold gap-2 py-3.5 bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 mt-2"
            >
              <Lock className="w-4 h-4" />
              Pay ₹{bookingPayload.totalAmount.toFixed(2)}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
