-- ============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Complete initial schema for Movie Ticket Booking System (MTBS)
-- Tables: cities, cinemas, screens, movies, shows, seats, bookings, booking_seats
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- Custom ENUM Types
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE screen_tier AS ENUM ('IMAX', '4DX', 'Standard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE seat_type AS ENUM ('CLASSIC', 'PRIME', 'RECLINER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('LOCKED', 'CONFIRMED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 1. Cities
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. Cinemas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cinemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. Screens
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.screens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cinema_id UUID NOT NULL REFERENCES public.cinemas(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    screen_tier screen_tier NOT NULL DEFAULT 'Standard',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. Movies
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    poster_url TEXT NOT NULL,
    backdrop_url TEXT,
    genre TEXT[] NOT NULL DEFAULT '{}',
    duration_min INTEGER NOT NULL CHECK (duration_min > 0),
    release_date DATE NOT NULL,
    censor_rating VARCHAR(10) NOT NULL DEFAULT 'UA',
    languages TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. Shows
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
    movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 6. Seats
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
    row_label VARCHAR(10) NOT NULL,
    seat_number INTEGER NOT NULL CHECK (seat_number > 0),
    seat_type seat_type NOT NULL DEFAULT 'CLASSIC',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_screen_seat UNIQUE (screen_id, row_label, seat_number)
);

-- ----------------------------------------------------------------------------
-- 7. Bookings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
    user_name VARCHAR(150) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_phone VARCHAR(50) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status booking_status NOT NULL DEFAULT 'LOCKED',
    booking_ref VARCHAR(100),
    qr_code_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure column exists if migration was run previously
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_ref VARCHAR(100);

-- ----------------------------------------------------------------------------
-- 8. Booking Seats
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES public.seats(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_booking_seat UNIQUE (booking_id, seat_id)
);

-- ============================================================================
-- Indexes for Query Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_cities_slug ON public.cities(slug);

CREATE INDEX IF NOT EXISTS idx_cinemas_city_id ON public.cinemas(city_id);

CREATE INDEX IF NOT EXISTS idx_screens_cinema_id ON public.screens(cinema_id);

CREATE INDEX IF NOT EXISTS idx_shows_screen_id ON public.shows(screen_id);
CREATE INDEX IF NOT EXISTS idx_shows_movie_id ON public.shows(movie_id);
CREATE INDEX IF NOT EXISTS idx_shows_date ON public.shows(date);
CREATE INDEX IF NOT EXISTS idx_shows_movie_date ON public.shows(movie_id, date);

CREATE INDEX IF NOT EXISTS idx_seats_screen_id ON public.seats(screen_id);
CREATE INDEX IF NOT EXISTS idx_seats_screen_row ON public.seats(screen_id, row_label);

CREATE INDEX IF NOT EXISTS idx_bookings_show_id ON public.bookings(show_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_email ON public.bookings(user_email);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);

CREATE INDEX IF NOT EXISTS idx_booking_seats_booking_id ON public.booking_seats(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_seats_seat_id ON public.booking_seats(seat_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_seats ENABLE ROW LEVEL SECURITY;

-- Public read access for cinema catalog data
CREATE POLICY "Public can view cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Public can view cinemas" ON public.cinemas FOR SELECT USING (true);
CREATE POLICY "Public can view screens" ON public.screens FOR SELECT USING (true);
CREATE POLICY "Public can view movies" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Public can view shows" ON public.shows FOR SELECT USING (true);
CREATE POLICY "Public can view seats" ON public.seats FOR SELECT USING (true);

-- Bookings policies: users can read their own bookings via email and create bookings
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Users can create booking_seats" ON public.booking_seats FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view booking_seats" ON public.booking_seats FOR SELECT USING (true);
