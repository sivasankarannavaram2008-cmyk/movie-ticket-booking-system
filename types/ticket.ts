export interface InMemTicket {
  bookingId: string;
  referenceHash: string;
  showId: string;
  movieTitle: string;
  cinemaName: string;
  screenName: string;
  date: string;
  time: string;
  seatLabels: string[];
  userName: string;
  userEmail: string;
  userPhone: string;
  totalAmount: number;
  qrData: string;
  createdAt: string;
}
