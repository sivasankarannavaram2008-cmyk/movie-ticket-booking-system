-- ============================================================================
-- Migration: 002_audit_logs.sql
-- Description: Audit logging table and PL/pgSQL trigger for booking status transitions
-- ============================================================================

-- 1. Create booking_audit_logs table
CREATE TABLE IF NOT EXISTS public.booking_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT
);

-- Index for fast lookup by booking_id and changed_at
CREATE INDEX IF NOT EXISTS idx_booking_audit_logs_booking_id ON public.booking_audit_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_audit_logs_changed_at ON public.booking_audit_logs(changed_at);

-- Enable RLS
ALTER TABLE public.booking_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for booking_audit_logs
CREATE POLICY "Public read audit logs" ON public.booking_audit_logs FOR SELECT USING (true);
CREATE POLICY "Public insert audit logs" ON public.booking_audit_logs FOR INSERT WITH CHECK (true);

-- 2. Create PL/pgSQL trigger function
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

-- 3. Attach trigger to bookings table
DROP TRIGGER IF EXISTS trg_booking_status_change ON public.bookings;

CREATE TRIGGER trg_booking_status_change
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.log_booking_status_change();
