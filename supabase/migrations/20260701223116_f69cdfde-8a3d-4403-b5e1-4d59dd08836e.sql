
-- 1. Extend role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'principal';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vice_principal';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'media_coordinator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'academic_coordinator';

-- 2. Profile lifecycle fields (session + account status)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','suspended','invited'));

-- 3. Broaden is_staff() to include every administrative role.
--    Done in a separate transaction-safe rewrite so newly added enum
--    labels above become visible (Postgres commits enum values before
--    they can be used in expressions in the same statement batch).
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN (
        'super_admin','admin','principal','vice_principal',
        'media_coordinator','academic_coordinator','editor'
      )
  );
$$;
