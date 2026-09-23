import { InMemTicket } from "@/types/ticket";

export interface StoredBooking {
  id: string;
  refId: string;
  showId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  movieTitle: string;
  cinemaName: string;
  screenName: string;
  showDate: string;
  showTime: string;
  seats: string[];
  seatIds: string[];
  totalAmount: number;
  status: "CONFIRMED" | "CANCELLED" | "LOCKED";
  createdAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __globalBookingStore: StoredBooking[] | undefined;
}

function getInitialSampleBookings(): StoredBooking[] {
  const now = Date.now();
  const today = new Date().toISOString().split("T")[0];

  return [
    {
      id: "booking-sample-1",
      refId: "BMS-2026-A8F19B",
      showId: "show-sample-1",
      customerName: "Aarav Sharma",
      customerEmail: "aarav.sharma@gmail.com",
      customerPhone: "+91 98201 44521",
      movieTitle: "Kalki 2898 AD",
      cinemaName: "PVR INOX Palladium",
      screenName: "Audi 1 - Laser IMAX",
      showDate: today,
      showTime: "10:30 AM",
      seats: ["F4", "F5"],
      seatIds: ["seat-f-4", "seat-f-5"],
      totalAmount: 620,
      status: "CONFIRMED",
      createdAt: new Date(now - 3600000 * 3).toISOString(),
    },
    {
      id: "booking-sample-2",
      refId: "BMS-2026-C4B2E1",
      showId: "show-sample-2",
      customerName: "Priya Patel",
      customerEmail: "priya.p@outlook.com",
      customerPhone: "+91 97112 39088",
      movieTitle: "Jawan: Extended Cut",
      cinemaName: "Cinépolis Grand Mall",
      screenName: "Screen 2 - Macro XE",
      showDate: today,
      showTime: "01:45 PM",
      seats: ["D6", "D7", "D8"],
      seatIds: ["seat-d-6", "seat-d-7", "seat-d-8"],
      totalAmount: 890,
      status: "CONFIRMED",
      createdAt: new Date(now - 3600000 * 2).toISOString(),
    },
    {
      id: "booking-sample-3",
      refId: "BMS-2026-D9A3F0",
      showId: "show-sample-3",
      customerName: "Ravi Kumar",
      customerEmail: "ravi.k@techmail.in",
      customerPhone: "+91 94451 88204",
      movieTitle: "Devara: Part 1",
      cinemaName: "Prasads Multiplex",
      screenName: "Screen 6 - Large Format",
      showDate: today,
      showTime: "05:15 PM",
      seats: ["E10"],
      seatIds: ["seat-e-10"],
      totalAmount: 350,
      status: "CONFIRMED",
      createdAt: new Date(now - 3600000).toISOString(),
    },
  ];
}

export function getBookingStore(): StoredBooking[] {
  if (!global.__globalBookingStore) {
    global.__globalBookingStore = getInitialSampleBookings();
  }
  return global.__globalBookingStore;
}

export function addBookingToStore(booking: StoredBooking): StoredBooking {
  const store = getBookingStore();
  // Prepend newest booking to the front
  store.unshift(booking);
  return booking;
}

export function cancelBookingInStore(bookingId: string): boolean {
  const store = getBookingStore();
  const target = store.find((b) => b.id === bookingId || b.refId === bookingId);
  if (target) {
    target.status = "CANCELLED";
    return true;
  }
  return false;
}
