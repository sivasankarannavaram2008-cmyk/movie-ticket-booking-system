-- ============================================================================
-- FULL CONSOLIDATED MTBS SCHEMA (Run this in Supabase SQL Editor)
-- Tables: cities, cinemas, screens, movies, shows, seats, bookings, booking_seats, booking_audit_logs
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

-- ----------------------------------------------------------------------------
-- 9. Booking Audit Logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT
);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
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
CREATE INDEX IF NOT EXISTS idx_booking_audit_logs_booking_id ON public.booking_audit_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_audit_logs_changed_at ON public.booking_audit_logs(changed_at);

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Public can view cinemas" ON public.cinemas FOR SELECT USING (true);
CREATE POLICY "Public can view screens" ON public.screens FOR SELECT USING (true);
CREATE POLICY "Public can view movies" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Public can view shows" ON public.shows FOR SELECT USING (true);
CREATE POLICY "Public can view seats" ON public.seats FOR SELECT USING (true);

CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Users can update bookings" ON public.bookings FOR UPDATE USING (true);
CREATE POLICY "Users can create booking_seats" ON public.booking_seats FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view booking_seats" ON public.booking_seats FOR SELECT USING (true);
CREATE POLICY "Users can delete booking_seats" ON public.booking_seats FOR DELETE USING (true);

CREATE POLICY "Public read audit logs" ON public.booking_audit_logs FOR SELECT USING (true);
CREATE POLICY "Public insert audit logs" ON public.booking_audit_logs FOR INSERT WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- PL/pgSQL Audit Log Trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.booking_audit_logs (
            booking_id,
            previous_status,
            new_status,
            changed_at,
            notes
        ) VALUES (
            NEW.id,
            OLD.status::text,
            NEW.status::text,
            now(),
            'Status changed from ' || COALESCE(OLD.status::text, 'UNKNOWN') || ' to ' || NEW.status::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_status_change ON public.bookings;

CREATE TRIGGER trg_booking_status_change
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.log_booking_status_change();
