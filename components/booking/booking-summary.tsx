import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, CreditCard } from "lucide-react";

export interface BookingSummaryProps {
  movieTitle: string;
  showtime: string;
  selectedSeats: string[];
  pricePerSeat: number;
  onConfirmBooking?: () => void;
}

export function BookingSummary({
  movieTitle,
  showtime,
  selectedSeats,
  pricePerSeat,
  onConfirmBooking,
}: BookingSummaryProps) {
  const total = selectedSeats.length * pricePerSeat;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" />
          Booking Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between border-b border-zinc-800 pb-2">
          <span className="text-zinc-400">Movie</span>
          <span className="font-medium text-white">{movieTitle}</span>
        </div>
        <div className="flex justify-between border-b border-zinc-800 pb-2">
          <span className="text-zinc-400">Showtime</span>
          <span className="font-medium text-white">{showtime}</span>
        </div>
        <div className="flex justify-between border-b border-zinc-800 pb-2">
          <span className="text-zinc-400">Selected Seats ({selectedSeats.length})</span>
          <span className="font-medium text-primary">
            {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
          </span>
        </div>
        <div className="flex justify-between pt-2 text-base font-semibold">
          <span className="text-white">Total Amount</span>
          <span className="text-white">${total.toFixed(2)}</span>
        </div>
        <Button
          className="w-full mt-4 flex items-center justify-center gap-2"
          disabled={selectedSeats.length === 0}
          onClick={onConfirmBooking}
        >
          <CreditCard className="w-4 h-4" />
          Proceed to Payment
        </Button>
      </CardContent>
    </Card>
  );
}
