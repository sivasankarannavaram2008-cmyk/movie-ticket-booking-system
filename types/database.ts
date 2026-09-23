export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ScreenTier = "IMAX" | "4DX" | "Standard";
export type SeatType = "CLASSIC" | "PRIME" | "RECLINER";
export type BookingStatus = "LOCKED" | "CONFIRMED" | "CANCELLED";

export interface Database {
  public: {
    Tables: {
      cities: {
        Row: {
          id: string;
          name: string;
          state: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          state: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          state?: string;
          slug?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      cinemas: {
        Row: {
          id: string;
          name: string;
          city_id: string;
          address: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city_id: string;
          address: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          city_id?: string;
          address?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cinemas_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          }
        ];
      };
      screens: {
        Row: {
          id: string;
          cinema_id: string;
          name: string;
          screen_tier: ScreenTier;
          created_at: string;
        };
        Insert: {
          id?: string;
          cinema_id: string;
          name: string;
          screen_tier?: ScreenTier;
          created_at?: string;
        };
        Update: {
          id?: string;
          cinema_id?: string;
          name?: string;
          screen_tier?: ScreenTier;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "screens_cinema_id_fkey";
            columns: ["cinema_id"];
            isOneToOne: false;
            referencedRelation: "cinemas";
            referencedColumns: ["id"];
          }
        ];
      };
      movies: {
        Row: {
          id: string;
          title: string;
          poster_url: string;
          backdrop_url: string | null;
          genre: string[];
          duration_min: number;
          release_date: string;
          censor_rating: string;
          languages: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          poster_url: string;
          backdrop_url?: string | null;
          genre?: string[];
          duration_min: number;
          release_date: string;
          censor_rating?: string;
          languages?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          poster_url?: string;
          backdrop_url?: string | null;
          genre?: string[];
          duration_min?: number;
          release_date?: string;
          censor_rating?: string;
          languages?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      shows: {
        Row: {
          id: string;
          screen_id: string;
          movie_id: string;
          date: string;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          screen_id: string;
          movie_id: string;
          date: string;
          start_time: string;
          end_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          screen_id?: string;
          movie_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shows_screen_id_fkey";
            columns: ["screen_id"];
            isOneToOne: false;
            referencedRelation: "screens";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shows_movie_id_fkey";
            columns: ["movie_id"];
            isOneToOne: false;
            referencedRelation: "movies";
            referencedColumns: ["id"];
          }
        ];
      };
      seats: {
        Row: {
          id: string;
          screen_id: string;
          row_label: string;
          seat_number: number;
          seat_type: SeatType;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          screen_id: string;
          row_label: string;
          seat_number: number;
          seat_type?: SeatType;
          price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          screen_id?: string;
          row_label?: string;
          seat_number?: number;
          seat_type?: SeatType;
          price?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seats_screen_id_fkey";
            columns: ["screen_id"];
            isOneToOne: false;
            referencedRelation: "screens";
            referencedColumns: ["id"];
          }
        ];
      };
      bookings: {
        Row: {
          id: string;
          show_id: string;
          user_name: string;
          user_email: string;
          user_phone: string;
          total_amount: number;
          status: BookingStatus;
          booking_ref?: string | null;
          qr_code_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          show_id: string;
          user_name: string;
          user_email: string;
          user_phone: string;
          total_amount: number;
          status?: BookingStatus;
          booking_ref?: string | null;
          qr_code_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          show_id?: string;
          user_name?: string;
          user_email?: string;
          user_phone?: string;
          total_amount?: number;
          status?: BookingStatus;
          booking_ref?: string | null;
          qr_code_hash?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_show_id_fkey";
            columns: ["show_id"];
            isOneToOne: false;
            referencedRelation: "shows";
            referencedColumns: ["id"];
          }
        ];
      };
      booking_seats: {
        Row: {
          id: string;
          booking_id: string;
          seat_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          seat_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          seat_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_seats_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_seats_seat_id_fkey";
            columns: ["seat_id"];
            isOneToOne: false;
            referencedRelation: "seats";
            referencedColumns: ["id"];
          }
        ];
      };
      booking_audit_logs: {
        Row: {
          id: string;
          booking_id: string;
          previous_status: string | null;
          new_status: string;
          changed_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          booking_id: string;
          previous_status?: string | null;
          new_status: string;
          changed_at?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          booking_id?: string;
          previous_status?: string | null;
          new_status?: string;
          changed_at?: string;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "booking_audit_logs_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      screen_tier: ScreenTier;
      seat_type: SeatType;
      booking_status: BookingStatus;
    };
  };
}

// Convenience Type Aliases
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type City = Tables<"cities">;
export type Cinema = Tables<"cinemas">;
export type Screen = Tables<"screens">;
export type Movie = Tables<"movies">;
export type Show = Tables<"shows">;
export type Seat = Tables<"seats">;
export type Booking = Tables<"bookings">;
export type BookingSeat = Tables<"booking_seats">;
export type BookingAuditLog = Tables<"booking_audit_logs">;

export type CityInsert = InsertTables<"cities">;
export type CinemaInsert = InsertTables<"cinemas">;
export type ScreenInsert = InsertTables<"screens">;
export type MovieInsert = InsertTables<"movies">;
export type ShowInsert = InsertTables<"shows">;
export type SeatInsert = InsertTables<"seats">;
export type BookingInsert = InsertTables<"bookings">;
export type BookingSeatInsert = InsertTables<"booking_seats">;
export type BookingAuditLogInsert = InsertTables<"booking_audit_logs">;
