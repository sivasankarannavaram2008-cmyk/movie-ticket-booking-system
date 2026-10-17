"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function BookingSuccessRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || searchParams.get("id") || searchParams.get("ref");

  useEffect(() => {
    if (bookingId) {
      router.replace(`/ticket/${encodeURIComponent(bookingId)}`);
    } else {
      router.replace("/");
    }
  }, [bookingId, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-center space-y-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white">Preparing your admission pass...</h2>
        <p className="text-xs text-zinc-400">Redirecting to verified digital ticket</p>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <BookingSuccessRedirect />
    </Suspense>
  );
}
