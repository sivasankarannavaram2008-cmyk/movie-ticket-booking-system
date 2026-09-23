import { NextRequest, NextResponse } from "next/server";
import { releaseSeatLocks } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { showId, seatIds, userId, force } = body;

    if (!showId || typeof showId !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing showId parameter" },
        { status: 400 }
      );
    }

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json(
        { error: "seatIds must be a non-empty array of seat identifiers" },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing userId identifier" },
        { status: 400 }
      );
    }

    const isForce = Boolean(force) || userId === "admin";
    const { releasedSeats } = await releaseSeatLocks(showId, seatIds, userId, isForce);

    return NextResponse.json(
      {
        message: "Seat locks successfully released.",
        showId,
        releasedSeats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API /api/seats/unlock error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while releasing seat locks." },
      { status: 500 }
    );
  }
}
