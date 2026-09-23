import { NextRequest, NextResponse } from "next/server";
import { acquireSeatLocks } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { showId, seatIds, userId } = body;

    // Validation
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

    if (seatIds.length > 10) {
      return NextResponse.json(
        { error: "Exceeded maximum lock limit of 10 seats per booking" },
        { status: 400 }
      );
    }

    // 5-minute TTL (300 seconds)
    const result = await acquireSeatLocks(showId, seatIds, userId, 300);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "One or more selected seats are currently locked by another customer.",
          collidingSeatIds: result.collidingSeats,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message: "Seats successfully reserved for checkout.",
        showId,
        lockedSeatIds: result.acquiredSeats,
        expiresAt: result.expiresAt,
        ttlSeconds: 300,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API /api/seats/lock error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while locking seats." },
      { status: 500 }
    );
  }
}
